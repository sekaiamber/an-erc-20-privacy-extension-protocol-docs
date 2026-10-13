[English](07-family-conventions.md) | 中文

# 07 家族级约定

状态：`Draft`　适用：所有 Track / Variant

本文是家族级的**规范性**约定。Track 与 Variant 文档只能在此基础上收窄或补充，不能与之冲突。

## 1. 入口：复用标准选择器 + 尾部 payload

- 不新增转账选择器。机密操作复用 `transfer(address,uint256)` 与 `transferFrom(address,address,uint256)`。
- payload 紧跟在 ABI 编码参数之后：`transfer` 从 `msg.data[68:]` 读，`transferFrom` 从 `msg.data[100:]` 读。
- 无 payload 的调用是普通的公开账本操作。没有公开账本模块（§13）的代币没有任何公开余额可动：`balanceOf` 返回 0，不带 payload 的 `transfer` 回退 `NoPublicLedger()`。

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

## 4. 句柄

机密转账（`0x01` / `0x02`）的 `amount` 槽位承载句柄：

```
handle = keccak256(payload) | (1 << 255)
```

最高位为 1 供索引器区分句柄与公开金额；公开金额受各 Variant 的供应上限约束，远小于 2²⁵⁵。

## 5. 授权

- `transfer`：付款方 = `msg.sender` 的公开账户。
- `transferFrom`：`from` 为公开账户时是标准 allowance；`from` 为机密 id 时由 Variant 定义（A.1：零知识证明），`msg.sender` 不做检查。

## 6. 兜底路径

无法拼 calldata 的调用方可先 `prepare(from, to, x, payload)` 登记，再由任何来源的裸 `transferFrom(from, to, x)` 执行；`cancel` 需提交原 payload。登记绑定当时的账户状态版本，过期即失败，不重试。

## 7. 事件

- 所有类型都发标准 `Transfer(from, to, x)`；`x` 为句柄或公开金额。带公开账本模块时，`0x03` / `0x04` 由公开账本托管转移触发 `Transfer(from, this, x)` / `Transfer(this, to, x)`。
- `0x03` / `0x04` 另发 `LedgerCrossing(from, to, type, amount)`。
- 机密转账另发 Variant 定义的专用事件（A.1：`ConfidentialTransfer`），供收款方扫描与监管方解密。
- Track B：note 转账发出 `Transfer(token, token, handle)`，价值进入时发出 `Transfer(0x0, token, amount)`，价值离开时发出 `Transfer(token, 0x0, amount)`，其中 `token` 是代币自身的地址。专用事件没有任何能识别用户的索引字段。

## 8. 密钥派生

所有 Variant 的用户密钥从钱包签名派生，钱包侧一次实现通用：

```
domain  = { name: "PEP", version: "1", chainId, verifyingContract }
message = { purpose: "<variant> key", index }
secret  = keccak256(sign_EIP712(domain, message)) mod <Variant 的标量域阶>
```

同一钱包用不同 `index` 派生多个账户。派生出的公钥是否上链由 Variant 决定（A.1：不上链）。

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
interface IPEP {
    /// ASCII "<track>:<variant>:<version>"，如 "A:1:0.2.4"，右补零字节
    function pep() external pure returns (bytes32);
}
```

- 合约通过 ERC-165 声明 `type(IPEP).interfaceId`。模块各自增加自己的接口 id（§13）。
- 前端对任意地址先 `supportsInterface`，再读 `pep()` 解析 track / variant / version 并路由到对应页面。页面提供哪些功能由模块决定（§13）。
- 描述符是**自我声明**：家族是宽松的，链上没有注册表，也不校验合约行为是否与声明一致（与 ERC-20 一样）。填错描述符的后果由发布者承担。
- `version` 跟随该 Variant 的设计文档版本；改电路、改接口或改变所支持的模块清单（§13.2）都要升版本。

## 11. 数值约束

各 Variant 自行规定金额位宽、余额位宽、decimals 与供应上限，但必须在其规范中显式写出，并保证任何账户余额都落在其证明系统覆盖的范围内（A.1：`totalSupply ≤ 2⁶⁴ − 1`）。

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
| 公开账本 | 编译时 | `IPEPPublicLedger` | 代币地址上的标准 ERC-20 余额；payload 类型 `0x03` / `0x04`；`shieldedSupply()`；`LedgerCrossing` | 无 |
| 角色铸造 | 编译时 | `IPEPRoleIssuance` | 由铸造角色按公开金额发行，由持有人按公开金额销毁。具体函数由各 Variant 定义（A.1：[04-modules §4.2](tracks/track-a/variant-1/04-modules.zh-cn.md)；B.1：[01-design §5](tracks/track-b/variant-1/01-design.zh-cn.md)） | 该 Variant 的供应上限 |
| Wrapper 端口 | 端口加运行时模块 | `IPEPWrappable` | `wrapperMint`、`wrapperBurn`、`wrapper()`；由家族 Wrapper（[10](10-wrapper.zh-cn.md)）使用 | 记入量不得超过经该端口出去的数量（`wrappedOut`） |

托管发行（锁定普通 ERC-20、发行隐私代币的金库）是保留名，尚未设计。

登记表只增不减。新登记一个模块，对已有的 Variant 版本没有任何影响。有的模块只对某一个 Track 有意义；它同样登记在这里，只由那个 Track 的 Variant 声明支持。

**支持声明。** 每个 Variant 的每个版本都要声明自己支持哪些模块（§13.2）：

| Variant 版本 | 公开账本 | 角色铸造 | Wrapper 端口 |
| --- | --- | --- | --- |
| A.1 0.5.0 | 支持 | 支持 | 支持 |
| B.1 0.1.0 | 不支持 | 支持 | 支持 |

这些接口在 `contracts/contracts/family/` 下。

### 13.2 规则

- **种类。** 编译时模块继承进代币合约。运行时模块是插在端口上的外部合约；端口本身是一个很小的编译时模块。
- **顺序。** 编译时模块按固定顺序继承：内核、公开账本、发行、端口。
- **供应。** 一种组合至少要有一个供应来源。
- **只走端口。** 运行时模块通过普通调用到达，绝不在代币的存储里运行。
- **不可安装。** 运行时模块在部署时定死，或只能设置一次。
- **限额。** 每个端口都带一个由代币强制的限额；代币不依赖模块自己的检查。
- **不设通用钩子。** 代币在转账前后不对外回调。
- **不改电路。** 需要换电路的是 Variant。更换电路所依赖的合约（校验器、链上哈希、查找表）也一样。
- **按版本声明。** Variant 的每个版本都要在自己的设计文档和 §13.1 的表里声明它支持的模块清单。这份清单是封闭的：该版本的代币可以使用其中任意几个，但不能使用清单之外的。以后新登记的模块，已有的版本不支持；要支持它，就得给这个 Variant 出一个新版本，至少升次版本号。

### 13.3 探针

```solidity
interface IPEPModules {
    struct Module { bytes4 id; address impl; }
    /// `impl == address(this)`：已编译进代币。其它非零地址：插在该端口上的运行时模块。
    /// 零地址：端口存在，但没有插任何模块。
    function pepModules() external view returns (Module[] memory);
}
```

- `id` 是该模块接口的 ERC-165 接口标识；`supportsInterface(id)` 对它返回 true。
- 这份清单与 `pep()` 一样是自我声明。
- `pep()` 说明代币是哪个 Variant 的哪个版本，也就说明了它可能带哪些模块；`pepModules()` 说明它实际带了哪些。
- 集成方不得从 Track 字母推断代币有没有公开余额，要从探针读取。
- A.1 0.5.0 已在合约仓库实现。在它之前部署的代币（0.4.0 和原 B.1 0.2.0）没有 `pepModules()`；对它们检测 Wrapper 端口用的是 `supportsInterface(type(IPEPWrappable).interfaceId)`。
- 接口标识：`IPEPModules` `0xad5ad25b`、`IPEPPublicLedger` `0x43dcbbd9`、`IPEPRoleIssuance` `0x60b2d978`、`IPEPWrappable` `0x1464bbec`。

### 13.4 没有公开账本模块的代币

它的 ERC-20 表面见 [00-erc20-surface](tracks/track-a/variant-1-privacy-only/00-erc20-surface.zh-cn.md)：`balanceOf` 恒为 0，不带 payload 的 `transfer` 回退，`totalSupply()` 等于已铸造减已销毁，铸造与销毁的金额公开。这是 Track A 的情况。Track B 的代币在 `balanceOf` 和事件上不同，见 [Track B 文档](tracks/track-b/README.zh-cn.md)。
