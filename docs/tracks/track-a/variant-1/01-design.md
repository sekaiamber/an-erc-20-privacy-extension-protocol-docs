# A.1 细节设计

版本：`0.2.1-draft`　状态：`Draft`　日期：2026-09-24

> 0.2.1：按原型实测回写（公开输入打包替代 SHA-256、shield 代币托管在合约地址、Gas 实测）。
> 0.2 相对 0.1 的主要变化：机密账户与以太坊地址解耦、公钥不上链、删除注册表与 shield / unshield 函数、payload 类型字节定义转账类型、证明即授权、删除 `applyPending`（改为花费时惰性折叠）。所有 Gas 数字为估算。

## 0. 设计原则

1. **公开账本零改动**：就是 OpenZeppelin ERC20，机密逻辑的任何故障都不影响它。
2. **链上不接触明文，也不接触公钥**：合约只验证证明、做密文加法。机密账户的公钥永远不出现在链上。
3. **每份密文只有一个写者**：`available` 只被账户本人的证明修改，`pending` 只被他人写入、随本人的下一次花费折叠。证明绑定写者视角的状态，并发不会使证明失效。
4. **证明即授权**：花费机密余额的授权是"知道私钥"的零知识证明，不是 `msg.sender`。任何人都可以代为提交交易。
5. **监管靠密码学强制**：监管密文缺失或与金额不一致，证明不通过。
6. **接收方不解离散对数**：每笔转账附带加密给接收方和监管方的明文提示（memo），电路内证明 memo 正确。
7. **协议只保证链上状态永远正确，不保证用户意图永远被满足**：`to` 的解释完全由 payload 类型决定，发错类型、发错地址由发送方承担，协议不做兜底。

## 1. 密码学参数

| 项 | 取值 | 说明 |
| --- | --- | --- |
| 曲线 | Baby Jubjub | BN254 标量域上的嵌入曲线，电路内原生 |
| 生成元 | `G`（金额）、`H`（随机数 / 公钥） | 离散对数关系未知 |
| 私钥 | `s ∈ Z_l` | 由钱包 EIP-712 签名哈希派生，见 §2.1 |
| 公钥 | `pk = s⁻¹·H` | 电路内验证私钥只需一次标量乘 `s·pk == H` |
| 账户 id | `id = address(uint160(Poseidon(pk.x, pk.y)))` | 20 字节，可填入 `to` / `from`；只在电路内计算 |
| 密文 | `Enc_pk(v; r) = (C, D)`，`C = v·G + r·H`，`D = r·pk` | 解密 `C − s·D = v·G` |
| 同态 | `(C₁,D₁) + (C₂,D₂)` ↔ 明文相加 | 同一 `pk` 下 |
| 多接收方 | 一份 `C`，多个句柄 `D_X = r·pk_X` | 同一金额加密给付款方、收款方、监管方 |
| 证明系统 | Groth16（circom + snarkjs）原型；正式版评估 PLONK 类 | |
| 哈希 / memo | Poseidon；memo 用 Poseidon 密钥流加密 | |
| 公开输入打包 | 标量打包进 3 个字（`from|nonce`、`to|chainId`、`contract|regKeyId|signBits`），点只公开 x，y 为私有输入并由"在曲线上 + 奇偶位"绑定 | 公开输入 25 → 15，验证 gas 386k → 316k。SHA-256 压缩方案已否决：电路内需 ~40 万约束 |
| 金额位宽 | 单笔 `v < 2⁴⁸` | |
| 余额位宽 | `b < 2⁶⁴` | 由 `totalSupply` 上限保证 |
| decimals | 6 | |

## 2. 账户与状态

### 2.1 机密账户 = 公钥

机密账户没有以太坊地址，也没有注册动作。一个账户就是一把 Baby Jubjub 密钥，链上用 `id = Poseidon(pk)` 的低 160 位指代。

- **派生**：`s = keccak256(sign_EIP712({name:"PEP", chainId, contract}, {purpose:"A.1 key", index}))  mod l`。同一钱包可用不同 `index` 派生多个账户。
- **发布**：账户持有人把 `pk`（64 字节）链下交给付款方；`id` 可由 `pk` 算出。链上没有任何地方可以查到 `pk`。
- **创建**：第一笔发往 `id` 的转账创建存储槽。没有"开户"。
- **与钱包的关联**：仅在公开账本与机密账本之间划转时（`0x03` / `0x04`）出现，形式为 `钱包 → id` 或 `id → 钱包` 的公开边。

### 2.2 存储

```solidity
struct Point { uint256 x; uint256 y; }          // 仿射坐标；零值结构体视为单位元 (0, 1)
struct Ciphertext { Point C; Point D; }

struct ConfidentialAccount {
    Ciphertext available;     // 可用余额，只被本人的证明修改
    Ciphertext pending;       // 待入账，他人写入，本人花费时折叠
    uint64     nonce;         // available 每次变动 +1
    bytes      decryptable;   // 本人自加密的余额明文副本，合约不解释，可选
}

mapping(address => ConfidentialAccount) internal _accounts;   // key = id
mapping(address => mapping(uint256 => Prepared)) internal _prepared;   // 兜底，见 §3.4
uint256 public shieldedSupply;

struct RegulatorKey { Point pk; uint64 activatedAt; }
RegulatorKey[] public regulatorKeys;      // 只追加；index = keyId
uint32 public activeRegulatorKeyId;
```

公开账本：OpenZeppelin `ERC20` 原样，key 为以太坊地址。两个账本 key 空间相同（20 字节）但含义不同，协议不区分，见原则 7。

### 2.3 全局不变量

| 编号 | 内容 |
| --- | --- |
| I1 | 屏蔽中的代币托管在合约自身地址：`balanceOf(address(this)) == shieldedSupply`，因此 `totalSupply() == Σ 公开余额`（含合约地址）对任何索引器天然成立 |
| I2 | `totalSupply() ≤ 2⁶⁴ − 1`（最小单位）。保证任何机密余额 `< 2⁶⁴`，范围证明不会因累加溢出失效 |
| I3 | 每个 `id`：`available + pending` 解密后等于真实机密余额 |
| I4 | `nonce` 严格递增 |
| I5 | `pending` 只增加，且只加入范围证明过的非负金额或公开金额 |

### 2.4 监管密钥

- `REGULATOR_ADMIN` 角色轮换，旧密钥永久保留（历史密文需要）。
- 阈值化（t-of-n DKG）是部署选择，协议只见一个公钥。
- 监管能力**只读**：无冻结、没收、强制转账接口。

## 3. ERC-20 表面

### 3.1 函数

```solidity
function transfer(address to, uint256 x) external returns (bool);
    // 付款方 = msg.sender 的公开账户。无 payload：公开转账；payload 0x03：进 to 的机密账本
function transferFrom(address from, uint256 to, uint256 x) external returns (bool);
    // 付款方 = from。from 是公开账户：标准 allowance；from 是机密 id：证明授权（payload 0x01 / 0x04）
function prepare(bytes calldata payload) external;          // 兜底：先验证并登记
function cancel(uint256 handle) external;                    // 撤销未执行的登记
```

没有 `register`、`shield`、`unshield`、`applyPending`。

### 3.2 payload

附加数据紧跟在 ABI 编码的参数之后：`transfer` 从 `msg.data[68:]` 读，`transferFrom` 从 `msg.data[100:]` 读。Solidity 的 ABI 解码器忽略多余字节，这是 ERC-2771 依赖的同一特性。

```
byte 0      type
byte 1      flags
byte 2..    sections（按 type 与 flags 决定，顺序固定）
```

**type**

| type | 名称 | `from` | `to` | `x` | 证明 | shieldedSupply |
| --- | --- | --- | --- | --- | --- | --- |
| （无 payload） | 公开转账 | 公开账户 | 公开账户 | 明文金额 | 否 | — |
| `0x01` | 机密转账 | 机密 id | 机密 id | 句柄 | 是 | — |
| `0x02` | stealth 机密转账 | 机密 id | 一次性 id | 句柄 | 是 | — |
| `0x03` | 公开 → 机密 | 公开账户 | 机密 id | 明文金额 | 否 | `+x` |
| `0x04` | 机密 → 公开 | 机密 id | 公开账户 | 明文金额 | 是 | `−x` |

`0x02` 在 0.2 中仅保留编号，见 §11。

**flags**

| bit | 含义 |
| --- | --- |
| 0 | `includePending`：证明绑定 `available + pending` 而非仅 `available`，见 §4.3 |
| 1 | 携带 `decryptable` 段 |
| 2–7 | 保留，必须为 0 |

**sections（`0x01`）**

| 段 | 大小 | 说明 |
| --- | --- | --- |
| `C_amt` | 64 | `v·G + r·H` |
| `D_sender` | 64 | `r·pk_sender` |
| `D_recv` | 64 | `r·pk_recv` |
| `D_reg` | 64 | `r·pk_reg` |
| `E` | 64 | 临时公钥 `e·H` |
| `memo_recv` | 64 | `Enc(Poseidon(e·pk_recv); v ‖ r)` |
| `memo_reg` | 64 | `Enc(Poseidon(e·pk_reg); v ‖ r)` |
| `regKeyId` | 4 | 使用的监管公钥编号 |
| `proof` | 256 | Groth16 |
| `decryptable` | 2 + n | 长度前缀 + 密文，flags.bit1 置位时存在 |

约 900 字节。`0x04` 去掉 `D_recv`、`D_reg`、`E`、两个 memo；`0x03` 只有 type 与 flags。

**句柄**：`handle = keccak256(payload) | (1 << 255)`。最高位为 1 用于让索引器区分句柄与公开金额；公开金额受 I2 约束远小于 `2²⁵⁵`。

### 3.3 一致性检查（任何一条失败即 revert）

| # | 检查 | 适用 |
| --- | --- | --- |
| 1 | `type` 合法，`flags` 保留位为 0，sections 长度与 type / flags 一致 | 全部 |
| 2 | `handle == keccak256(payload) \| (1 << 255)` | `0x01` `0x02` |
| 3 | `x` 最高位：`0x01` `0x02` 必须为 1；公开金额类型必须为 0 | 全部 |
| 4 | `to != address(0)` | 全部 |
| 5 | `regKeyId` 存在 | `0x01` |
| 6 | 证明验证通过，公开输入由合约按 §4 组装，不从 payload 直接信任任何本应由合约提供的值 | `0x01` `0x04` |
| 7 | `from` 为公开账户时 allowance 充足（标准 ERC-20） | `transferFrom` 无 payload / `0x03` |
| 8 | `_prepared[from][handle]` 存在且登记时的 `nonce` 与当前一致 | 兜底执行 |

`from == to` 允许。`msg.sender` 在 `0x01` / `0x04` 中不做检查。

### 3.4 兜底：`prepare` / `cancel`

给无法拼 calldata 的调用方（钱包原生界面、不认识本协议的合约）使用：

1. `prepare(payload)`：按 §3.3 与 §4 完整验证，存储 `{type, from, to, 增量密文, nonce}` 到 `_prepared[from][handle]`。
2. 之后任何来源的 `transferFrom(from, to, handle)`（无附加数据）读取登记项，检查 `nonce` 未变，执行 §4 的状态更新并删除登记。
3. `cancel(handle)`：删除登记。因为 `prepare` 不改余额，撤销无需证明；但为避免第三方恶意撤销，`cancel` 需要提交与 `prepare` 相同的 `payload` 原文（即证明持有者才能撤销）。

`nonce` 已变化时执行失败并 revert，不自动重试。

## 4. 执行流程

### 4.1 `0x03` 公开 → 机密

```
_update(from, address(this), x)      // 标准 ERC-20 检查；托管到合约地址，发出 Transfer(from, this, x)
shieldedSupply  += x
C = x·G                               // 固定基窗口表：4 位 × 12 段，192 个预计算点入字节码，约 12 次点加
_accounts[to].pending += (C, 0)       // r = 0 的退化密文：金额本来就是公开的
emit Transfer(from, to, x)
emit LedgerCrossing(from, to, 0x03, x)
```

不需要 `pk`，`to` 可以是任何尚未有过活动的 id。

### 4.2 `0x01` 机密 → 机密

```
acc = _accounts[from]
pre = flags.includePending ? acc.available + acc.pending : acc.available
verify(proof, H(chainId, this, from, to, acc.nonce, pk_reg, pre, C_amt, D_sender, D_recv, D_reg, E, memo_recv, memo_reg))
acc.available = acc.available + acc.pending − (C_amt, D_sender)     // 惰性折叠，见 §4.3
acc.pending   = 0
acc.nonce    += 1
if flags.bit1: acc.decryptable = payload.decryptable
_accounts[to].pending += (C_amt, D_recv)
emit Transfer(from, to, handle)
emit ConfidentialTransfer(from, to, handle, regKeyId, C_amt, D_recv, D_reg, E, memo_recv, memo_reg)
```

### 4.3 惰性折叠与 `includePending`

`pending` 存在的唯一目的是让他人的入账不打断本人在途的证明。折叠不再是独立操作，而是**每次花费后自动发生**：合约把 `pending` 加进 `available` 并清零。本人通过 memo 与 `LedgerCrossing` 事件已知每笔入账金额，能自行更新本地余额与 `decryptable`。

证明默认只绑定 `available`（只有本人能改，绝不失效）。当本人需要动用尚在 `pending` 中的资金（典型：新账户，`available` 为零），置位 `includePending`，证明绑定 `available + pending`；此时若证明生成到上链之间有新入账到达，证明失效，需重新生成。这是用户的选择，协议不做额外处理。

两种情况下合约的状态更新公式相同，区别只在公开输入中的 `pre`。

### 4.4 `0x04` 机密 → 公开

```
acc = _accounts[from]
pre = flags.includePending ? acc.available + acc.pending : acc.available
verify(proof, H(chainId, this, from, acc.nonce, pre, C_amt, D_sender, x))
acc.available = acc.available + acc.pending − (C_amt, D_sender)
acc.pending   = 0
acc.nonce    += 1
shieldedSupply -= x
_update(address(this), to, x)        // 发出 Transfer(this, to, x)
emit LedgerCrossing(from, to, 0x04, x)
```

### 4.5 四种组合一览

| 付款 → 收款 | 调用 | payload | 证明 | 金额公开 |
| --- | --- | --- | --- | --- |
| 公开 → 公开 | `transfer(to, x)` / `transferFrom(from, to, x)` | 无 | 否 | 是 |
| 公开 → 机密 | 同上 + `0x03` | 2 字节 | 否 | 是 |
| 机密 → 机密 | `transferFrom(id, id, handle)` + `0x01` | ~900 字节 | 是 | 否 |
| 机密 → 公开 | `transferFrom(id, addr, x)` + `0x04` | ~450 字节 | 是 | 是 |

## 5. 电路

### 5.1 `0x01`

**公开输入**（电路内 SHA-256 为一个域元素后上链）：`chainId, contract, from, to, nonce, pk_reg, pre.C, pre.D, C_amt, D_sender, D_recv, D_reg, E, memo_recv, memo_reg`。

**私有输入**：`s, pk_sender, pk_recv, b, v, r, e`。

| # | 语句 | 说明 |
| --- | --- | --- |
| 1 | `s·pk_sender == H` | 知道付款账户私钥 |
| 2 | `Poseidon(pk_sender) → from` | 付款账户 id 正确，`pk_sender` 不上链 |
| 3 | `Poseidon(pk_recv) → to` | 收款账户 id 正确，`pk_recv` 不上链 |
| 4 | `pre.C − s·pre.D == b·G` | 余额密文加密的是 `b` |
| 5 | `0 ≤ b < 2⁶⁴` | |
| 6 | `0 ≤ v < 2⁴⁸` | |
| 7 | `0 ≤ b − v < 2⁶⁴` | 余额充足 |
| 8 | `C_amt == v·G + r·H` | |
| 9 | `D_sender == r·pk_sender`，`D_recv == r·pk_recv`，`D_reg == r·pk_reg` | 三方同值 |
| 10 | `E == e·H` | |
| 11 | `memo_recv == Enc(Poseidon(e·pk_recv); v ‖ r)`，`memo_reg == Enc(Poseidon(e·pk_reg); v ‖ r)` | 提示正确 |
| 12 | 打包：各标量范围检查后 `w0, w1, w2` 等式成立；每个点 `(xs[i], ys[i])` 在曲线上且 `ys[i] mod 2 == signBits[i]` | y 由 x 与奇偶位唯一确定 |

约束量实测：**35,137 个非线性约束**（未打包版本 30,356）。Node 环境证明 2.3~2.5 s。

### 5.2 `0x04`

去掉 3、9 的后两项、10、11；公开输入 7 个：`w0 = from | nonce<<160`，`w1 = contract | chainId<<160`，`w2 = amount | signBits<<48`，`xs[4]`。实测 16,622 个约束。

## 6. 事件

| 事件 | 字段 | 用途 |
| --- | --- | --- |
| `Transfer` | `(from, to, x)` | 标准；`x` 最高位区分句柄与金额 |
| `ConfidentialTransfer` | `(from, to, handle, regKeyId, C_amt, D_recv, D_reg, E, memo_recv, memo_reg)` | 收款方扫描、监管解密 |
| `LedgerCrossing` | `(from, to, type, amount)` | `0x03` / `0x04`，索引器维护 `shieldedSupply` |
| `Prepared` / `Cancelled` | `(from, handle)` | 兜底 |
| `RegulatorKeyRotated` | `(keyId, pk)` | |

收款方按 `to == 自己的 id` 过滤 `ConfidentialTransfer` 与 `LedgerCrossing`。

## 7. 视图

```solidity
function balanceOf(address) external view returns (uint256);            // 公开账本
function confidentialAccountOf(address id) external view
    returns (Ciphertext available, Ciphertext pending, uint64 nonce, bytes memory decryptable);
function shieldedSupply() external view returns (uint256);
function regulatorKey(uint32 id) external view returns (Point memory);
function supportsInterface(bytes4) external view returns (bool);         // 家族 / Track A / A.1
```

## 8. 客户端流程

**付款方**：链下持有 `pk_recv` → 读自己 `available`（按需 `pending`）、`nonce`、`decryptable` → 解出 `b` → 选 `v, r, e` → 密文与 memo → 证明 → 拼 payload → 自己或经中继者提交 `transferFrom`。

**收款方**：监听 `ConfidentialTransfer(to = id)` → `k = s⁻¹·E` → 解 memo 得 `(v, r)` → 校验 `C_amt == v·G + r·H` → 本地余额 += v。监听 `LedgerCrossing(to = id, 0x03)` → 本地余额 += amount。不需要任何链上动作。

**监管方**：遍历 `ConfidentialTransfer`，按 `regKeyId` 解 `memo_reg`，校验承诺；结合 `LedgerCrossing` 重建任意 id 任意时刻的余额。不解离散对数，不需要任何人配合，只读。id 与钱包的对应关系仅能从 `0x03` / `0x04` 的边推断。

**memo 兜底**：由电路强制，理论上不会错；若实现有 bug，收款方仍可对 `C_amt − s·D_recv = v·G` 做 48 位离散对数（2²⁴ 表）。

## 9. Gas（原型实测，2026-09-24）

环境：Hardhat 3 / solc 0.8.34 viaIR / Groth16（snarkjs）/ 公开输入打包后。数字来自 `contracts/test/track-a/variant-1/`。

### 9.1 单位价格假设

| 链 | gas price | 币价 | 每 gas 美元 |
| --- | --- | --- | --- |
| ETH | 0.3 gwei | $2,500 | 7.5 × 10⁻⁷ |
| BSC | 0.05 gwei | $750 | 3.75 × 10⁻⁸ |

### 9.2 实测

| 操作 | 实测 gas | 备注 | ETH（$） | BSC（$） |
| --- | --- | --- | --- | --- |
| 公开转账（参照） | ~50k | | 0.038 | 0.0019 |
| `0x03` 公开 → 机密 | **198k** | 含收款方 pending 冷写（4 槽）；固定基窗口表 `amount·G` 最坏 77k | 0.15 | 0.0074 |
| `0x01` 机密 → 机密 | **607k** | 端到端测试场景：付款方 available 与收款方 pending **均为冷写**（约 +135k）；稳态估计 ~470k | 0.46 | 0.023 |
| `0x04` 机密 → 公开 | **459k** | 同上，含冷写 | 0.34 | 0.017 |
| `prepare` 后裸 `transferFrom` | 272k | 不含 `prepare` 本身（≈ 一次验证 + 登记存储） | 0.20 | 0.010 |
| Groth16 `verifyProof`（15 输入） | 316k | 含 21k 基础与 calldata；25 输入未打包时 386k | | |
| 证明生成（Node，M 系列） | 2.3~2.5 s | 35,137 约束 | | |

### 9.3 拆解（`0x01`，冷写场景）

| 组成 | Gas |
| --- | --- |
| 基础 + calldata（payload ~710 字节） | ~35k |
| Groth16 验证（15 个公开输入） | ~290k |
| Baby Jubjub 点加 ×6（折叠 2、扣款 2、收款 2） | ~50k |
| 存储：付款方 available 冷写 4 槽 + pending 清零 + nonce；收款方 pending 冷写 4 槽 | ~200k |
| 事件 | ~7k |

### 9.4 已知优化空间

| 优化 | 预计节省 | 状态 |
| --- | --- | --- |
| 折叠后不清零 `pending`，改记录"已折叠值"，避免每次收款冷写 | 每次收款 ~70k | backlog |
| 点加改投影坐标、批量求逆 | ~20k | backlog |
| PLONK 类替换 Groth16 | **增加** ~100k，换取去掉每电路可信设置 | 待评估 |

### 9.5 目标

**`0x01` 稳态 ≤ 500k。**（原目标 350k 建立在 SHA-256 压缩成立的前提上，已不适用。）

## 10. 范围（0.2）

**包含**：公开账本、`transfer` / `transferFrom` 四种类型（`0x02` 除外）、`prepare` / `cancel`、监管密钥登记与轮换、事件与视图、ERC-165、公开输入 SHA-256 压缩。

## 11. Backlog

| 项 | 说明 |
| --- | --- |
| `0x02` stealth | 付款方由收款方元地址派生一次性 `pk` 与 `id`；账户已与地址解耦，无需链上配套 |
| 托管式机密 allowance | 第三方**无需持有私钥**代为花费机密余额；证明即授权只覆盖持有私钥的情形 |
| 密钥轮换 | 本人把 `available` 重加密到新 `pk`（即新 id），需专用电路 |
| 合规策略钩子 | 可插拔 `Policy` 合约，对 `0x03` / `0x04` 做准入检查 |
| 点压缩 | 降低 calldata |
| 折叠后不清零 `pending` | 记录"已折叠值"而非清零，避免每次收款对 pending 冷写（~70k） |
| ERC-2771 | 附加数据与 forwarder 尾部的共存 |
| 多输出转账 | 一笔证明多个收款方 |

## 12. 待决

- [ ] Groth16 可信设置：原型用公开 ptau + 自建 phase 2；正式版是否切 PLONK / UltraHonk。
- [ ] `decryptable` 放链上还是纯链下（靠 memo 与事件重放重建）。
- [ ] `cancel` 的授权方式：提交 payload 原文 vs. 单独的小证明。
- [ ] 监管密钥阈值化（DKG）推荐方案。
- [ ] 部署目标：先 L2 还是先 L1。
- [ ] `Transfer` 事件是否对 `0x01` 也发（当前：发，句柄最高位区分），还是只发 `ConfidentialTransfer`。
