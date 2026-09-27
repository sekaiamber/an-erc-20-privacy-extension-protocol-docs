[English](README.md) | 中文

# B.1：A.1 的机密账本，去掉公开账本

版本：`0.1.1`　状态：`Prototype`（2026-09-27 部署到 BSC testnet）

| 文档 | 内容 |
| --- | --- |
| [01-design.md](01-design.zh-cn.md) | 设计：从 A.1 继承什么、删掉什么、ERC-20 表面、payload 类型、流程、电路、评估、wrapper 钩子、决策 |
| [03-security-review.md](03-security-review.zh-cn.md) | 第一轮安全自审：B1-F1..F10，修复随 0.1.1 发布 |
| [02-deployments.md](02-deployments.zh-cn.md) | 部署记录（BSC testnet），含 mint / 转账 / 折叠 / 销毁 / wrap / unwrap 实测 gas |

## 一句话

B.1 原样拿来 A.1 的机密账本（账户 = Baby Jubjub 公钥、twisted ElGamal 余额、Groth16 证明即授权、memo、监管密文、惰性折叠与 `0x80`），删掉公开账本：代币以公开金额直接铸造进机密账户，只以密文流转，只能以公开金额销毁离开。唯一公开的聚合量是 `totalSupply`。
