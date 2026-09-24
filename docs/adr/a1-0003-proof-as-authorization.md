# A1-0003 证明即授权，`transferFrom` 为机密付款入口

- 状态：Accepted
- 日期：2026-09-24
- 范围：A.1

## 背景

机密账户没有以太坊地址，不可能成为 `msg.sender`。花费机密余额的本质授权是"知道私钥"，这已经包含在花费证明中。

## 决策

1. 机密账户作为付款方时，入口是 `transferFrom(from, to, x)` + payload（`0x01` / `0x04`）。
2. **`msg.sender` 不做任何检查**。授权 = 证明（含私钥知识与 `nonce`）。
3. `from` 为公开账户时，`transferFrom` 保持标准 allowance 语义（含 `0x03`）。
4. `transfer(to, x)` 只用于 `msg.sender` 的公开账户付款。

## 备选方案

- 要求 `msg.sender` 为某个绑定地址：机密账户没有地址；即使有，也会把 gas 来源与账户关联。

## 后果

- 正面：任何中继者可代付 gas；机密账户永远不需要 ETH；stealth 场景无需一次性以太坊密钥；DEX router 可通过 allowance 直接把兑换结果送入机密账本。
- 负面：第三方**不持有私钥**代为花费（托管式 allowance）不在此机制内，列入 backlog。
