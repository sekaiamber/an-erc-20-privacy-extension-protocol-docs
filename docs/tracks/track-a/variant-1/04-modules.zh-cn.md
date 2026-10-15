[English](04-modules.md) | 中文

# A.1 的模块与组合

版本：`0.8.0`　状态：`Draft`　日期：2026-10-15

本文是 A.1 按 [ADR-0008](../../../adr/0008-modules.zh-cn.md) 调整后的结构：一个内核加三个模块。从 0.7.0 起，它遵循 [ADR-0013](../../../adr/0013-mintable.zh-cn.md)（可增发；初始发行和销毁属于内核）和 [A1-0007](../../../adr/a1-0007-exit-kind-binding.zh-cn.md)（通过收款人的值绑定出口类型）。从 0.8.0 起，它遵循 [ADR-0014](../../../adr/0014-eighteen-decimals.zh-cn.md)（金额 `< 2¹²⁸`，小数位在部署时选）。

**实现状态（2026-10-15）。** 0.8.0 已设计、尚未实现，改了什么见 §9.3。本段其余部分说的是 BSC testnet 上运行的 0.7.0。本文描述的是 0.7.0，它已在合约和 dApp 中实现，两个参考代币已部署到 BSC testnet（2026-10-15，[03-deployments](03-deployments.zh-cn.md)），当天在链上完整跑过一遍所有操作。它改了什么见 §9.2。0.6.0 已在合约仓库（`a2c0ae0`，全部测试通过）和 dApp（`e06424a`）里实现，两种组合都已部署到 BSC testnet（[03-deployments](03-deployments.zh-cn.md)），2026-10-13 在链上完整跑过一遍。对 0.6.0 而言，本文说「可增发」的地方读作「角色铸造」，§1 到 §8 按 §9.2 列出的差别来读。0.6.0 还没做的：带公开账本的代币上发给机密 id 的 `mint` 和 `0x81` 销毁只在本地跑过，dApp 的页面也还没有在浏览器里实际点过。

内核的规格在 [01-design](01-design.zh-cn.md)。电路不变。

## 1. 结构

```
A.1 内核                 加密账户的纯隐私账本
│                        初始发行、0x01 转账、折叠（0x80）、0x81 销毁、监管密钥
│                        电路：transfer、unshield、fold
│
├─ 公开账本      编译时    代币地址上的标准 ERC-20 余额
│                        0x03 shield、0x04 unshield
├─ 可增发        编译时    部署后的 mint（发给 id 用 0x82；不带 payload 是公开铸造）
└─ Wrapper 端口  编译时    ICasataWrappable
     ├─ CasataWrapper  运行时  家族 Wrapper
     └─ CasataGateway  运行时  面向已有 ERC-20 的家族网关（14）
```

| 部分 | 种类 | 依赖 | 增加的 payload 类型 | 是否改电路 |
| --- | --- | --- | --- | --- |
| 内核 | 无 | 无 | `0x01`、`0x80`、`0x81` | 无 |
| 公开账本 | 编译时模块 | 内核 | `0x03`、`0x04` | 否 |
| 可增发 | 编译时模块 | 内核 | `0x82` | 否 |
| Wrapper 端口 | 编译时端口，运行时模块 | 内核 | 无 | 否 |

一个代币就是内核加上其中任意若干个。每个代币都在部署时发行初始供应（§3）。可增发是唯一能在部署后发行的模块，Wrapper 端口只能归还经它出去的数量（ADR-0013 第 4 条）。所以每个子集都有供应，八种都是代币（§6）。

**支持声明。** A.1 0.7.0 支持且只支持这三个模块：公开账本、可增发、Wrapper 端口。0.5.0 和 0.6.0 声明的也是这三个，只是可增发当时叫角色铸造（ADR-0013 第 1 条）。这份清单是版本的一部分（07 §13.2）。家族里以后登记的模块，A.1 0.7.0 不支持，0.7.0 的代币也不能使用；要支持它，就得出一个新的 A.1 版本。

## 2. 内核向模块提供什么

模块从不直接写账户的密文。它调用两个内部原语之一，其余的事由内核完成。

| 原语 | 做什么 | 证明 |
| --- | --- | --- |
| `_creditPublic(id, amount)` | 把退化密文 `(amount·G, 0)` 加到 `id` 的 `pending` 上；记录 `lastReceivedAtBlock`；增加机密供应量 | 不需要：金额是公开的 |
| `_debitPublic(from, kind, to, amount, payload)` | 验证针对 `(from, nonce, amount, r)` 的 unshield 证明，`r` 是出口 `kind` 对应的收款人值；按 01-design §4.3 的惰性折叠执行花费；减少机密供应量 | unshield 电路（01-design §5.2） |

- 两者都要求 `amount < 2¹²⁸`（自 0.8.0 起，ADR-0014）；到 0.7.0 为止为 `< 2⁴⁸`（A1-0005）。
- `_debitPublic` 里的 `to` 是公开收款人：`0x04` 是公开收款地址，销毁是零地址，`wrapperBurn` 是包装代币（或被放出的 ERC-20）的接收地址。到 0.6.0 为止，证明绑定的就是 `to` 本身。从 0.7.0 起绑定的是 `r`：销毁时 `r = 0`；两个收款人非零的出口用 `r = uint160(uint256(keccak256(abi.encodePacked("Casata A.1 exit", kind, to))))`，`0x04` 的 `kind = 1`，`wrapperBurn` 的 `kind = 2`（A1-0007）。电路不关心这个值的含义（安全评审 F14）。调用方不传 `r`，由内核根据 `kind` 和 `to` 算出。
- 两个原语都不发 `Transfer` 事件。事件由调用方发，因为每种操作的事件形状不同。
- 模块可以增加自己的存储。除了通过这两个原语，它不得读写 `_accounts`。

§4 的每个模块都是这两个原语加上记账。内核自己的初始发行和销毁也是（§3、§4.0）。

## 3. 供应量

内核只维护一个计数器，即**机密供应量**：所有机密余额的总和。它是公开的，因为它只会按公开金额变化。

| 量 | 定义 | 位置 |
| --- | --- | --- |
| 机密供应量 | 所有机密余额的总和 | 内核。带公开账本时以 `shieldedSupply()` 暴露；不带时等于 `totalSupply()` |
| `totalSupply()` | 代币地址上的全部：公开余额加机密供应量 | ERC-20 |
| `wrappedOut` | 经 Wrapper 端口出去、尚未回来的数量 | Wrapper 端口 |
| `issuedSupply()` | `totalSupply() + wrappedOut` | 内核；没有 Wrapper 端口时等于 `totalSupply()` |

**上限。** 自 0.8.0 起 `issuedSupply() ≤ 2¹²⁸ − 1`（到 0.7.0 为止为 `2⁶⁴ − 1`），每次发行都检查，包括初始发行。它限定了每个机密余额的大小，范围证明依赖这一点（01-design 的 I2；评审 B1-F1）。

**初始发行。** 构造函数接收 `initialTo`、`initialAmount` 和 `initialPayload`，按 `mint` 的规则（§4.2、07 §3）发行一次：

- `initialPayload` 为空：向地址 `initialTo` 公开发行。只在带公开账本时可用；没有公开账本时部署回退 `NoPublicLedger()`。
- `initialPayload` 为 `0x82`、flags 为 0：调用 `_creditPublic(initialTo, initialAmount)`，即 id `initialTo` 的机密余额。id 是钱包针对某一个代币地址派生的密钥（07 §8），所以部署者想把初始发行放进自己的 id，就要针对部署将要得到的地址（由账户和 nonce 算出）来派生。dApp 的部署表单就是这样做的；如果别的交易先动了 nonce，这笔供应会落进一个没人持有的 id。和任何记入 id 的金额一样，它小于 `2¹²⁸`（§2；到 0.7.0 为止为 `2⁴⁸`）。
- 只有带可增发的代币，`initialAmount` 才可以是零。不带可增发、又什么都没发行的代币永远不可能有余额，所以部署回退 `NoSupply()`。
- 它发出的事件和铸造相同：`Transfer(0x0, initialTo, initialAmount)`，发给 id 时还有 `Minted`（公开发行只有 ERC-20 的 `Transfer`）。金额为零时什么都不发。payload 既不是空也不是 `0x82 00` 时回滚 `BadInitialPayload()`。

| 操作 | 部分 | 机密供应量 | 公开余额 | `wrappedOut` | `totalSupply` | `issuedSupply` |
| --- | --- | --- | --- | --- | --- | --- |
| 初始发行，公开 | 内核，带公开账本 | 0 | `+x` | 0 | `+x` | `+x` |
| 带 `0x82` 的初始发行 | 内核 | `+x` | 0 | 0 | `+x` | `+x` |
| `0x01`、`fold` | 内核 | 0 | 0 | 0 | 0 | 0 |
| `0x81` 销毁 | 内核 | `−x` | 0 | 0 | `−x` | `−x` |
| 不带 payload 的 `mint` | 可增发，带公开账本 | 0 | `+x` | 0 | `+x` | `+x` |
| 带 `0x82` 的 `mint` | 可增发 | `+x` | 0 | 0 | `+x` | `+x` |
| `0x03` shield | 公开账本 | `+x` | `−x` | 0 | 0 | 0 |
| `0x04` unshield | 公开账本 | `−x` | `+x` | 0 | 0 | 0 |
| wrap（`wrapperBurn`） | Wrapper 端口 | `−x` | 0 | `+x` | `−x` | 0 |
| unwrap（`wrapperMint`） | Wrapper 端口 | `+x` | 0 | `−x` | `+x` | 0 |

**模块之间唯一的交汇点。** 带公开账本时，机密价值以公开代币的形式托管在代币自身的地址上，所以 `balanceOf(token) == shieldedSupply()`。内核、可增发或 Wrapper 端口创建、销毁机密价值时，托管量必须跟着变。因此内核声明了一对内部钩子：`_onConfidentialCreated(id, amount)` 与 `_onConfidentialDestroyed(id, amount)`，由 ERC-20 表面实现：公开账本用它们铸造或销毁托管的代币；没有公开账本的代币则发出来自或去往零地址的 `Transfer`。这就是公开账本在继承顺序里排第一的原因。

**小数位（自 0.8.0 起）。** 构造函数还接收 `decimals_`，0 到 18，由 `decimals()` 返回；更大的值回滚 `BadDecimals()`（ADR-0014）。dApp 的部署表单默认 18，网关代币则用底层代币的小数位（[14](../../../14-gateway.zh-cn.md) §3）。到 0.7.0 为止为 6。

## 4. 内核的发行与销毁，以及各模块

### 4.0 内核里的初始发行和销毁

| | |
| --- | --- |
| 初始发行 | 见 §3。只在构造函数里发生一次。不需要角色，之后谁也不能再以这种方式发行 |
| 销毁 | `transferFrom(id, 0x0, amount)` 加 payload `0x81`：以 `to = 0x0`（所以 `r = 0`）调用 `_debitPublic`，发出 `Transfer(id, 0x0, amount)` 与 `Burned`。带公开账本时，这个 `Transfer` 是代币地址上托管量的销毁 |
| 谁能销毁 | 持有人：`0x81` 由持有人的证明授权，不由角色授权 |
| 为什么放在内核 | 机密转账给一个没人控制的 id，金额是隐藏的，所以没法把它从流通量里排除。按公开金额销毁是别人唯一能核对的减少供应的方式；只发行一次的代币和持续增发的代币一样可能需要它（ADR-0013 第 3 条） |

到 0.6.0 为止，销毁属于角色铸造，代币也没有初始发行。

### 4.1 公开账本

| | |
| --- | --- |
| 种类 | 编译时 |
| 增加 | 按以太坊地址记账的标准 ERC-20 账本：`balanceOf`、不带 payload 的 `transfer` / `transferFrom`、`approve`、`allowance`。payload 类型 `0x03`（shield）与 `0x04`（unshield）。`shieldedSupply()`。事件 `LedgerCrossing` |
| 流程 | 01-design §4.1 与 §4.4：shield 是一次转入托管的公开转账，再加 `_creditPublic`；unshield 是以 `kind = 1` 调用 `_debitPublic`，再从托管中放出 |
| 要求 | 公开账本的逻辑就是未经修改的 OpenZeppelin `ERC20`。机密逻辑的任何故障都不能影响它 |
| 接口 | `ICasataPublicLedger { function shieldedSupply() external view returns (uint256); }` |
| 没有它时 | `balanceOf` 对所有地址返回 0，不带 payload 的 `transfer`、`transferFrom`、`mint` 回退 `NoPublicLedger()`，`approve` 回退 `NoPublicLedger()`，`allowance` 返回 0，`0x03` / `0x04` 回退 `TypeNotAllowedHere`。公开的初始发行会让部署回退 `NoPublicLedger()` |

### 4.2 可增发

到 0.6.0 为止叫角色铸造（ADR-0013 第 1 条）。

| | |
| --- | --- |
| 种类 | 编译时 |
| 增加 | `MINTER_ROLE` 和 `mint(to, amount)`，后者遵循家族的 payload 规则（07 §1、§13.1）。没有别的：从 0.7.0 起销毁在内核里 |
| 发给某个 id | `mint(id, amount)` 加 payload `0x82`。payload 是 `[type, flags = 0]`，2 字节，和 `0x03` 一样。调用 `_creditPublic`，发出 `Transfer(0x0, id, amount)` 与 `Minted`。带公开账本时，这个 `Transfer` 是代币地址上托管量的铸造 |
| 公开铸造 | 不带 payload 的 `mint(to, amount)`：向地址 `to` 的普通 ERC-20 铸造。只在带公开账本时存在；没有公开账本时这个调用回退 `NoPublicLedger()` |
| 谁能铸造 | `MINTER_ROLE` 的持有者，由管理员授予。持有者可以是合约：家族网关收到多少就铸多少（[14](../../../14-gateway.zh-cn.md)） |
| 限额 | §3 的供应上限 |
| 接口 | `ICasataMintable { function mint(address to, uint256 amount) external; }`。ERC-165 id 是 `mint(address,uint256)` 的选择器 `0x40c10f19`，与 0.6.0 的 `ICasataRoleIssuance` 相同 |
| 漏了 payload | 在带公开账本的代币上，`mint(id, amount)` 如果漏了 payload，就成了向地址 `id` 的公开铸造。没有人持有这个地址的私钥，这笔余额动不了。转账本来就遵循这条规则（07 §3），铸造方也得遵循 |
| 没有它时 | 部署之后谁都不能发行：供应量就是初始发行量减去已销毁的。调用 `mint` 会回退 |

铸造和销毁的金额是公开的，接收铸造的 id 也是公开的。隐藏发行需要电路，所以那是 Variant 层面的事，不是模块。

### 4.3 Wrapper 端口

| | |
| --- | --- |
| 种类 | 编译时端口。运行时模块是家族的 `CasataWrapper`（[10](../../../10-wrapper.zh-cn.md)）或家族网关（[14](../../../14-gateway.zh-cn.md)）；一个代币只有一个 `wrapper()` |
| 增加 | `wrapperMint(recipient, amount)`：`recipient` 是 20 字节的 id；要求 `amount ≤ wrappedOut`，然后 `wrappedOut −= amount` 并调用 `_creditPublic`。`wrapperBurn(from, to, amount, payload)`：以 `kind = 2`、`to` = 包装代币或被放出的 ERC-20 的接收地址调用 `_debitPublic`，然后 `wrappedOut += amount`。`wrapper()`、`wrappedOut()`。事件 `WrapperMinted` 与 `WrapperBurned`；端口不发 `Minted` 或 `Burned` |
| 谁能调用 | 只有 `wrapper()`。它在构造时设置，或由管理员设置一次，之后不能更换 |
| 限额 | 记入量永远不超过 `wrappedOut`：被攻破的 Wrapper 最多把经它出去的数量记错人，不能增发（评审 B1-F2） |
| 接口 | `ICasataWrappable`。函数和接口标识从 0.5.0 起不变 |

## 5. 各组合的 ERC-20 表面

| | 带公开账本 | 不带 |
| --- | --- | --- |
| `balanceOf(a)` | 公开余额；代币自身地址上是托管量 | 所有地址都是 0 |
| 不带 payload 的 `transfer` / `transferFrom` | 标准 ERC-20 | 回退 `NoPublicLedger()` |
| `approve`、`allowance` | 标准；`0x03` 经 `transferFrom` 时也用到 | `approve` 回退 `NoPublicLedger()`；`allowance` 返回 0 |
| 不带 payload 的 `mint` | 有可增发时向某个地址公开铸造，没有时回退 | 回退 `NoPublicLedger()` |
| `totalSupply()` | 公开余额，含托管量 | 初始发行加已铸造，减已销毁，再减经 Wrapper 端口出去的数量 |
| `Σ balanceOf == totalSupply` | 成立 | 必然不成立：没有任何余额是公开的 |
| 钱包与浏览器 | 显示公开余额 | 显示 0；真实余额只有支持 A.1 的钱包能看到 |
| DeFi | 代币本身 | 有端口时经端口的运行时模块：Wrapper 的 `wTOKEN`，或网关背后的原 ERC-20 |
| `supportsInterface(IERC20)` | true | true：两种情况下 ABI 都是 ERC-20。余额是不是真的，由探针说明 |

两种情况下，带 `0x01` 的 `transferFrom(id, id, handle)`、带 `0x81` 的 `transferFrom(id, 0x0, amount)` 以及 `fold(id, payload)` 的行为都与 01-design 和 §4.0 的规定一致；有可增发时，带 `0x82` 的 `mint(id, amount)` 也一样（§4.2）。

## 6. 组合

三个模块共有八种子集。在 0.7.0 里每一种都是代币：每种都有初始供应（ADR-0013），经公开账本的出口也不会再和经 Wrapper 端口的出口混淆（A1-0007）。

| 公开账本 | 可增发 | Wrapper 端口 | 是什么 |
| --- | --- | --- | --- |
| | | | 固定供应的隐私代币：只有内核 |
| 有 | | | 固定供应、有公开和机密两种余额的代币 |
| | | 有 | 固定供应、带包装 ERC-20 的隐私代币 |
| 有 | | 有 | 固定供应、有公开余额又带包装 ERC-20 的代币 |
| | 有 | | 持续发行的隐私代币。0.6.0 的 `A1PrivateToken` 在没有设置 Wrapper 时就是这样 |
| 有 | 有 | | `A1LedgerToken`，0.6.0 已发布 |
| | 有 | 有 | `A1PrivateToken`，0.6.0 已发布。网关作为 `wrapper()` 时：已有 ERC-20 的隐私版本 |
| 有 | 有 | 有 | 0.7.0 之前构不成代币，因为两种出口无法区分。网关作为 `wrapper()` 时：已有 ERC-20 的隐私版本，同时可以公开持有 |

- **继承顺序**：内核、公开账本、可增发、Wrapper 端口（07 §13.2）。
- **公开账本与 Wrapper 端口同时存在。** unshield 证明绑定了 `to`，但到 0.6.0 为止没有绑定这是哪一种出口。各出口之所以不会混淆，只是因为已构建的组合里没有同时带 `0x04` 和 `wrapperBurn` 的。从 0.7.0 起证明绑定 `r`（§2），两种出口能区分开，这个组合也就允许了。配 Wrapper 时，在公开余额旁边再有一个包装 ERC-20 用处不大；配网关时有用，因为公开余额和原 ERC-20 是两种不同的资产。
- **网关组合**（[14](../../../14-gateway.zh-cn.md)）。可增发加 Wrapper 端口，带不带公开账本都行；网关被设为 `wrapper()` 并持有 `MINTER_ROLE`。网关按锁定的量铸造，并通过 `wrapperBurn` 放出锁定的 ERC-20。只有当网关是 `MINTER_ROLE` 的唯一持有者、管理员已放弃授予该角色、并且初始发行量为零时，供应才是足额抵押的（ADR-0013 第 5 条）。代币不强制这一点，由前端检查。A.1 是 6 位小数（A1-0005），所以底层代币小数位更多时，由网关换算精度。
- **合约。** 各部分与 0.6.0 相同，只是 `A1RoleIssuance` 改名为 `A1Mintable`：`A1Core`（抽象内核，现在包含初始发行和销毁）、`A1NoLedger`（没有公开余额的 ERC-20 表面）、`A1PublicLedger`、`A1Mintable`、`A1WrapperPort`（抽象模块）。一种组合在 `A1NoLedger` 和 `A1PublicLedger` 之间恰好取一个。0.7.0 为每个子集发布一个可部署合约，由脚本从这些部分生成（M10，§11）。`A1LedgerToken` 和 `A1PrivateToken` 这两个名字留给 0.6.0 已发布的两种组合。其余六个是 `A1Token` 加上所含模块的字母（`L` 公开账本、`M` 可增发、`W` Wrapper 端口），从 `A1Token`（只有核心）到 `A1TokenLMW`。生成脚本是 `contracts/scripts/track-a/variant-1/gen-compositions.mjs`，生成的文件在 `contracts/contracts/track-a/variant-1/tokens/`。

## 7. 探针

每种组合的 `casata()` 都返回 `A:1:0.7.0`，靠 `casataModules()` 区分（07 §13.3），它为每个存在的模块列出一项：

| 存在的模块 | `casataModules()` 里的项 |
| --- | --- |
| 公开账本 | `(ICasataPublicLedger, token)` |
| 可增发 | `(ICasataMintable, token)` |
| Wrapper 端口 | `(ICasataWrappable, wrapper)`；还没有设置运行时模块时地址为零 |

只有内核时返回空列表。0.6.0 的两种组合返回 `A:1:0.6.0` 和同样的项，只是可增发那一项叫 `ICasataRoleIssuance`；id 相同，所以前端按同一种方式读。Wrapper 端口上插的是 Wrapper 还是网关，从返回地址上的运行时模块读出（14）。

0.5.0 里这两个函数叫 `pep()` 和 `pepModules()`（ADR-0011）。

## 8. 隐私上的差别

内核给每种组合的保证是一样的（见 01-design；评估表在 README 里）。有两件事取决于模块：

| | 带公开账本 | 不带 |
| --- | --- | --- |
| 供应量里有多少是机密的 | 公开：`shieldedSupply()` | 公开：`totalSupply()` 全部是机密的。经 Wrapper 端口出去的数量是 `wrappedOut()` |
| 钱包与 id 之间的关联 | 每一次 `0x03` / `0x04` 都是一条公开的边 `钱包 ↔ id` | 只有发给 id 的发行（发行方到 id）、wrap 和 unwrap，以及经网关的存入和取回 |

0.6.0 的文本说，没有公开账本时，只要代币从不 wrap，供应量里机密的部分就是隐藏的。这个说法是错的：机密供应量的每一次变化都是公开金额（§3），所以它在每种组合里都是公开的。

## 9. 0.5.0 会改变什么

相对于已部署的两个合约。下面没有任何一项会改变电路、payload 布局，或客户端为 `0x01` / `0x80` 解析的事件。九项都已完成（合约 `3414e24`，dApp `4975eb8`，2026-10-13 部署）。

| # | 变化 | 影响 |
| --- | --- | --- |
| 1 | 两种组合共用一个内核，不再是两份拷贝 | 合约 |
| 2 | 一个版本号、一个描述符：`A:1:0.5.0`。不再发行 `B:1:…` | 合约、dApp 路由、部署 |
| 3 | 增加 `pepModules()` 和模块接口标识 | 合约、dApp |
| 4 | 纯隐私组合：`mint(id, amount)` 改名为 `mintConfidential(id, amount)` | 合约、dApp、脚本 |
| 5 | 带公开账本的组合：新增 `mintConfidential` 和 `0x81` | 合约、测试 |
| 6 | 两种组合都有 `issuedSupply()` | 合约 |
| 7 | dApp 按 `pep()` 选页面、按模块开关功能，不再是每个 Track 一条路由 | dApp |
| 8 | 两个测试网代币重新部署。纯隐私代币复用新一次带公开账本代币部署出来的验证器和窗口表，以及链上已有的 Wrapper | 部署 |
| 9 | wrap 只发 `WrapperBurned`。原来的独立合约还会同时发 `Burned`，dApp 的监管视图会把它算成第二笔流出 | 合约、监管视图 |

### 9.1 0.6.0 改变什么

相对于 0.5.0。决策记录：[ADR-0010](../../../adr/0010-erc20-surface-tradeoffs.zh-cn.md) 和 [ADR-0011](../../../adr/0011-project-name-casata.zh-cn.md)。电路不变，所以证明密钥和验证合约都不变。七项都已完成（2026-10-13）。重新部署时，随带公开账本的代币在链上新放了一套验证合约和窗口表，Wrapper 沿用原来的。

| # | 改动 | 影响 |
| --- | --- | --- |
| 1 | 折叠的调用形式是 `fold(id, payload)`，不再是 `transferFrom`。payload 的字节不变。`Folded` 是 `(id, nonce)`，不带句柄 | 合约、dApp、脚本 |
| 2 | 删除 `prepare`、`cancel`、`preparedOf`、已存储的登记项，以及事件 `ConfidentialTransferPrepared`、`OperationPrepared`、`PreparedCancelled`、`PreparedExecuted` | 合约 |
| 3 | 带 payload 规则的 `mint(to, amount)` 取代 `mintConfidential`。新增 payload 类型 `0x82` | 合约、dApp、脚本 |
| 4 | 没有公开账本时，`approve` 回退 `NoPublicLedger()` | 合约 |
| 5 | `pep()` 改为 `casata()`，`pepModules()` 改为 `casataModules()`，家族接口改为 `ICasata*`。密钥派生的域名是 `"Casata"`，所以同一个钱包派生出的密钥与 0.5.0 的不同 | 合约、dApp |
| 6 | dApp 在签名前说明：钱包显示的那个数是句柄（07 §4） | dApp |
| 7 | 两个测试网代币重新部署。链上已有的验证合约、窗口表和 Wrapper 可以复用 | 部署 |

### 9.2 0.7.0 改变什么

相对于 0.6.0。决策记录：[ADR-0013](../../../adr/0013-mintable.zh-cn.md) 和 [A1-0007](../../../adr/a1-0007-exit-kind-binding.zh-cn.md)。电路不变，所以证明密钥、验证合约和窗口表都不变。合约已于 2026-10-15 实现并在本地测试（79 项测试通过），dApp 已跟进，两个参考代币当天部署到 BSC testnet。

| # | 改动 | 影响 |
| --- | --- | --- |
| 1 | 角色铸造改名为可增发：`ICasataMintable`、`A1Mintable`，代码 id `mintable`。接口 id 仍是 `0x40c10f19` | 合约、dApp、文档 |
| 2 | 初始发行移进内核：构造函数接收 `initialTo`、`initialAmount`、`initialPayload`；只有带可增发时才可以为零，否则 `NoSupply()`（§3） | 合约、部署脚本、dApp 部署表单 |
| 3 | `0x81` 销毁移进内核，每种组合都有。可增发只增加 `mint` | 合约、dApp |
| 4 | 收款人非零的出口绑定 `r` 而不是 `to`（§2，A1-0007）：`0x04` 用 `kind = 1`，`wrapperBurn` 用 `kind = 2`。销毁仍是 0 | 合约、dApp、脚本（证明 unshield 或 wrap 时） |
| 5 | 八个子集都是代币。允许公开账本与 Wrapper 端口同时存在 | 合约、测试、dApp 模块模拟器 |
| 6 | 可部署合约按 M10 决定 | 合约、部署脚本 |
| 7 | Wrapper 端口接受家族网关（[14](../../../14-gateway.zh-cn.md)）作为运行时模块。端口本身不变 | 文档、dApp |
| 8 | `casata()` = `A:1:0.7.0`。声明的清单是公开账本、可增发、Wrapper 端口 | 合约、dApp、07 §13.1 |
| 9 | 新的测试网代币。链上的验证合约、窗口表和 Wrapper 可以复用。0.6.0 的代币保留 | 部署 |
| 10 | 角色可枚举：`AccessControlEnumerable` 取代 `AccessControl`（M12） | 合约、dApp |

### 9.3 0.8.0 的改动

相对 0.7.0。决策记录：[ADR-0014](../../../adr/0014-eighteen-decimals.zh-cn.md)。2026-10-15 已在合约中实现并在本地测试（94 项测试通过）；dApp 和链上尚未跟进。窗口表沿用 0.7.0 的 `G8Table` 管第 0..47 位（不变，链上可复用），另加 `G8TableHigh` 管第 48..127 位（20,480 字节），没有拆成两个新的半张表。

| # | 改动 | 影响 |
| --- | --- | --- |
| 1 | 所有金额都 `< 2¹²⁸`：单笔金额、余额、公开金额。上限为 `issuedSupply() ≤ 2¹²⁸ − 1`（§3，01-design I2） | 电路、合约、dApp |
| 2 | 小数位是构造函数参数，0 到 18；超过回滚 `BadDecimals()`（§3） | 合约、部署脚本、dApp 部署表单、所有格式化金额的页面 |
| 3 | 转账和 unshield 电路对 `b`、`v`、`b − v` 做 128 位检查（01-design §5.1、§5.2）：新的证明密钥和验证合约。折叠电路不变，验证合约复用 | 电路、合约、部署、dApp（电路文件） |
| 4 | unshield 的公开输入为 8 个：`w2 = amount \| signBits<<128`，`w3 = r`（01-design §5.2）。转账仍为 14 个 | 电路、合约、客户端库 |
| 5 | `x·G` 的窗口表为 32 段、每段 4 位，分放在两个数据合约里（单个合约上限 24,576 字节）：`G8Table` 照旧管第 0..11 段，`G8TableHigh` 管第 12..31 段；构造函数接收两个地址。一笔公开入账最多加 32 个点，原来是 12 个。本地实测：`2⁴⁸ − 1` 为 80,796 gas，`2¹²⁸ − 1` 为 203,997，`1000·10¹⁸` 为 89,610（为零的 4 位段跳过） | 合约、部署脚本 |
| 6 | 没有离散对数兜底：金额只从 memo 读出（01-design §8） | 客户端库、dApp |
| 7 | `casata()` = `A:1:0.8.0`。模块和载荷类型不变 | 合约、dApp |
| 8 | 新的测试网代币，带新的验证合约和窗口表。链上的折叠验证合约和 Wrapper 可以复用。网关接受 `A:1:0.8.0`（[14](../../../14-gateway.zh-cn.md) §2）。0.7.0 的代币保留 | 部署、网关 |

## 10. 评审与测试

- 已发布的两种组合是作为独立合约评审的（[02-security-review](02-security-review.zh-cn.md)、[纯隐私组合的评审](../variant-1-privacy-only/03-security-review.zh-cn.md)）。重构之后要针对差异重新评审，重点是 §3 的钩子，以及每条铸造路径是否都按 `issuedSupply()` 检查上限。
- 0.7.0 的评审还要覆盖：初始发行（只发生一次、上限、带公开账本时的托管钩子、`NoSupply()`），每种组合上内核里的销毁，每个出口对 `r` 的组装，同时带公开账本和 Wrapper 端口的组合，以及生成各组合的脚本（M10）。
- 测试按模块、按实际发布的组合分别运行。每次操作之后都断言供应量守恒（§3 的表）。
- 0.5.0 的字节码：`A1LedgerToken` 18,339 字节，`A1PrivateToken` 17,345 字节；上限是 24,576。原来的独立合约是 17,060 和 17,195。 0.6.0：13,808 和 14,293；差别来自删掉的兜底路径。0.7.0 的八种组合：`A1Token` 12,305，`A1TokenM` 13,122，`A1TokenL` 14,237，`A1TokenW` 14,593，`A1LedgerToken` 14,683，`A1PrivateToken` 15,195，`A1TokenLW` 16,205，`A1TokenLMW` 16,765。两种已发布组合各大了约 900 字节，来自可枚举角色和初始发行。
- 0.8.0 的字节码：`A1Token` 12,449，`A1TokenM` 13,337，`A1TokenL` 14,544，`A1TokenW` 14,824，`A1LedgerToken` 14,889，`A1PrivateToken` 15,421，`A1TokenLW` 16,412，`A1TokenLMW` 16,972；比 0.7.0 多约 150 到 230 字节，来自小数位和第二张窗口表。
- gas：用同一套测试在本地与独立合约逐项对比，每项操作相差都在 300 gas 以内。新增的一项：带公开账本时的 `0x81` 销毁，账户首次花费时为 528k。

## 11. 决策

M1 到 M4 在 2026-10-13 按草案采纳，并已在 0.5.0 实现。M5 到 M7 属于 0.6.0。M8 到 M12 属于 0.7.0：M8、M9、M11 依据 owner 在 2026-10-15 的选择，记录在 ADR-0013 和 A1-0007 里，M12 也是当天选定的；M10 也在当天决定。

| # | 决策 | 采纳 | 未采用的做法 |
| --- | --- | --- | --- |
| M1 | 机密铸造叫什么 | 0.5.0：每种组合里都叫 `mintConfidential(id, amount)`；`mint(to, amount)` 永远是公开铸造。**在 0.6.0 被 M5 取代** | 保留 `mint`，含义随组合而变，和 0.5.0 之前一样 |
| M2 | 带公开账本的组合里要不要有 `mintConfidential` 和 `0x81` | 要 | 不加，让那个合约与已部署的完全一致 |
| M3 | 合约名 | §6 的提议 | 带公开账本的组合继续叫 `ConfidentialERC20A1` |
| M4 | 公开账本模块的接口 | `shieldedSupply()` | 用一个不依赖具体函数的标记 id |
| M5 | 0.6.0 的发行 | 只有一个 `mint(to, amount)`；`to` 的含义由 payload 决定，和转账一样（ADR-0010 第 10 条） | 在公开的 `mint` 之外保留 `mintConfidential`（M1） |
| M6 | 发给某个 id 时的 payload 类型 | 新增一个 A.1 私有类型 `0x82`，没有正文 | 复用 `0x03`。没有采用：家族把 `0x03` 登记为只属于公开账本模块，而纯隐私代币在没有这个模块的情况下发行 |
| M7 | 折叠的签名 | `fold(address id, bytes payload)`，不带句柄；`Folded(id, nonce)` | 保留句柄参数，并保留在事件里。没有采用：句柄是为了填金额槽而存在的，`fold` 没有金额槽；`id` 和 `nonce` 已经能确定一次折叠 |
| M8 | 初始发行 | 在构造函数里，按 `mint` 的规则：`initialTo`、`initialAmount`、`initialPayload`；只有带可增发时才可以为零（ADR-0013 第 2 条） | 部署后的一次性调用。没有采用：A.1 记入不需要证明，构造函数就能完成；部署后留着一个调用口，就多一件要关上的事 |
| M9 | `0x81` 销毁放在哪里 | 内核（ADR-0013 第 3 条） | 留在可增发里。owner 否决：只发行一次的代币也可能要销毁 |
| M10 | 0.7.0 的可部署合约 | 每个子集一个合约，共八个（owner，2026-10-15）。由脚本从各部分生成，每个只是一行继承，没有手写的。评审覆盖各模块以及模块相遇的地方（§3 的托管钩子、A1-0007 的出口），而不是逐个组合。每个子集都编译并跑冒烟测试；各模块和每对相遇的模块做深入测试。有人发行某个组合时才部署它 | 两个合约，编译进全部模块，由构造参数把模块永久关掉。未采纳：关掉的代码在链上仍可触达，每个开关都要单独评审；而且把全部模块放进一份字节码，模块一多就会撞上 24,576 字节的上限。无论哪种做法，子集数都随编译时模块翻倍；让它保持很小的是每个版本声明封闭的清单、大的功能挂在已有端口后面（ADR-0008 第 3、4 条） |
| M11 | 区分各出口 | 绑定截断到 160 位的 `r = keccak(…, kind, to)`，而不是 `to`（A1-0007） | 在电路里加一个类型输入，那是新 Variant；或者不做同时带两种出口的组合 |
| M12 | 列出角色持有者 | 核心使用 OpenZeppelin `AccessControlEnumerable`（owner，2026-10-15），前端用 view 调用就能确认谁持有 `MINTER_ROLE` 和 `DEFAULT_ADMIN_ROLE`，网关组合需要这一点（[14](../../../14-gateway.zh-cn.md) §4） | 普通 `AccessControl`，靠扫描角色事件。字节码更小，改角色时不多花 gas |
