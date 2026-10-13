[English](04-modules.md) | 中文

# A.1 的模块与组合

版本：`0.5.0-draft`　状态：`Draft`　日期：2026-10-13

本文是 A.1 按 [ADR-0008](../../../adr/0008-modules.zh-cn.md) 调整后的目标结构：一个内核加三个模块。它是合约重构的规格。**目前还没有实现。** 同样的行为现在由两个独立的合约提供：`ConfidentialERC20A1`（0.4.0）和 `ConfidentialERC20B1`（0.2.0）；重构时会改变什么，见 §9。

内核的规格在 [01-design](01-design.zh-cn.md)。电路不变。

## 1. 结构

```
A.1 内核                 加密账户的纯隐私账本
│                        0x01 转账、0x80 折叠、prepare / cancel、监管密钥
│                        电路：transfer、unshield、fold
│
├─ 公开账本      编译时    代币地址上的标准 ERC-20 余额
│                        0x03 shield、0x04 unshield
├─ 角色铸造      编译时    mintConfidential、0x81 销毁；带公开账本时还有 mint
└─ Wrapper 端口  编译时    IPEPWrappable
     └─ PEPWrapper  运行时  家族 Wrapper，插在这个端口上
```

| 部分 | 种类 | 依赖 | 增加的 payload 类型 | 是否改电路 |
| --- | --- | --- | --- | --- |
| 内核 | 无 | 无 | `0x01`、`0x80` | 无 |
| 公开账本 | 编译时模块 | 内核 | `0x03`、`0x04` | 否 |
| 角色铸造 | 编译时模块 | 内核 | `0x81` | 否 |
| Wrapper 端口 | 编译时端口，运行时模块 | 内核 | 无 | 否 |

一个代币就是内核加上其中若干个。它需要一个供应来源，而目前唯一的来源是角色铸造，所以每种组合都包含它。Wrapper 端口不能发行：它只能归还经它出去的数量。

**支持声明。** A.1 0.5.0 支持且只支持这三个模块：公开账本、角色铸造、Wrapper 端口。这份清单是版本的一部分（07 §13.2）。家族里以后登记的模块，A.1 0.5.0 不支持，0.5.0 的代币也不能使用；要支持它，就得出一个新的 A.1 版本。

## 2. 内核向模块提供什么

模块从不直接写账户的密文。它调用两个内部原语之一，其余的事由内核完成。

| 原语 | 做什么 | 证明 |
| --- | --- | --- |
| `_creditPublic(id, amount)` | 把退化密文 `(amount·G, 0)` 加到 `id` 的 `pending` 上；记录 `lastReceivedAtBlock`；增加机密供应量 | 不需要：金额是公开的 |
| `_debitPublic(from, to, amount, payload)` | 验证针对 `(from, nonce, amount, to)` 的 unshield 证明，按 01-design §4.3 的惰性折叠执行花费；减少机密供应量 | unshield 电路（01-design §5.2） |

- 两者都要求 `amount < 2⁴⁸`（A1-0005）。
- `_debitPublic` 里的 `to` 是调用方想绑定进证明的公开值：`0x04` 是公开收款地址，销毁是零地址，wrap 是包装代币的接收地址。电路不关心它的含义（安全评审 F14）。
- 两个原语都不发 `Transfer` 事件。事件由模块发，因为每个模块的事件形状不同。
- 模块可以增加自己的存储。除了通过这两个原语，它不得读写 `_accounts`。

§4 的每个模块都是这两个原语加上记账。

## 3. 供应量

内核只维护一个计数器，即**机密供应量**：所有机密余额的总和。它是公开的，因为它只会按公开金额变化。

| 量 | 定义 | 位置 |
| --- | --- | --- |
| 机密供应量 | 所有机密余额的总和 | 内核。带公开账本时以 `shieldedSupply()` 暴露；不带时等于 `totalSupply()` |
| `totalSupply()` | 代币地址上的全部：公开余额加机密供应量 | ERC-20 |
| `wrappedOut` | 经 Wrapper 端口出去、尚未回来的数量 | Wrapper 端口 |
| `issuedSupply()` | `totalSupply() + wrappedOut` | 内核；没有 Wrapper 端口时等于 `totalSupply()` |

**上限。** `issuedSupply() ≤ 2⁶⁴ − 1`，每次铸造都检查。它限定了每个机密余额的大小，范围证明依赖这一点（01-design 的 I2；评审 B1-F1）。

| 操作 | 模块 | 机密供应量 | 公开余额 | `wrappedOut` | `totalSupply` | `issuedSupply` |
| --- | --- | --- | --- | --- | --- | --- |
| `0x01`、`0x80` | 内核 | 0 | 0 | 0 | 0 | 0 |
| `mint` | 角色铸造，带公开账本 | 0 | `+x` | 0 | `+x` | `+x` |
| `mintConfidential` | 角色铸造 | `+x` | 0 | 0 | `+x` | `+x` |
| `0x81` 销毁 | 角色铸造 | `−x` | 0 | 0 | `−x` | `−x` |
| `0x03` shield | 公开账本 | `+x` | `−x` | 0 | 0 | 0 |
| `0x04` unshield | 公开账本 | `−x` | `+x` | 0 | 0 | 0 |
| wrap | Wrapper 端口 | `−x` | 0 | `+x` | `−x` | 0 |
| unwrap | Wrapper 端口 | `+x` | 0 | `−x` | `+x` | 0 |

**模块之间唯一的交汇点。** 带公开账本时，机密价值以公开代币的形式托管在代币自身的地址上，所以 `balanceOf(token) == shieldedSupply()`。角色铸造或 Wrapper 端口创建、销毁机密价值时，托管量必须跟着变。因此内核有一对内部钩子：`_onConfidentialCreated(amount)` 与 `_onConfidentialDestroyed(amount)`。它们在内核里什么都不做；公开账本重写它们，用来铸造或销毁托管的代币。这就是公开账本在继承顺序里排第一的原因。

## 4. 模块

### 4.1 公开账本

| | |
| --- | --- |
| 种类 | 编译时 |
| 增加 | 按以太坊地址记账的标准 ERC-20 账本：`balanceOf`、不带 payload 的 `transfer` / `transferFrom`、`approve`、`allowance`。payload 类型 `0x03`（shield）与 `0x04`（unshield）。`shieldedSupply()`。事件 `LedgerCrossing` |
| 流程 | 01-design §4.1 与 §4.4：shield 是一次转入托管的公开转账，再加 `_creditPublic`；unshield 是 `_debitPublic`，再从托管中放出 |
| 要求 | 公开账本的逻辑就是未经修改的 OpenZeppelin `ERC20`。机密逻辑的任何故障都不能影响它 |
| 接口（草案） | `IPEPPublicLedger { function shieldedSupply() external view returns (uint256); }` |
| 没有它时 | `balanceOf` 对所有地址返回 0，不带 payload 的 `transfer` 回退 `NoPublicLedger()`，`approve` 与 `allowance` 不授权任何东西，`0x03` / `0x04` 回退 `TypeNotAllowedHere` |

### 4.2 角色铸造

| | |
| --- | --- |
| 种类 | 编译时 |
| 增加 | `MINTER_ROLE`。`mintConfidential(id, amount)`：调用 `_creditPublic`，发出 `Transfer(0x0, id, amount)` 与 `Minted`。payload 类型 `0x81`，调用形式 `transferFrom(id, 0x0, amount)`：以 `to = 0x0` 调用 `_debitPublic`，发出 `Transfer(id, 0x0, amount)` 与 `Burned`。带公开账本时还有 `mint(to, amount)`，即公开铸造 |
| 谁能销毁 | 持有人：`0x81` 由持有人的证明授权，不由角色授权 |
| 限额 | §3 的供应上限 |
| 接口（草案） | `IPEPRoleIssuance { function mintConfidential(address id, uint256 amount) external; }` |
| 可登记 | `0x81` 与 `0x04` 一样可以走 `prepare` / `cancel` |

铸造和销毁的金额是公开的，接收铸造的 id 也是公开的。隐藏发行需要电路，所以那是 Variant 层面的事，不是模块。

### 4.3 Wrapper 端口

| | |
| --- | --- |
| 种类 | 编译时端口；运行时模块是家族的 `PEPWrapper`（[10](../../../10-wrapper.zh-cn.md)） |
| 增加 | `wrapperMint(recipient, amount)`：`recipient` 是 20 字节的 id；要求 `amount ≤ wrappedOut`，然后 `wrappedOut −= amount` 并调用 `_creditPublic`。`wrapperBurn(from, to, amount, payload)`：以 `to` = 包装代币的接收地址调用 `_debitPublic`，然后 `wrappedOut += amount`。`wrapper()`、`wrappedOut()` |
| 谁能调用 | 只有 `wrapper()`。它在构造时设置，或由管理员设置一次，之后不能更换 |
| 限额 | 记入量永远不超过 `wrappedOut`：被攻破的 Wrapper 最多把经它出去的数量记错人，不能增发（评审 B1-F2） |
| 接口 | `IPEPWrappable`，不变 |
| 不可登记 | `wrapperBurn` 直接接收 payload |

## 5. 各组合的 ERC-20 表面

| | 带公开账本 | 不带 |
| --- | --- | --- |
| `balanceOf(a)` | 公开余额；代币自身地址上是托管量 | 所有地址都是 0 |
| 不带 payload 的 `transfer` / `transferFrom` | 标准 ERC-20 | 回退 `NoPublicLedger()` |
| `approve`、`allowance` | 标准；`0x03` 经 `transferFrom` 时也用到 | 为 ABI 保留；不授权任何东西 |
| `totalSupply()` | 公开余额，含托管量 | 已铸造减已销毁，再减经 Wrapper 出去的数量 |
| `Σ balanceOf == totalSupply` | 成立 | 必然不成立：没有任何余额是公开的 |
| 钱包与浏览器 | 显示公开余额 | 显示 0；真实余额只有支持 A.1 的钱包能看到 |
| DeFi | 代币本身 | 有端口时经 Wrapper 的 `wTOKEN` |
| `supportsInterface(IERC20)` | true | true：两种组合的 ABI 都是 ERC-20。余额是不是真的，由探针说明 |

两种组合里，带 `0x01` 或 `0x80` 的 `transferFrom(id, id, handle)` 的行为都与 01-design 一致。

## 6. 组合

| 组合 | 内核 | 公开账本 | 角色铸造 | Wrapper 端口 | 目前的发布形式 |
| --- | --- | --- | --- | --- | --- |
| **带公开账本** | 有 | 有 | 有 | 无 | `ConfidentialERC20A1` 0.4.0 |
| **纯隐私** | 有 | 无 | 有 | 有 | `ConfidentialERC20B1` 0.2.0（[记录](../variant-1-privacy-only/README.zh-cn.md)） |

- **继承顺序**：内核、公开账本、角色铸造、Wrapper 端口（07 §13.2）。
- **公开账本与 Wrapper 端口同时存在**：可以，因为两者用的都是 §2 的原语。目前看不到用途，所以不构建也不测试。
- **合约名**在重构时确定。提议：`A1Core`（抽象）、`A1PublicLedger`、`A1RoleIssuance`、`A1WrapperPort`（抽象模块），以及两个可部署的代币 `A1LedgerToken` 与 `A1PrivateToken`。

## 7. 探针

两种组合的 `pep()` 都返回 `A:1:0.5.0`，靠 `pepModules()` 区分（07 §13.3）：

| 组合 | `pepModules()` |
| --- | --- |
| 带公开账本 | `(IPEPPublicLedger, token)`、`(IPEPRoleIssuance, token)` |
| 纯隐私 | `(IPEPRoleIssuance, token)`、`(IPEPWrappable, wrapper)`；还没有设置 Wrapper 时第二项的地址是零地址 |

## 8. 隐私上的差别

内核给两种组合的保证是一样的（见 01-design；评估表在 README 里）。有两件事取决于模块：

| | 带公开账本 | 纯隐私 |
| --- | --- | --- |
| 供应量里有多少是机密的 | 公开：`shieldedSupply()` | 只要代币从不 wrap 就是隐藏的；一旦 wrap，`wTOKEN.totalSupply()` 会把它暴露出来 |
| 钱包与 id 之间的关联 | 每一次 `0x03` / `0x04` 都是一条公开的边 `钱包 ↔ id` | 只有铸造（发行方到 id）以及 wrap、unwrap |

## 9. 0.5.0 会改变什么

相对于已部署的两个合约。下面没有任何一项会改变电路、payload 布局，或客户端为 `0x01` / `0x80` 解析的事件。

| # | 变化 | 影响 |
| --- | --- | --- |
| 1 | 两种组合共用一个内核，不再是两份拷贝 | 合约 |
| 2 | 一个版本号、一个描述符：`A:1:0.5.0`。不再发行 `B:1:…` | 合约、dApp 路由、部署 |
| 3 | 增加 `pepModules()` 和模块接口标识 | 合约、dApp |
| 4 | 纯隐私组合：`mint(id, amount)` 改名为 `mintConfidential(id, amount)` | 合约、dApp、脚本 |
| 5 | 带公开账本的组合：新增 `mintConfidential` 和 `0x81` | 合约、测试 |
| 6 | 两种组合都有 `issuedSupply()` | 合约 |
| 7 | dApp 按 `pep()` 选页面、按模块开关功能，不再是每个 Track 一条路由 | dApp |
| 8 | 两个测试网代币重新部署。验证器合约和窗口表按地址复用 | 部署 |

## 10. 评审与测试

- 已发布的两种组合是作为独立合约评审的（[02-security-review](02-security-review.zh-cn.md)、[纯隐私组合的评审](../variant-1-privacy-only/03-security-review.zh-cn.md)）。重构之后要针对差异重新评审，重点是 §3 的钩子，以及每条铸造路径是否都按 `issuedSupply()` 检查上限。
- 测试按模块、按实际发布的组合分别运行。每次操作之后都断言供应量守恒（§3 的表）。
- 目前的字节码：带公开账本 17,060 字节，纯隐私 17,195 字节；上限是 24,576。重构之后每种组合重新测量。

## 11. 待定决策

每一项都有默认值，本文按默认值写。

| # | 决策 | 默认 | 另一种做法 |
| --- | --- | --- | --- |
| M1 | 机密铸造叫什么 | 每种组合里都叫 `mintConfidential(id, amount)`；`mint(to, amount)` 永远是公开铸造 | 保留 `mint`，含义随组合而变，和现在一样 |
| M2 | 带公开账本的组合里要不要有 `mintConfidential` 和 `0x81` | 要 | 不加，让那个合约与已部署的完全一致 |
| M3 | 合约名 | §6 的提议 | 带公开账本的组合继续叫 `ConfidentialERC20A1` |
| M4 | 公开账本模块的接口 | `shieldedSupply()` | 用一个不依赖具体函数的标记 id |
