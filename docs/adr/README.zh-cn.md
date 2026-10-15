[English](README.md) | 中文

# 架构决策记录（ADR）

记录项目中重要且不易逆转的技术决策。每条 ADR 一个文件，编号递增。

- 家族级：`NNNN-短标题.md`
- Variant 级：`a1-NNNN-短标题.md`（前缀为 Variant 编号小写）

ADR-0001 到 ADR-0010 写于项目定名 Casata（[0011](0011-project-name-casata.zh-cn.md)）之前，保留当时使用的名字：PEP、`pep()`、`IPEP*`、`PEPWrapper`。

## 家族级

| 编号 | 标题 | 状态 |
| --- | --- | --- |
| [0001](0001-use-hardhat3-for-contracts.zh-cn.md) | 合约开发环境采用 Hardhat 3 | Accepted |
| [0002](0002-track-variant-structure.zh-cn.md) | 协议家族按 Track / Variant 组织 | Accepted（由 0007、0008 修订） |
| [0007](0007-track-definition.zh-cn.md) | 什么才算 Track：不可替代且外部可见 | Accepted（由 0008 修订） |
| [0008](0008-modules.zh-cn.md) | Track、Variant 与模块：公开账本是模块，不是 Track | Accepted（2026-10-13 已实现；第 5、6 条由 0013 修订） |
| [0009](0009-track-b-notes.zh-cn.md) | 开设 Track B：note 模型 | Accepted（仅设计；前提已满足） |
| [0003](0003-erc20-surface-conventions.zh-cn.md) | ERC-20 表面约定：复用标准选择器与尾部 payload | Accepted（由 0010 修订） |
| [0010](0010-erc20-surface-tradeoffs.zh-cn.md) | ERC-20 兼容逐项取舍；转账仍是共用的动词 | Accepted（2026-10-13 已实现） |
| [0006](0006-regulatory-committee.zh-cn.md) | 监管方改为门限委员会合约；密码内核改为普通 ElGamal | Accepted（§3 已落地；委员会原型 2026-09-29 落地） |
| [0005](0005-family-wrapper.zh-cn.md) | 家族级 Wrapper 是工具，不取代 Track A | Accepted（用语由 0008 更新） |
| [0004](0004-regulatory-access-principles.zh-cn.md) | 监管接入原则 | Accepted |
| [0011](0011-project-name-casata.zh-cn.md) | 项目定名 Casata；缩写 PEP 停用 | Accepted（2026-10-13 已实现；仓库尚未改名） |
| [0012](0012-visual-identity.zh-cn.md) | 视觉形象：秘密账簿，以一枚火漆印为标志 | Accepted（只接受风格；dApp 之后再做） |
| [0013](0013-mintable.zh-cn.md) | 可增发：部署后的发行是模块，初始发行和销毁属于核心 | Accepted（待在 A.1 0.7.0、B.1 0.3.0 中实现） |
| [0014](0014-eighteen-decimals.zh-cn.md) | 18 位小数：A.1 0.8.0 和 B.1 0.4.0 起金额宽 128 位，小数位在部署时选 | Accepted（待在 A.1 0.8.0、B.1 0.4.0 中实现） |

## A.1

| 编号 | 标题 | 状态 |
| --- | --- | --- |
| [A1-0001](a1-0001-account-is-public-key.zh-cn.md) | 机密账户 = 公钥，公钥不上链 | Accepted |
| [A1-0002](a1-0002-crypto-core.zh-cn.md) | 密码内核：twisted ElGamal on Baby Jubjub + Groth16 | Accepted |
| [A1-0003](a1-0003-proof-as-authorization.zh-cn.md) | 证明即授权，`transferFrom` 为机密付款入口 | Accepted |
| [A1-0004](a1-0004-pending-lazy-fold.zh-cn.md) | available / pending 拆分与惰性折叠 | Accepted |
| [A1-0005](a1-0005-numeric-parameters.zh-cn.md) | 数值参数：位宽、decimals、供应上限 | Accepted（位宽和小数位自 0.8.0 起被 0014 取代） |
| [A1-0006](a1-0006-fold-and-received-block.zh-cn.md) | 纯折叠 `0x80` 与 `lastReceivedAtBlock`（仅 A.1） | Accepted |
| [A1-0007](a1-0007-exit-kind-binding.zh-cn.md) | unshield 证明通过收款人的值绑定它是给哪个出口的 | Accepted（待在 0.7.0 中实现） |

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
