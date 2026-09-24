# 0003 ERC-20 表面约定：复用标准选择器与尾部 payload

- 状态：Accepted
- 日期：2026-09-24

## 背景

机密操作需要携带密文与证明，而 ERC-20 的 `transfer` / `transferFrom` 只有固定参数。目标是让现有钱包与合约无需新 ABI 就能触达机密功能，同时让协议语义精确、无歧义。

## 决策

1. **不新增转账选择器**。机密操作复用 `transfer(address,uint256)` 与 `transferFrom(address,address,uint256)`。
2. **payload 附加在 ABI 参数之后**：`transfer` 从 `msg.data[68:]` 读，`transferFrom` 从 `msg.data[100:]` 读。依赖 Solidity ABI 解码器忽略多余字节的特性（与 ERC-2771 相同）。
3. **payload 首字节为类型，次字节为 flags**。类型编号在家族级统一：`0x01` 机密→机密、`0x02` stealth、`0x03` 公开→机密、`0x04` 机密→公开。无 payload 即公开转账。
4. **`to` / `from` 的解释完全由 payload 类型决定**。协议不判断一个 20 字节值是钱包地址还是机密 id；无 payload 一律走公开账本；发错类型的后果由发送方承担，协议不做兜底。
5. **机密转账的 `amount` 槽位承载句柄**：`handle = keccak256(payload) | (1 << 255)`，最高位为 1 供索引器区分。
6. **所有类型都发标准 `Transfer` 事件**；机密细节另发专用事件。
7. **兜底路径**：无法拼 calldata 的调用方可先 `prepare(payload)` 登记，再以裸调用执行。

## 备选方案

- 新增 `transfer(address,uint256,bytes)` 重载：多一个 ABI 表面，且钱包原生界面同样用不了，收益不如尾部 payload。
- 给机密 id 加固定前缀并拒绝对其的公开转账：会误伤前缀相同的真实钱包，且违背第 4 条。

## 后果

- 正面：集成方零改动即可发起公开转账；dApp 与脚本可一笔完成机密操作；一个选择器覆盖全部模式。
- 负面：钱包会把句柄显示为一个巨大数字；ERC-2771 forwarder 的尾部追加与 payload 冲突，v0.x 不支持 2771。
