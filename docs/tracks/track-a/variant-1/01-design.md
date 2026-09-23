# A.1 初步细节设计

版本：`0.1.0-draft`　状态：`Draft`　日期：2026-09-23

> 本文是 A.1 的第一版细节设计，用于讨论与原型实现。所有数字（Gas、约束量）均为估算，以原型实测为准。

## 0. 设计原则

1. **公开账本零改动**：就是 OpenZeppelin ERC20，任何机密逻辑的故障都不影响它。
2. **链上不接触明文**：合约只做证明验证与密文同态加法，永远不解密。
3. **每份密文只有一个写者**：`available` 只被账户本人修改，`pending` 只被他人写入、本人清空。证明绑定写者视角下的状态，天然避免并发失效。
4. **监管靠密码学强制**：不带监管密文、或监管密文与转账金额不一致的交易无法通过证明。
5. **接收方不解离散对数**：每笔转账附带加密给接收方和监管方的明文提示（memo），并在电路内证明提示正确。

## 1. 密码学参数

| 项 | 取值 | 说明 |
| --- | --- | --- |
| 曲线 | Baby Jubjub（twisted Edwards，BN254 标量域上的嵌入曲线） | 电路内原生运算 |
| 生成元 | `G`（金额基点）、`H`（随机数 / 公钥基点） | 两者离散对数关系未知（nothing-up-my-sleeve 派生） |
| 私钥 | `s ∈ Z_l`，`l` 为 Baby Jubjub 素数阶子群阶 | 由钱包签名派生，见 §3.1 |
| 公钥 | `pk = s⁻¹·H` | 取逆是为了让电路内验证只需一次标量乘：`s·pk == H` |
| 密文（twisted ElGamal） | `Enc_pk(v; r) = (C, D)`，`C = v·G + r·H`，`D = r·pk` | 解密：`C − s·D = v·G` |
| 同态 | `(C₁,D₁) + (C₂,D₂) = (C₁+C₂, D₁+D₂)` 对应明文相加 | 同一 `pk` 下成立 |
| 多接收方 | 一份承诺 `C`，多个句柄 `D_X = r·pk_X` | 同一金额同时加密给发送方、接收方、监管方 |
| 证明系统 | Groth16（circom + snarkjs）原型；正式版评估 PLONK 类以复用通用 SRS | 见 ADR |
| 哈希 / 对称加密 | Poseidon；memo 用 Poseidon 派生密钥流做加密 | 电路友好 |
| 金额位宽 | 单笔 `v < 2⁴⁸` | 范围证明 48 位 |
| 余额位宽 | `b < 2⁶⁴` | 由 `totalSupply` 上限保证，见 §2.3 |
| decimals | 6 | 单笔上限约 2.8 亿，总供应上限约 1.8 × 10¹³ |

## 2. 链上状态

### 2.1 公开账本

OpenZeppelin `ERC20` 原样：`_balances`、`_allowances`。

### 2.2 机密账本

```solidity
struct Point { uint256 x; uint256 y; }                 // 仿射坐标，v0.1 不压缩
struct Ciphertext { Point C; Point D; }

struct ConfidentialAccount {
    Point      pubKey;        // 零点 = 未注册
    Ciphertext available;     // 可用余额，只有本人修改
    Ciphertext pending;       // 待入账，他人写入、本人清空
    uint64     nonce;         // available 每次变动 +1，证明绑定用
    bytes      decryptable;   // 本人用对称密钥自加密的余额明文副本，合约不解释（可选）
}

mapping(address => ConfidentialAccount) internal _accounts;
uint256 public shieldedSupply;                          // Σ shield − Σ unshield，公开
```

### 2.3 全局约束

| 约束 | 内容 |
| --- | --- |
| I1 | `totalSupply() == Σ _balances + shieldedSupply` |
| I2 | `totalSupply() ≤ 2⁶⁴ − 1`（单位为最小单位）。由此任何机密余额都 `< 2⁶⁴`，范围证明不会因累加溢出而失效 |
| I3 | 每个账户 `available + pending` 解密后等于其真实机密余额 |
| I4 | `nonce` 严格递增 |

### 2.4 监管密钥

```solidity
struct RegulatorKey { Point pk; uint64 activatedAt; }
RegulatorKey[] public regulatorKeys;      // 只追加，index = keyId
uint32 public activeRegulatorKeyId;
```

- 由 `REGULATOR_ADMIN` 角色轮换，旧密钥永久保留（历史密文需要它）。
- 监管私钥是否阈值化（t-of-n DKG）是部署选择，协议只看到一个公钥。
- 监管方能力：**只读**。没有冻结、没收、强制转账的接口。

## 3. 操作

### 3.1 密钥派生与注册

**派生**（钱包侧，所有 Variant 通用）：

```
msg  = EIP-712 { domain: {name:"PEP", chainId, verifyingContract}, message: {purpose:"A.1 confidential key", version:1} }
s    = keccak256(sign(msg)) mod l
pk   = s⁻¹·H
```

**注册**：`register(Point pk)`

- 检查 `pk` 在曲线上且在素数阶子群（乘以 cofactor 8 不为零点）。
- 不要求知识证明：注册错误公钥只损害注册者自己（收到的钱无法解密、无法生成花费证明）。
- 已注册账户不可直接改 key；轮换见 v0.2 backlog。

### 3.2 shield：公开 → 机密

`shield(address to, uint64 amount)`

1. `_burn`-like：`_balances[msg.sender] -= amount`（标准 ERC-20 检查）。
2. `shieldedSupply += amount`。
3. 链上计算 `C = amount·G`，`D = 0`（取 `r = 0` 的退化密文；金额本来就是公开的，不损失隐私）。
4. `_accounts[to].pending += (C, 0)`。
5. `emit Shielded(msg.sender, to, amount)`；`emit Transfer(msg.sender, address(this), amount)` 供公开账本索引器看到余额减少。

- `to` **不需要已注册**，退化密文不依赖公钥。
- `amount·G` 用**固定基窗口表**在链上计算（4 位窗口 × 12 段，预计算 192 个点放入字节码），约 12 次点加。
- 不需要证明，不需要附加数据。

### 3.3 机密转账：机密 → 机密

入口：`transfer(address to, uint256 handle)`，附加数据在 `msg.data[68:]`；或先 `prepare(bytes payload)` 再 `transfer(to, handle)`。

**前置条件**：`to` 已注册；`handle` 最高位为 1 且 `handle == keccak256(payload) | (1 << 255)`。

**payload 布局**（v0.1，共约 900 字节）：

| 字段 | 大小 | 说明 |
| --- | --- | --- |
| magic + version | 4 + 1 | `"PRIV"`, `0x01` |
| `C_amt` | 64 | 金额承诺 `v·G + r·H` |
| `D_sender` | 64 | `r·pk_sender` |
| `D_recv` | 64 | `r·pk_recv` |
| `D_reg` | 64 | `r·pk_reg` |
| `E` | 64 | 临时公钥 `e·H`，用于 memo 的 ECDH |
| `memo_recv` | 64 | `Enc(k_recv; v ‖ r)`，`k_recv = e·pk_recv` |
| `memo_reg` | 64 | `Enc(k_reg; v ‖ r)`，`k_reg = e·pk_reg` |
| `regKeyId` | 4 | 使用的监管公钥编号 |
| `proof` | 256 | Groth16 证明 |
| `decryptable` | 可变 | 发送方新的自加密余额副本（可选，合约不校验） |

**合约执行**：

1. 读取 `acc = _accounts[msg.sender]`，要求已注册。
2. 组装公开输入（见 §4），调用验证合约。
3. `acc.available -= (C_amt, D_sender)`；`acc.nonce += 1`；若提供则更新 `acc.decryptable`。
4. `_accounts[to].pending += (C_amt, D_recv)`。
5. `emit Transfer(msg.sender, to, handle)`。
6. `emit ConfidentialTransfer(msg.sender, to, handle, regKeyId, C_amt, D_recv, D_reg, E, memo_recv, memo_reg)`。

**prepare 兜底**：`prepare(bytes payload)` 执行第 1–2 步，将 `(C_amt, D_sender, D_recv, D_reg, ...)` 与 `to`、`nonce` 存入 `_prepared[msg.sender][handle]`；随后任何来源的 `transfer(to, handle)`（无附加数据）执行第 3–6 步并删除条目。`cancel(handle)` 删除未执行条目。若 `nonce` 已变化则执行失败。

### 3.4 applyPending：待入账 → 可用

`applyPending()`，仅本人可调，无需证明：

```
acc.available += acc.pending
acc.pending    = (0, 0)
acc.nonce     += 1
emit PendingApplied(msg.sender)
```

- 本人在链下已通过 memo 知道每笔入账金额，自行更新 `decryptable`（可在同一交易中传入）。
- 为什么不能由他人代调：会改变 `available`，使本人在途的证明失效。
- 机密转账 / unshield 的附加数据可带一个 `applyFirst` 标志，在同一交易里先合并再花费；代价是若合并前有新入账到达，证明失效。

### 3.5 unshield：机密 → 公开

`unshield(address to, uint64 amount, bytes payload)`

- 与机密转账共用电路，但 `v` 是公开输入，且没有接收方 / 监管密文（金额已公开）。
- payload：`C_amt`、`D_sender`、`proof`、`decryptable`。
- 执行：验证 → `available -= (C_amt, D_sender)`、`nonce += 1` → `shieldedSupply -= amount` → `_balances[to] += amount` → `emit Unshielded(msg.sender, to, amount)`；`emit Transfer(address(this), to, amount)`。
- 为什么不用 `r = 0` 直接减 `amount·G`：也可以，但复用同一电路更省实现；两者在 v0.1 二选一。

### 3.6 四种转账组合

| 发送账本 → 接收账本 | 调用 | 证明 | 金额公开 |
| --- | --- | --- | --- |
| 公开 → 公开 | `transfer(to, amount)`，amount 最高位为 0 | 否 | 是 |
| 公开 → 机密 | `shield(to, amount)` | 否 | 是 |
| 机密 → 机密 | `transfer(to, handle)` + payload | 是 | 否 |
| 机密 → 公开 | `unshield(to, amount, payload)` | 是 | 是 |

## 4. 电路（机密转账）

**公开输入**

| 名称 | 说明 |
| --- | --- |
| `chainId`, `contract` | 防跨链 / 跨合约重放 |
| `sender`, `nonce` | 绑定账户与状态版本 |
| `pk_sender`, `pk_recv`, `pk_reg` | 合约从存储读出后传入，防止证明用错公钥 |
| `available.C`, `available.D` | 花费前的余额密文 |
| `C_amt`, `D_sender`, `D_recv`, `D_reg` | 金额密文 |
| `E`, `memo_recv`, `memo_reg` | 提示 |

**私有输入**：`s`（私钥）、`b`（当前余额明文）、`v`（金额）、`r`（金额随机数）、`e`（临时私钥）。

**约束**

| # | 语句 | 说明 |
| --- | --- | --- |
| 1 | `s·pk_sender == H` | 知道私钥 |
| 2 | `available.C − s·available.D == b·G` | 余额密文确实加密 `b` |
| 3 | `0 ≤ b < 2⁶⁴` | 余额范围 |
| 4 | `0 ≤ v < 2⁴⁸` | 金额范围 |
| 5 | `0 ≤ b − v < 2⁶⁴` | 余额充足 |
| 6 | `C_amt == v·G + r·H` | 金额承诺 |
| 7 | `D_sender == r·pk_sender`, `D_recv == r·pk_recv`, `D_reg == r·pk_reg` | 三方同值 |
| 8 | `E == e·H` | 临时公钥 |
| 9 | `memo_recv == Enc(Poseidon(e·pk_recv); v ‖ r)`, `memo_reg == Enc(Poseidon(e·pk_reg); v ‖ r)` | 提示正确，接收方与监管方都不用解离散对数 |

约束量估算：约 8 次变基标量乘 + 3 次范围证明 + Poseidon 若干，**1~3 万约束量级**。浏览器内 Groth16 证明时间秒级以内。

**unshield 电路**：去掉约束 7 的后两项、8、9；`v` 改为公开输入。

## 5. 事件

| 事件 | 字段 | 用途 |
| --- | --- | --- |
| `Transfer` | `(from, to, amountOrHandle)` | 标准事件；句柄最高位为 1 |
| `ConfidentialTransfer` | `(from, to, handle, regKeyId, C_amt, D_recv, D_reg, E, memo_recv, memo_reg)` | 接收方扫描、监管方解密、索引器 |
| `Shielded` | `(from, to, amount)` | |
| `Unshielded` | `(from, to, amount)` | |
| `PendingApplied` | `(account)` | |
| `KeyRegistered` | `(account, pk)` | |
| `RegulatorKeyRotated` | `(keyId, pk)` | |

接收方只需按 `to == 自己` 过滤 `ConfidentialTransfer` 并解密 `memo_recv`，不需要试解所有事件。

## 6. 视图接口

```solidity
function balanceOf(address) external view returns (uint256);            // 公开账本，真实值
function confidentialBalanceOf(address) external view
    returns (Ciphertext available, Ciphertext pending, uint64 nonce);
function publicKeyOf(address) external view returns (Point);
function shieldedSupply() external view returns (uint256);
function regulatorKey(uint32 id) external view returns (Point);
function supportsInterface(bytes4) external view returns (bool);         // ERC-165：家族 / Track A / A.1
```

## 7. 客户端流程

**发送方**：读自己的 `available`、`nonce`、`decryptable` → 解出 `b` → 选 `v, r, e` → 计算密文与 memo → 生成证明 → 拼 payload → 发 `transfer(to, handle)` + payload。

**接收方**：监听 `ConfidentialTransfer(to = 自己)` → `k = s⁻¹·E` → 解 memo 得 `(v, r)` → 校验 `C_amt == v·G + r·H` → 本地余额 += v → 择机 `applyPending()`。

**监管方**：遍历所有 `ConfidentialTransfer` → 用 `regKeyId` 对应私钥解 `memo_reg` → 校验承诺 → 结合 `Shielded` / `Unshielded` 事件重建任意账户任意时刻的余额。全程不需要解离散对数，不需要任何人配合。

**memo 被篡改的兜底**：memo 正确性由电路强制，理论上不会发生；若实现有 bug，接收方仍可对 `C_amt − s·D_recv = v·G` 做 48 位离散对数（2²⁴ 表）恢复。

## 8. Gas 估算（L1，仅量级）

| 操作 | 主要开销 | 估算 |
| --- | --- | --- |
| `register` | 子群检查 + 2 SSTORE | ~60k |
| `shield` | ERC-20 扣款 + 固定基 12 次点加 + pending 更新 | ~120k |
| 机密 `transfer` | Groth16 验证（~15 个公开输入）~300k + 4 次点加 ~20k + 存储 ~40k + 事件 ~5k | **~400k** |
| `applyPending` | 2 次点加 + 存储 | ~40k |
| `unshield` | Groth16 验证 + 2 次点加 + 存储 + ERC-20 入账 | ~380k |
| `prepare` + 无附加数据 `transfer` | 验证 + 存储 payload 摘要 / 执行时读取 | ~350k + ~80k |

Baby Jubjub 点加在 Solidity 中每次约 3~6k gas（仿射坐标 + `modexp` 求逆，或投影坐标延迟求逆）。

## 9. v0.1.0 范围

**包含**：公开账本（标准 ERC-20）、`register`、`shield`、机密 `transfer`（含 `prepare` 兜底）、`applyPending`、`unshield`、监管密钥登记与轮换、事件与视图、ERC-165。

**不包含（v0.2 backlog）**：

| 项 | 说明 |
| --- | --- |
| 托管式机密 allowance | `approve` / `transferFrom` 的机密版本 |
| 密钥轮换 | 本人把 `available` 重加密到新公钥，需专用电路 |
| 合规策略钩子 | 可插拔 `Policy` 合约，对 shield / unshield / transfer 做准入检查 |
| 点压缩 | 降低 calldata |
| ERC-2771 兼容 | 附加数据与 forwarder 尾部的共存 |
| 批量 `applyPending` / 多输出转账 | |

## 10. 待决问题

- [ ] Groth16 可信设置：原型用 Hermez ptau + 自建 phase 2；正式版是否切 PLONK / UltraHonk。
- [ ] `decryptable` 副本的格式与是否放链上（也可以纯链下，靠 memo 重放重建）。
- [ ] `unshield` 是否也走 `r = 0` 直接减 `amount·G`，省掉一个电路。
- [ ] 句柄与公开金额用最高位区分是否足够，还是引入独立的 `ConfidentialTransfer` 事件即可、`Transfer` 事件保持只发公开转账。
- [ ] 监管密钥阈值化（DKG）的推荐方案。
- [ ] 部署目标：先 L2（calldata 便宜）还是先 L1。
