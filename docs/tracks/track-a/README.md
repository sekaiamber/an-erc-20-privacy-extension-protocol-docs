# Track A：双账本隐私机制

状态：`Draft`

## 定义

代币同时维护两个账本：

| 账本 | 状态 | `balanceOf` | 可组合性 |
| --- | --- | --- | --- |
| 公开账本 | 标准 ERC-20 余额，明文 | 返回真实余额 | 与现有 DeFi 完全兼容 |
| 机密账本 | 余额与转账金额隐藏，收付方是否隐藏由 Variant 决定 | 另有接口 | 仅协议内 |

用户可在两个账本之间搬运资产（shield / unshield），也可以在每个账本内部转账。

## 集成方契约（所有 A.x 遵守）

- 公开账本完全遵循 EIP-20，`balanceOf` / `transfer` / `approve` / `transferFrom` / `totalSupply` 语义不变。
- `totalSupply() == Σ 公开余额 + shieldedSupply()`，`shieldedSupply()` 公开可查。
- 机密操作复用 `transfer(address,uint256)` 选择器：`amount` 槽位承载 **句柄**（最高位为 1），附加数据放在 `msg.data[68:]`；无附加数据时查找此前通过 `prepare()` 登记的条目。
- 机密转账同样发出标准 `Transfer(from, to, handle)` 事件，索引器通过句柄最高位区分公开 / 机密转账。
- 通过 ERC-165 暴露 Track A 接口 id 与 Variant id。

## Variants

| Variant | 内核 | 收付方 | 金额 | 监管 |
| --- | --- | --- | --- | --- |
| [A.1](variant-1/README.md) | twisted ElGamal 加密账户 + SNARK | 公开 | 隐藏 | 第三份密文，密码学强制 |
