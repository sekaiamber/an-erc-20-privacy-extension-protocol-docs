[English](07-family-conventions.md) | 中文

# 07 家族级约定

状态：`Draft`　适用：所有 Track / Variant

本文是家族级的**规范性**约定。Track 与 Variant 文档只能在此基础上收窄或补充，不能与之冲突。

> 2026-10-13：§1、§3 到 §7、§13、§14 按 [ADR-0010](adr/0010-erc20-surface-tradeoffs.zh-cn.md) 改写，名字按 [ADR-0011](adr/0011-project-name-casata.zh-cn.md) 改用新名。A.1 从 0.6.0、B.1 从 0.2.0 起实现本文。更早版本的代币遵循改写之前的文本：它们回答的是 `pep()` 而不是 `casata()`，用 `mintConfidential` 发行，A.1 还带有 `prepare` / `cancel`。

> 2026-10-15：§3、§5、§7、§13、§14 按 [ADR-0013](adr/0013-mintable.zh-cn.md)（2026-10-15 接受）改写：角色铸造改名为可增发，初始发行和持有人的销毁归核心。A.1 从 0.7.0、B.1 从 0.3.0 起实现。更早的版本遵循改写之前的文本，其中这个模块叫角色铸造，并带着销毁。

## 1. 入口：转账动词 + 尾部 payload

决策记录：[ADR-0003](adr/0003-erc20-surface-conventions.zh-cn.md)，由 [ADR-0010](adr/0010-erc20-surface-tradeoffs.zh-cn.md) 修订。

- 凡是移动价值的操作，都走 `transfer(address,uint256)` 或 `transferFrom(address,address,uint256)`。转账不新增选择器。
- 标准参数放不下的内容由 payload 携带。签名由别人规定的函数，payload 紧跟在 ABI 编码参数之后：`transfer` 从 `msg.data[68:]` 读，`transferFrom` 从 `msg.data[100:]` 读，`mint`（§13.1）从 `msg.data[68:]` 读。Variant 自己定义的函数，把 `bytes payload` 作为普通参数。
- 不带 payload 的调用，行为与标准函数完全一致：它是普通的公开账本操作。没有公开账本模块（§13）的代币没有任何公开余额可动：不带 payload 的 `transfer`、`transferFrom`、`mint` 回退 `NoPublicLedger()`。
- 不移动价值的操作不使用转账动词，它是 Variant 自己的函数（A.1：`fold`）。
- 对 ERC-20 的兼容逐项决定，用三个问题：代币给出的回答是真的吗，便宜吗，有人用吗或者它让设计更容易讲清楚吗（ADR-0010 第 1 条）。

## 2. payload 头部

```
byte 0   type
byte 1   flags
byte 2.. 由 type 决定的段
```

**type 注册表**（家族级统一，Variant 不得挪用）：

| type | 名称 | 语义 |
| --- | --- | --- |
| `0x01` | 机密转账 | 机密 → 机密 |
| `0x02` | stealth 机密转账 | 机密 → 一次性机密 id |
| `0x03` | 公开 → 机密 | 仅公开账本模块（§13） |
| `0x04` | 机密 → 公开 | 仅公开账本模块（§13） |
| `0x05`–`0x7F` | 保留 | 未来家族级类型 |
| `0x80`–`0xFF` | Variant 私有 | 各 Variant 自定义，须在其规范中登记 |

**flags**：bit 0 = `includePending`，bit 1 = 携带 `decryptable` 段；其余保留，必须为 0，否则 revert。

## 3. `to` / `from` 的解释

`to` 与 `from` 是 20 字节值，**其含义完全由 payload 类型决定**：无 payload 或 `0x03` 的 `from` 是公开账户；`0x01` / `0x02` / `0x04` 的 `from` 是机密 id；`0x01` / `0x03` 的 `to` 是机密 id。协议不判断一个值"是钱包还是 id"，不做兜底，发错类型的后果由发送方承担（ADR-0003 第 4 条）。

Track B（note 模型）里没有 id。带 note 转账 payload 时，`from` 和 `to` 必须是代币自身的地址；销毁时 `to` 是零地址。见 [Track B 文档](tracks/track-b/README.zh-cn.md)。

对 `mint`：不带 payload 时 `to` 是公开账户；带 payload 时由 Variant 的发行类型决定它的含义，A.1 里是机密 id，B.1 里是代币自身的地址。部署时的初始发行（§14）按同一规则指定接收方。

## 4. 句柄

机密转账（`0x01` / `0x02`）的 `amount` 槽位承载句柄：

```
handle = keccak256(payload) | (1 << 255)
```

最高位为 1 供索引器区分句柄与公开金额；公开金额受各 Variant 的供应上限约束，远小于 2²⁵⁵。

区块浏览器和钱包会把句柄显示成一个很大的金额。客户端在请钱包对一笔带句柄的调用签名之前要说明这一点：钱包显示的那个数是句柄，不是金额。

## 5. 授权

- `transfer`：付款方 = `msg.sender` 的公开账户。
- `transferFrom`：`from` 为公开账户时是标准 allowance；`from` 为机密 id 时由 Variant 定义（A.1：零知识证明），`msg.sender` 不做检查。
- `approve` / `allowance`：带公开账本模块的代币上是标准行为。没有公开账本模块的代币上，`approve` 回退 `NoPublicLedger()`，`allowance` 返回 0：没有任何东西可供授权，返回 true 就是假回答。
- `mint`：可增发模块（§13.1）的铸造角色。
- 销毁：持有人本人，按 Variant 自己的授权方式；不需要角色（§14）。

## 6. 兜底路径（已撤销）

本节原先描述 `prepare` / `cancel`：先登记一笔机密操作，之后由裸 `transferFrom` 执行。[ADR-0010](adr/0010-erc20-surface-tradeoffs.zh-cn.md) 撤销了它。Variant 不必实现；A.1 在 0.6.0 删除，B.1 从来没有。保留节号是为了让对后面各节的引用继续有效。

## 7. 事件

- 凡是移动价值的操作都发标准 `Transfer(from, to, x)`；`x` 为句柄或公开金额。带公开账本模块时，`0x03` / `0x04` 由公开账本托管转移触发 `Transfer(from, this, x)` / `Transfer(this, to, x)`。
- 发行（包括部署时的初始发行）发出来自零地址的 `Transfer`，销毁发出去往零地址的 `Transfer`。
- 不移动价值的操作不发 `Transfer`，它有自己的事件（A.1：`Folded`）。
- `0x03` / `0x04` 另发 `LedgerCrossing(from, to, type, amount)`。
- 机密转账另发 Variant 定义的专用事件（A.1：`ConfidentialTransfer`），供收款方扫描与监管方解密。
- Track B：note 转账发出 `Transfer(token, token, handle)`，价值进入时发出 `Transfer(0x0, token, amount)`，价值离开时发出 `Transfer(token, 0x0, amount)`，其中 `token` 是代币自身的地址。专用事件没有任何能识别用户的索引字段。

## 8. 密钥派生

所有 Variant 的用户密钥从钱包签名派生，钱包侧一次实现通用：

```
domain  = { name: "Casata", version: "1", chainId, verifyingContract }
message = { purpose: "<variant> key", index }
secret  = keccak256(sign_EIP712(domain, message)) mod <Variant 的标量域阶>
```

同一钱包用不同 `index` 派生多个账户。派生出的公钥是否上链由 Variant 决定（A.1：不上链）。改名（ADR-0011）之前各版本的代币使用域名 `"PEP"`，所以它们的密钥与这里派生出的不同。

## 9. 监管接口

原则见 ADR-0004。合约接口最小集：

```solidity
function regulatorKey(uint32 keyId) external view returns (...);   // 历史密钥永久可查
function activeRegulatorKeyId() external view returns (uint32);
function rotateRegulatorKey(...) external;                          // REGULATOR_ADMIN 角色
event RegulatorKeyRotated(uint32 indexed keyId, ...);
```

每笔需要监管可读的操作记录所用 `keyId`。监管方仅凭链上数据与自身私钥即可重建任意账户任意时刻余额，不需要任何人配合；没有冻结、没收、强制转账接口。`pk_reg` 可以是单把密钥，也可以是[监管委员会](11-regulatory-committee.zh-cn.md)的门限群公钥——代币接口相同。

## 10. 家族描述符与 ERC-165

```solidity
interface ICasata {
    /// ASCII "<track>:<variant>:<version>"，如 "A:1:0.6.0"，右补零字节
    function casata() external pure returns (bytes32);
}
```

- 合约通过 ERC-165 声明 `type(ICasata).interfaceId`（`0x75118339`）。模块各自增加自己的接口 id（§13）。
- 前端对任意地址先 `supportsInterface`，再读 `casata()` 解析 track / variant / version 并路由到对应页面。页面提供哪些功能由模块决定（§13）。
- 在 [ADR-0011](adr/0011-project-name-casata.zh-cn.md) 之前，这个接口是 `IPEP`，函数是 `pep()`（`0xace237f5`）。A.1 到 0.5.0 为止的代币和 B.1 0.1.0 的代币回答的是它，不是 `casata()`。
- 描述符是**自我声明**：家族是宽松的，链上没有注册表，也不校验合约行为是否与声明一致（与 ERC-20 一样）。填错描述符的后果由发布者承担。
- `version` 跟随该 Variant 的设计文档版本；改电路、改接口或改变所支持的模块清单（§13.2）都要升版本。

## 11. 数值约束

各 Variant 自行规定金额位宽、余额位宽与供应上限，在其规范中显式写出，并保证任何账户余额都落在其证明系统覆盖的范围内（A.1 自 0.8.0、B.1 自 0.4.0 起：所有金额 `< 2¹²⁸`，`totalSupply ≤ 2¹²⁸ − 1`）。

代币的 `decimals` 在部署时选，0 到 18，由 `decimals()` 返回。没有哪个电路依赖它：它只决定小数点显示在哪里（[ADR-0014](adr/0014-eighteen-decimals.zh-cn.md)）。A.1 到 0.7.0、B.1 到 0.3.0 为止固定 6 位小数，位宽也更窄（[A1-0005](adr/a1-0005-numeric-parameters.zh-cn.md)）。

## 12. 隐私目标评估表

每个 Variant 按 [04 设计目标](04-design-goals.zh-cn.md) 的 P1–P5 与 S1–S5 自评，格式：

| 目标 | 达成 | 说明 |
| --- | --- | --- |
| P1 金额隐藏 | 完全 / 部分 / 否 | |
| P2 收款方 | 隐藏 / 化名 / 公开 | |
| P3 付款方 | 隐藏 / 化名 / 公开 | |
| P4 交易关联 | … | |
| P5 划转关联 | … | |
| S1–S5 | 满足 / 不满足 | |

## 13. 模块

决策记录：[ADR-0008](adr/0008-modules.zh-cn.md)。模块是合约层的选配，原样复用 Variant 的电路。本节是家族的登记表；每个 Variant 实现它支持的模块，并写明不支持哪些。

### 13.1 登记表

| 模块 | 种类 | 接口 | 增加了什么 | 代币强制的限额 |
| --- | --- | --- | --- | --- |
| 公开账本 | 编译时 | `ICasataPublicLedger` | 代币地址上的标准 ERC-20 余额；payload 类型 `0x03` / `0x04`；`shieldedSupply()`；`LedgerCrossing` | 无 |
| 可增发 | 编译时 | `ICasataMintable` | 部署后的发行：供铸造角色使用的 `mint(address to, uint256 amount)`，遵循 §1 的 payload 规则。不带 payload 时是向 `to` 的公开发行。带 payload 时把一笔公开金额发行到机密一侧，`to` 的含义由 Variant 的发行类型决定（A.1：[04-modules §4.2](tracks/track-a/variant-1/04-modules.zh-cn.md)；B.1：[01-design §5](tracks/track-b/variant-1/01-design.zh-cn.md)）。到 A.1 0.6.0 和 B.1 0.2.0 为止叫角色铸造，并带着持有人的销毁（ADR-0013） | 该 Variant 的供应上限 |
| Wrapper 端口 | 端口加运行时模块 | `ICasataWrappable` | `wrapperMint`、`wrapperBurn`、`wrapper()`；由家族 Wrapper（[10](10-wrapper.zh-cn.md)）或家族网关（[14](14-gateway.zh-cn.md)）使用 | 记入量不得超过经该端口出去的数量（`wrappedOut`） |

托管发行到 2026-10-15 为止是保留名，现已撤回（ADR-0013 第 5 条）。已有 ERC-20 的隐私版本，是一个带可增发和 Wrapper 端口、铸造者和 wrapper 都是家族网关（[14](14-gateway.zh-cn.md)）的代币。

登记表只增不减。新登记一个模块，对已有的 Variant 版本没有任何影响。有的模块只对某一个 Track 有意义；它同样登记在这里，只由那个 Track 的 Variant 声明支持。

**支持声明。** 每个 Variant 的每个版本都要声明自己支持哪些模块（§13.2）：

| Variant 版本 | 公开账本 | 可增发（0.7.0 / 0.3.0 之前叫角色铸造） | Wrapper 端口 |
| --- | --- | --- | --- |
| A.1 0.5.0 | 支持 | 支持 | 支持 |
| A.1 0.6.0 | 支持 | 支持 | 支持 |
| A.1 0.7.0（草案） | 支持 | 支持 | 支持 |
| B.1 0.1.0 | 不支持 | 支持 | 支持 |
| B.1 0.2.0 | 不支持 | 支持 | 支持 |
| B.1 0.3.0（草案） | 不支持 | 支持 | 支持 |

这些接口在 `contracts/contracts/family/` 下。

### 13.2 规则

- **种类。** 编译时模块继承进代币合约。运行时模块是插在端口上的外部合约；端口本身是一个很小的编译时模块。
- **顺序。** 编译时模块按固定顺序继承：内核、公开账本、发行、端口。
- **供应。** 每个代币在部署时发行初始供应（§14）。可增发是唯一能在部署后发行的模块；端口放回的量不超过从它出去的量。到 A.1 0.6.0 和 B.1 0.2.0 为止，规则是一种组合至少要有一个供应来源，而供应来源只有角色铸造（ADR-0013）。
- **只走端口。** 运行时模块通过普通调用到达，绝不在代币的存储里运行。
- **不可安装。** 运行时模块在部署时定死，或只能设置一次。
- **限额。** 每个端口都带一个由代币强制的限额；代币不依赖模块自己的检查。
- **不设通用钩子。** 代币在转账前后不对外回调。
- **不改电路。** 需要换电路的是 Variant。更换电路所依赖的合约（校验器、链上哈希、查找表）也一样。
- **按版本声明。** Variant 的每个版本都要在自己的设计文档和 §13.1 的表里声明它支持的模块清单。这份清单是封闭的：该版本的代币可以使用其中任意几个，但不能使用清单之外的。以后新登记的模块，已有的版本不支持；要支持它，就得给这个 Variant 出一个新版本，至少升次版本号。

### 13.3 探针

```solidity
interface ICasataModules {
    struct Module { bytes4 id; address impl; }
    /// `impl == address(this)`：已编译进代币。其它非零地址：插在该端口上的运行时模块。
    /// 零地址：端口存在，但没有插任何模块。
    function casataModules() external view returns (Module[] memory);
}
```

- `id` 是该模块接口的 ERC-165 接口标识；`supportsInterface(id)` 对它返回 true。
- 这份清单与 `casata()` 一样是自我声明。
- `casata()` 说明代币是哪个 Variant 的哪个版本，也就说明了它可能带哪些模块；`casataModules()` 说明它实际带了哪些。
- 集成方不得从 Track 字母推断代币有没有公开余额，要从探针读取。
- 接口标识：`ICasataModules` `0xf71c7351`、`ICasataPublicLedger` `0x43dcbbd9`、`ICasataMintable` `0x40c10f19`、`ICasataWrappable` `0x1464bbec`。可增发的标识就是 `mint(address,uint256)` 的选择器，因为这个接口只有这一个函数。到 A.1 0.6.0 和 B.1 0.2.0 为止，同一个标识叫 `ICasataRoleIssuance`。
- 更早的版本：A.1 0.5.0 和 B.1 0.1.0 有同样的探针，名字是 `pepModules()`（`IPEPModules`，`0xad5ad25b`），它们的角色铸造标识是 `0x60b2d978`（`mintConfidential`）。A.1 0.5.0 之前的代币没有探针；对它们检测 Wrapper 端口用的是 `supportsInterface(0x1464bbec)`。

### 13.4 没有公开账本模块的代币

它的 ERC-20 表面由 Variant 规定：A.1 见 [04-modules §5](tracks/track-a/variant-1/04-modules.zh-cn.md)，B.1 见 [01-design §5](tracks/track-b/variant-1/01-design.zh-cn.md)。Track A 里，`balanceOf` 恒为 0，不带 payload 的 `transfer` 回退，`approve` 回退，`totalSupply()` 等于已铸造减已销毁、再减去经 Wrapper 出去的数量，铸造与销毁的金额公开。Track B 的代币在 `balanceOf` 和事件上不同，见 [Track B 文档](tracks/track-b/README.zh-cn.md)。这套表面背后的决定最早记录在 [00-erc20-surface](tracks/track-a/variant-1-privacy-only/00-erc20-surface.zh-cn.md)，它描述的是 2026-09 的独立合约，作为记录保留。

## 14. 读取表面与供应量

- 每个代币都保留 `name`、`symbol`、`decimals`、`totalSupply`、`balanceOf`。它们在每个代币上给出的回答都是真的。没有公开账本的代币上，`balanceOf` 报告的是公开余额，对用户来说就是零。
- `totalSupply()` 等于在该代币上已发行且未销毁的数量。
- **初始发行**（ADR-0013，A.1 0.7.0 与 B.1 0.3.0 起）。每个代币在部署时发行一次初始供应，接收方按 `mint` 的规则指定（§3）。具体做法由 Variant 定。只有带可增发的代币，初始发行量才可以是零；否则部署回滚。不带可增发的代币是固定供应：只能因销毁而减少。
- **销毁**（同上）。每个代币都允许持有人销毁自己余额里的一笔公开金额：`transferFrom(from, 0x0, amount)` 加 Variant 的销毁类型，按 Variant 的授权方式，不需要角色。在隐私代币里，转给没人控制的 id 金额是隐藏的，所以销毁是唯一能让别人核对的减少供应的方式。
- 推荐而非强制：代币给出足以让任何人算出机密供应量的数字，即从 `totalSupply()` 里减去公开部分。Variant 怎么呈现由它自己决定。带公开账本的 A.1 有 `shieldedSupply()`；B.1 让代币自身地址在 `balanceOf` 里持有机密供应量。
- 代币能否隐藏自己的供应量，目前没有决定。没有 Variant 这样做。
