# 架构决策记录（ADR）

记录项目中重要且不易逆转的技术决策。每条 ADR 一个文件，编号递增。

- 家族级：`NNNN-短标题.md`
- Variant 级：`a1-NNNN-短标题.md`（前缀为 Variant 编号小写）

## 家族级

| 编号 | 标题 | 状态 |
| --- | --- | --- |
| [0001](0001-use-hardhat3-for-contracts.md) | 合约开发环境采用 Hardhat 3 | Accepted |
| [0002](0002-track-variant-structure.md) | 协议家族按 Track / Variant 组织 | Accepted |
| [0003](0003-erc20-surface-conventions.md) | ERC-20 表面约定：复用标准选择器与尾部 payload | Accepted |
| [0004](0004-regulatory-access-principles.md) | 监管接入原则 | Accepted |

## A.1

| 编号 | 标题 | 状态 |
| --- | --- | --- |
| [A1-0001](a1-0001-account-is-public-key.md) | 机密账户 = 公钥，公钥不上链 | Accepted |
| [A1-0002](a1-0002-crypto-core.md) | 密码内核：twisted ElGamal on Baby Jubjub + Groth16 | Accepted |
| [A1-0003](a1-0003-proof-as-authorization.md) | 证明即授权，`transferFrom` 为机密付款入口 | Accepted |
| [A1-0004](a1-0004-pending-lazy-fold.md) | available / pending 拆分与惰性折叠 | Accepted |
| [A1-0005](a1-0005-numeric-parameters.md) | 数值参数：位宽、decimals、供应上限 | Accepted |

## 模板

```markdown
# NNNN 标题

- 状态：Proposed / Accepted / Deprecated / Superseded by NNNN
- 日期：YYYY-MM-DD
- 范围：家族 / A.1 / …

## 背景

为什么需要做这个决定，当前面临的约束。

## 决策

做了什么决定。

## 备选方案

考虑过但没有采用的方案，以及原因。

## 后果

这个决定带来的正面与负面影响。
```
