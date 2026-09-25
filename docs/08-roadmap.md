# 08 路线图

状态：`Draft`

## 阶段 0：仓库初始化（已完成，2026-09）

- [x] 主仓库与文档骨架
- [x] 合约仓库（submodule）与 Hardhat 3 开发环境
- [x] 标准 ERC-20 代币 `Test` 作为后续实验的基础

## 阶段 1：调研

- [ ] 完成 [03 方案全景](03-landscape.md) 中列出的调研待办
- [ ] 每个方案形成一份 `research/` 笔记
- [ ] 测量主流方案的主网 Gas 成本
- [ ] 输出对比表，更新方案全景

## 阶段 2：设计（进行中，2026-09）

- [x] 协议家族按 Track / Variant 组织 → ADR-0002
- [x] 主线 A.1 细节设计 → `tracks/track-a/variant-1/01-design.md`
- [x] A.1 核心决策 → ADR A1-0001 ~ A1-0005
- [x] 01–05 改写为家族口径；06 / 07 改为 [家族架构](06-family-architecture.md) 与 [家族级约定](07-family-conventions.md)
- [x] A.1 第一轮安全自审 → `tracks/track-a/variant-1/02-security-review.md`
- [ ] A.1 `0x80 fold`（自审 F1）
- [ ] 威胁模型评审
- [ ] 家族级约定与 A.1 设计的 `Review` 版本

## 阶段 3：原型（进行中，2026-09）

- [x] A.1：BabyJubjub 库、`0x01` / `0x04` 电路、`ConfidentialERC20A1`、Groth16 验证合约
- [x] TS 客户端库（密钥、加密、memo、payload、证明输入）
- [x] Hardhat 端到端：shield → 机密转账（中继者提交）→ unshield，含监管解密与负例
- [x] Gas 实测与两轮优化（固定基窗口表、公开输入打包）→ 设计文档 §9
- [x] 稳态 Gas 优化：pending 不清零（`0x01` 稳态 467k）
- [ ] 点加投影坐标
- [ ] 浏览器内证明生成时间

## 阶段 4：评估与迭代

- [ ] 对照设计目标逐条评估达成情况
- [ ] 安全自审
- [ ] 测试网部署
