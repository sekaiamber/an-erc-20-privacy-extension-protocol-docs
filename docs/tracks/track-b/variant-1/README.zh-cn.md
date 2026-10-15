[English](README.md) | 中文

# B.1：note 模型，一个 join-split 电路

版本：`0.4.0-draft`　状态：`Draft`（0.4.0 于 2026-10-15 按 [ADR-0014](../../../adr/0014-eighteen-decimals.zh-cn.md) 起草：金额 `< 2¹²⁸`，小数位在部署时选；尚未实现。0.3.0 于 2026-10-15 按 [ADR-0013](../../../adr/0013-mintable.zh-cn.md) 起草，当天在合约中实现并部署到 BSC testnet。0.2.0：合约、电路和 dApp 页面已实现；2026-10-13 已部署到 BSC testnet）

| 文档 | 内容 |
| --- | --- |
| [01-design.md](01-design.zh-cn.md) | 设计：note、承诺与作废符、树、join-split 命题、ERC-20 表面、memo、流程、客户端、情景、隐私评估、成本、待定决策 |
| [02-deployments.md](02-deployments.zh-cn.md) | 部署记录：BSC testnet 上的地址，以及每种操作在链上实测的 gas |

所属 Track：[B，note 模型](../README.zh-cn.md)。决策记录：[ADR-0009](../../../adr/0009-track-b-notes.zh-cn.md)。

2026-10-12 之前，「B.1」这个名字指的是现在的 A.1 纯隐私组合。它的文档、部署记录和评审编号（`B1-F1` 等）在 [track-a/variant-1-privacy-only](../../track-a/variant-1-privacy-only/README.zh-cn.md)。
