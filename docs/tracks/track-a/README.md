# Track A：双账本隐私机制

状态：`Draft`

## 定义

代币同时维护两个账本：

| 账本 | key | 状态 | `balanceOf` | 可组合性 |
| --- | --- | --- | --- | --- |
| 公开账本 | 以太坊地址 | 标准 ERC-20 余额，明文 | 返回真实余额 | 与现有 DeFi 完全兼容 |
| 机密账本 | 机密账户 id（20 字节，由 Variant 定义派生方式） | 余额与转账金额隐藏 | 另有接口 | 仅协议内 |

用户可在两个账本之间划转，也可以在每个账本内部转账。四种组合都是单次调用。

## 集成方契约（所有 A.x 遵守）

- 公开账本完全遵循 EIP-20。
- `totalSupply() == Σ 公开余额 + shieldedSupply()`，`shieldedSupply()` 公开。
- 只用 ERC-20 已有的 `transfer(address,uint256)` 与 `transferFrom(address,address,uint256)` 选择器。附加数据（payload）放在 ABI 参数之后：`transfer` 从 `msg.data[68:]`、`transferFrom` 从 `msg.data[100:]` 读取。
- **`to` / `from` 的解释由 payload 类型决定**，协议不试图判断一个 20 字节值是钱包地址还是机密 id。无 payload 一律走公开账本。
- payload 第一字节是类型，第二字节是 flags；类型编号在 Track 级统一：`0x01` 机密→机密、`0x02` stealth、`0x03` 公开→机密、`0x04` 机密→公开。
- `transferFrom` 的授权：`from` 为公开账户时是标准 allowance；`from` 为机密 id 时由 Variant 定义（A.1：零知识证明），`msg.sender` 不做检查。
- 机密转账的 `amount` 槽位承载句柄，最高位为 1；所有类型都发标准 `Transfer` 事件。
- 无附加数据的调用可通过事先 `prepare(payload)` 登记来执行机密操作（兜底路径）。
- 通过 ERC-165 暴露 Track A 接口 id 与 Variant id。

## Variants

| Variant | 内核 | 收付方 | 金额 | 监管 | 状态 |
| --- | --- | --- | --- | --- | --- |
| [A.1](variant-1/README.md) | twisted ElGamal 加密账户 + SNARK，账户 = 公钥 | 化名（id 稳定可关联） | 隐藏 | 第三份密文，密码学强制 | 0.2-draft |
