[English](01-design.md) | 中文

# B.1 设计（0.1.0-draft）

版本：`0.1.0-draft`　状态：`Draft`　日期：2026-09-27

> 0.1.0：初稿，由 A.1 0.3.0 去掉公开账本推导而来。尚未实现；下文所有数字都是 A.1 实测值扣除被删掉的托管转移后的估计。

## 0. B.1 为什么存在

双账本代币无法隐藏供应量中有多少处于机密状态：公开账本守恒，每次划转都是一次公开的余额变动（Track B README、A.1 03-deployments）。有些部署（闭环结算、会员积分、受监管工具）不需要 DeFi 可组合性，却需要隐藏这个总量。B.1 用相对 A.1 最小的改动回应这个需求，让 A.1 上已经验证过的一切（电路、安全自审、客户端库、监管流程）都能沿用。

## 1. 与 A.1 的关系

| | A.1 | B.1 |
| --- | --- | --- |
| 机密账户模型 | pk = s⁻¹·H，id = low160(Poseidon(pk))，pk 不上链 | **完全相同** |
| 余额密文、available / pending / folded、nonce、foldedAtBlock、lastReceivedAtBlock、decryptable | 同 0.3.0 | **完全相同** |
| `0x01` 转账电路（15 个打包公开输入）、memo、监管密文 | 同 0.3.0 | **完全相同，链上可直接复用同一个验证器合约** |
| `0x80` 折叠电路 | 同 0.3.0 | **完全相同** |
| `0x04` unshield 电路（7 个公开输入，金额公开） | 把托管释放到公开地址 | **原样复用为销毁证明**（`0x81`）：电路只证明「我拥有 ≥ amount 且这是扣款密文」，合约拿这个金额做什么是合约的事 |
| 公开账本（`OpenZeppelin ERC20` 余额） | 有 | **删除** |
| `0x03` shield | 公开 → 机密，任何人，无证明 | **改为 `mint(id, amount)`**，MINTER 角色，`totalSupply += amount` |
| `0x04` unshield | 机密 → 公开地址 | **改为 `0x81` 销毁**：`transferFrom(id, address(0), amount)`，`totalSupply −= amount` |
| `balanceOf` | 公开余额 | **恒为 0**（Track 决定 B-1） |
| 无 payload 的 `transfer` / `transferFrom` | 公开 ERC-20 转账 | **revert `NoPublicLedger()`**（B-3） |
| 托管地址 / `shieldedSupply()` | `balanceOf(this) == shieldedSupply()` | **不存在**；没有需要对账的东西 |
| `prepare` / `cancel` | `0x01` 与 `0x04` | `0x01` 与 `0x81` |
| 监管密钥、轮换、`regulatorKey()` 视图 | 同 0.3.0 | **完全相同** |
| `pep()` | `"A:1:0.3.0"` | `"B:1:0.1.0"` |

所有标为「完全相同」的部分是复制，不是共享：Variant 保持自包含（ADR-0002）。Solidity 源码将是 `ConfidentialERC20A1` 删掉公开账本路径后的副本；电路则是逐字节相同的文件（A.1 已部署的链上验证器可以直接指向）。

## 2. ERC-20 表面

```solidity
function totalSupply() external view returns (uint256);            // 铸造 − 销毁，公开
function balanceOf(address) external pure returns (uint256);       // 恒为 0
function transfer(address to, uint256 x) external returns (bool);  // 必须带 payload，见 §3
function transferFrom(address from, address to, uint256 x) external returns (bool);
function approve(address, uint256) external returns (bool);        // 无实际语义：不记录任何有用的东西
function allowance(address, address) external view returns (uint256); // 恒为 0
function mint(address id, uint256 amount) external;                // MINTER_ROLE
function decimals() external pure returns (uint8);                 // 6
```

`transfer(to, x)` 没有公开的付款方，所以 B.1 只给它一种含义：**带 `0x01` payload 时拒绝**（`0x01` 需要 `from` = 机密 id，而 `transfer` 带不了），不带 payload 时 revert。实际上 B.1 的每个操作都走 `transferFrom`。保留这个选择器只是为了让代币在 ABI 意义上仍然*是*一个 ERC-20。

## 3. payload 类型

| type | 含义 | `from` | `to` | `x` | 证明 | 供应量 |
| --- | --- | --- | --- | --- | --- | --- |
| `0x01` | 机密 → 机密 | 机密 id | 机密 id | 句柄 | 是（A.1 转账电路） | 0 |
| `0x80` | 折叠 | 机密 id | 同一 id | 句柄 | 是（A.1 折叠电路） | 0 |
| `0x81` | **销毁**（B.1 私有） | 机密 id | `address(0)` | 公开金额 | 是（A.1 unshield 电路） | −x |
| `0x03`、`0x04` | 仅 Track A | — | — | — | — | revert `TypeNotAllowedHere` |

flags 沿用家族的（`includePending`、`decryptable`）。句柄沿用家族的（`keccak256(payload) | 2²⁵⁵`）。`0x01`、`0x80`、`0x81` 的 payload 字节布局分别与 A.1 的 `0x01`、`0x80`、`0x04` 完全一致。

## 4. 状态

```solidity
struct Account { Ciphertext available; Ciphertext pending; Ciphertext folded;
                 uint64 nonce; uint64 foldedAtBlock; uint64 lastReceivedAtBlock; bytes decryptable; }
mapping(address id => Account) _accounts;
mapping(address id => mapping(uint256 handle => Prepared)) _prepared;
uint256 totalSupply;                      // 唯一公开的聚合量
RegulatorKey[] _regulatorKeys; uint32 activeRegulatorKeyId;
```

不变量（编号延续 A.1）：

| # | 不变量 |
| --- | --- |
| I1 | 所有 id 的 plaintext(available + pending − folded) 之和 == `totalSupply`（只有监管方或持有全部密钥的人能检查；链上无法检查） |
| I2 | `totalSupply ≤ 2⁶⁴ − 1`，每个账户余额 < 2⁶⁴，每笔操作金额 < 2⁴⁸（A1-0005 不变） |
| I3–I5 | 同 A.1（每份密文只有一个写者、pending / folded 单调、nonce 严格递增） |

## 5. 流程

### 5.1 铸造

```
require MINTER_ROLE; require id != 0; require amount < 2^48; require totalSupply + amount ≤ 2^64 − 1
totalSupply += amount
_accounts[id].pending += (amount·G, 0) ; lastReceivedAtBlock = block.number
emit Transfer(address(0), id, amount); emit Minted(id, amount)
```

与 A.1 的 shield 相同，只是没有托管转移（约 −20k gas）。收款方从 `Minted` 事件（公开）得知金额，与 A.1 从 `LedgerCrossing` 得知完全一样。

### 5.2 `0x01` 机密转账、`0x80` 折叠

逐字与 A.1 §4.2 / §4.3 / §4.6 相同。

### 5.3 `0x81` 销毁

```
require to == address(0); require amount < 2^48
u = parseUnshield(payload)                          // 与 A.1 0x04 同一个解析器
verify(unshieldVerifier, pub = [from | nonce<<160, this | chainId<<160, amount | signBits<<48, xs[4]])
_applySpend(_accounts[from], (u.Camt, u.Dsender), u.decryptable, flags)
totalSupply -= amount
emit Transfer(from, address(0), amount); emit Burned(from, amount)
```

与 A.1 的 `0x04` 一样可中继、可 prepare。没有「收款方」：公开金额就此消失。

## 6. 电路

没有新电路。A.1 的 `transfer.circom`、`fold.circom`、`unshield.circom` 原样复用；一条链上已为 A.1 部署的验证器合约可以直接传给 B.1 的构造函数。公开输入绑定了 `contractAddr`，为 A.1 代币生成的证明不能重放到 B.1 代币上，反之亦然。

## 7. 事件

| 事件 | 字段 | 时机 |
| --- | --- | --- |
| `Transfer` | `(from, to, x)` | 每个操作（家族 §7）；铸造 / 销毁使用零地址，这正是索引器对供应量变化的预期 |
| `Minted` | `(id, amount)` | 铸造 |
| `Burned` | `(id, amount)` | `0x81` |
| `ConfidentialTransfer`、`ConfidentialTransferPrepared`、`OperationPrepared`、`PreparedExecuted`、`PreparedCancelled`、`Folded`、`RegulatorKeyRotated` | 同 A.1 | 同 A.1 |

`LedgerCrossing` 不存在（没有另一个账本）。

## 8. 视图

`confidentialAccountOf(id)`、`preparedOf`、`regulatorKey`、`regulatorKeyCount`、`pep()` 与 ERC-165 同 A.1。`shieldedSupply()` 删除。

## 9. 隐私目标评估（家族约定 §12）

| 目标 | 达成 | 说明 |
| --- | --- | --- |
| P1 金额隐藏 | 完全 | 同 A.1 |
| P2 收款方 | 化名（稳定 id） | 同 A.1 |
| P3 付款方 | 化名（稳定 id） | 同 A.1 |
| P4 交易关联 | 否 | 稳定 id；stealth（`0x02`）与 A.1 一样留在 backlog |
| P5 划转关联 | **不适用** | 没有划转；铸造 / 销毁按决定 B-2 公开 |
| **机密聚合量** | **隐藏** | 唯一公开的数字是 `totalSupply`；没有任何地址、视图或事件泄露供应量如何分布 |
| S1–S5 | 同 A.1 | 证明即授权、监管密文、无注册表、密钥只在浏览器、不为用户错误兜底 |

B.1 仍然暴露的：`totalSupply`、每次铸造与销毁（id、金额、区块）、id 之间的转账图（金额隐藏）、每个 id 的活动时间（`foldedAtBlock` / `lastReceivedAtBlock`，A1-0006 对 A.1 亦有说明）。

## 10. Gas（按 A.1 0.3.0 实测估计）

| 操作 | A.1 实测 | B.1 估计 | 差异 |
| --- | --- | --- | --- |
| 铸造（新 id） | shield 214k | ≈ 190k | 无 ERC20 `_update`、无托管 |
| `0x01`（首次花费，includePending） | 716k | 716k | 相同 |
| `0x80` 折叠（首次） | 464k | 464k | 相同 |
| `0x81` 销毁（默认模式） | unshield 374k | ≈ 350k | 无向收款方的 `_update` |

## 11. 0.1 的范围

**包含**：§2–§8 的全部。**不包含**：stealth `0x02`、机密铸造（隐藏发行量）、任何公开账本或通往公开账本的桥、正式可信设置（暂时沿用 A.1 的开发 ptau）。

## 12. 待决

| # | 问题 | 草案答案 | 为何需要 owner 拍板 |
| --- | --- | --- | --- |
| B1-1 | 要不要保留 `0x81` 销毁？ | 保留 | 一个永远不能缩减的闭环代币很少见；但去掉销毁会让 `totalSupply` 不可变，审计叙事更简单 |
| B1-2 | `mint` 是否接受一批 id，以隐藏*谁*被铸了多少？ | 0.1 不做 | 批量铸造仍通过事件暴露每个 id 的金额；要隐藏需要机密铸造（已排除） |
| B1-3 | `approve` / `allowance`：保留为空操作还是 revert？ | 保留为空操作 | 有些钱包展示代币前会先调 `allowance`；在那里 revert 只有敌意没有收益 |
| B1-4 | 合约代码：复制 A.1 删路径，还是继承 A.1 再覆盖？ | 复制 | ADR-0002（Variant 自包含）；继承会把公开账本的存储布局一并带进来 |
| B1-5 | 复用 A.1 在 BSC testnet 已部署的验证器，还是 B.1 自己部署？ | 复用 | 字节码相同；证明本来就绑定代币地址 |
