# 07 家族级约定

状态：`Draft`　适用：所有 Track / Variant

本文是家族级的**规范性**约定。Track 与 Variant 文档只能在此基础上收窄或补充，不能与之冲突。

## 1. 入口：复用标准选择器 + 尾部 payload

- 不新增转账选择器。机密操作复用 `transfer(address,uint256)` 与 `transferFrom(address,address,uint256)`。
- payload 紧跟在 ABI 编码参数之后：`transfer` 从 `msg.data[68:]` 读，`transferFrom` 从 `msg.data[100:]` 读。
- 无 payload 的调用是普通的公开账本操作（Track B 无公开账本时由其 Track 文档定义无 payload 的行为）。

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
| `0x03` | 公开 → 机密 | 仅 Track A |
| `0x04` | 机密 → 公开 | 仅 Track A |
| `0x05`–`0x7F` | 保留 | 未来家族级类型 |
| `0x80`–`0xFF` | Variant 私有 | 各 Variant 自定义，须在其规范中登记 |

**flags**：bit 0 = `includePending`，bit 1 = 携带 `decryptable` 段；其余保留，必须为 0，否则 revert。

## 3. `to` / `from` 的解释

`to` 与 `from` 是 20 字节值，**其含义完全由 payload 类型决定**：无 payload 或 `0x03` 的 `from` 是公开账户；`0x01` / `0x02` / `0x04` 的 `from` 是机密 id；`0x01` / `0x03` 的 `to` 是机密 id。协议不判断一个值"是钱包还是 id"，不做兜底，发错类型的后果由发送方承担（ADR-0003 第 4 条）。

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

- 所有类型都发标准 `Transfer(from, to, x)`；`x` 为句柄或公开金额。Track A 中 `0x03` / `0x04` 由公开账本托管转移触发 `Transfer(from, this, x)` / `Transfer(this, to, x)`。
- `0x03` / `0x04` 另发 `LedgerCrossing(from, to, type, amount)`。
- 机密转账另发 Variant 定义的专用事件（A.1：`ConfidentialTransfer`），供收款方扫描与监管方解密。

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

每笔需要监管可读的操作记录所用 `keyId`。监管方仅凭链上数据与自身私钥即可重建任意账户任意时刻余额，不需要任何人配合；没有冻结、没收、强制转账接口。

## 10. 家族描述符与 ERC-165

```solidity
interface IPEP {
    /// ASCII "<track>:<variant>:<version>"，如 "A:1:0.2.4"，右补零字节
    function pep() external pure returns (bytes32);
}
```

- 合约通过 ERC-165 声明 `type(IPEP).interfaceId`；这是家族级唯一的接口 id。
- 前端对任意地址先 `supportsInterface`，再读 `pep()` 解析 track / variant / version 并路由到对应页面。
- 描述符是**自我声明**：家族是宽松的，链上没有注册表，也不校验合约行为是否与声明一致（与 ERC-20 一样）。填错描述符的后果由发布者承担。
- `version` 跟随该 Variant 的设计文档版本；改电路或接口即升版本。

## 11. 数值约束

各 Variant 自行规定金额位宽、余额位宽、decimals 与供应上限，但必须在其规范中显式写出，并保证任何账户余额都落在其证明系统覆盖的范围内（A.1：`totalSupply ≤ 2⁶⁴ − 1`）。

## 12. 隐私目标评估表

每个 Variant 按 [04 设计目标](04-design-goals.md) 的 P1–P5 与 S1–S5 自评，格式：

| 目标 | 达成 | 说明 |
| --- | --- | --- |
| P1 金额隐藏 | 完全 / 部分 / 否 | |
| P2 收款方 | 隐藏 / 化名 / 公开 | |
| P3 付款方 | 隐藏 / 化名 / 公开 | |
| P4 交易关联 | … | |
| P5 划转关联 | … | |
| S1–S5 | 满足 / 不满足 | |
