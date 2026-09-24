# 文档索引

本目录包含「ERC-20 隐私扩展协议」项目的全部研究与设计文档。建议按编号顺序阅读。

| 编号 | 文档 | 内容 |
| --- | --- | --- |
| 01 | [项目概述](01-overview.md) | 项目动机、目标、范围与非目标 |
| 02 | [背景知识](02-background.md) | ERC-20 标准回顾、EVM 上的隐私问题从何而来 |
| 03 | [方案全景](03-landscape.md) | 现有链上隐私方案调研与分类 |
| 04 | [设计目标](04-design-goals.md) | 协议需要满足的性质与权衡 |
| 05 | [威胁模型](05-threat-model.md) | 假设的攻击者能力、需要保护的信息、不在保护范围内的信息 |
| 06 | [家族架构](06-family-architecture.md) | 家族级约定 / Track / Variant 三层结构与演进规则 |
| 07 | [家族级约定](07-family-conventions.md) | 规范性：选择器与 payload、type 注册表、句柄、授权、事件、密钥派生、监管接口、ERC-165 |
| 08 | [路线图](08-roadmap.md) | 阶段计划与里程碑 |
| — | [Tracks](tracks/README.md) | 协议家族的 Track / Variant 目录，主线 A.1 设计在此 |
| 09 | [开发指南](09-development.md) | 仓库、submodule、合约环境的使用方法 |
| — | [术语表](glossary.md) | 项目中使用的术语定义 |
| — | [参考资料](references.md) | EIP、论文、代码库链接 |
| — | [ADR](adr/README.md) | 架构决策记录 |
| — | [调研笔记](research/README.md) | 对单个外部方案的详细调研 |

## 文档状态标记

每篇文档开头会标注状态：

- `Draft`：草稿，内容可能大幅变动
- `Review`：内容基本稳定，等待评审
- `Stable`：已定稿，修改需走 ADR
