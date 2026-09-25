# A.1：ElGamal 加密账户 + SNARK

版本：`0.2.4-draft`　状态：`Draft`

| 文档 | 内容 |
| --- | --- |
| [01-design.md](01-design.md) | 细节设计：账户模型、payload 类型、执行流程、电路、Gas、范围与待决 |
| [02-security-review.md](02-security-review.md) | 第一轮安全自审：发现、修复、信任假设 |
| [03-deployments.md](03-deployments.md) | 部署记录（BSC testnet） |

## 一句话

在 Track A 双账本之上，机密账本采用**账户模型**：机密账户就是一把 Baby Jubjub 公钥（链上只见其哈希 id，公钥本身不上链），余额是一份 twisted ElGamal 密文，花费靠零知识证明授权并保证守恒与非负，每笔机密转账同时把金额加密给监管公钥。收付方以稳定化名出现，金额与余额隐藏。
