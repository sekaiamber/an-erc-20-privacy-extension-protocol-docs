[English](08-roadmap.md) | 中文

# 08 路线图

状态：`Draft`

## 阶段 0：仓库初始化（已完成，2026-09）

- [x] 主仓库与文档骨架
- [x] 合约仓库（submodule）与 Hardhat 3 开发环境
- [x] 标准 ERC-20 代币 `Test` 作为后续实验的基础

## 阶段 1：调研

- [ ] 完成 [03 方案全景](03-landscape.zh-cn.md) 中列出的调研待办
- [ ] 每个方案形成一份 `research/` 笔记
- [ ] 测量主流方案的主网 Gas 成本
- [ ] 输出对比表，更新方案全景

## 阶段 2：设计（进行中，2026-09）

- [x] 协议家族按 Track / Variant 组织 → ADR-0002
- [x] 主线 A.1 细节设计 → `tracks/track-a/variant-1/01-design.md`
- [x] A.1 核心决策 → ADR A1-0001 ~ A1-0005
- [x] 01–05 改写为家族口径；06 / 07 改为 [家族架构](06-family-architecture.zh-cn.md) 与 [家族级约定](07-family-conventions.zh-cn.md)
- [x] A.1 第一轮安全自审 → `tracks/track-a/variant-1/02-security-review.md`
- [x] A.1 0.3.0：`0x80` 纯折叠 + `lastReceivedAtBlock` → ADR A1-0006
- [x] A.1 的纯隐私组合（当初以「Track B / B.1」开设）：设计与原型（2026-09-27，0.1.0，BSC testnet）→ `tracks/track-a/variant-1-privacy-only/`
- [x] 家族级 Wrapper 设计与原型（2026-09-27）→ `10-wrapper.md`、ADR-0005、`contracts/family/`
- [ ] 监管委员会设计（2026-09-27，草案）→ `11-regulatory-committee.md`、ADR-0006；需要 A.1 v0.4 / B.1 v0.2 的 memo 修订
- [x] 家族改为 Track / Variant / 模块三层；公开账本是模块，原 Track B 是 A.1 的一种组合（2026-10-12）→ ADR-0007、ADR-0008、`07-family-conventions.md` §13
- [x] Track A 文档按 Track / Variant / 模块重排：A.1 0.5.0-draft，内核在 `01-design.md`，模块与组合在 `04-modules.md`（2026-10-13）
- [x] 合约已按 A.1 0.5.0 重构（2026-10-13）：`A1Core` 加公开账本、角色铸造、Wrapper 端口三个模块，`IPEPModules` 探针，统一版本号；测试通过，gas 不变
- [x] dApp 跟进 A.1 0.5.0（按 `pep()` 选页面、按模块开关功能），并重新部署两个测试网代币（2026-10-13）→ `tracks/track-a/variant-1/03-deployments.md`
- [x] A.1 0.5.0：两个代币都已在链上完整跑通（2026-10-13）→ `tracks/track-a/variant-1/03-deployments.md`
- [ ] A.1 0.5.0：在浏览器里实际点一遍 dApp 页面；给带公开账本的代币页面加上 `mintConfidential` 和 `0x81` 销毁
- [x] 为 note 模型开设 Track B；B.1 设计 0.1.0-draft（2026-10-13）→ ADR-0009、`tracks/track-b/`
- [x] B.1：链上 Poseidon 树已在本地实测（2026-10-13）：深度 24 时每笔交易 696k 到 943k gas → `tracks/track-b/variant-1/01-design.md` §12
- [x] B.1：树深 24，在链上、交易内更新（D1、D7；2026-10-13）
- [x] B.1：join-split 电路（2026-10-13）：55,343 个约束，在 Node 里证明约 2.9 秒；链上的 Poseidon 由 Variant 固定（D8）
- [x] B.1：代币合约 `B1NoteToken`，带角色铸造和 Wrapper 端口（2026-10-13）：本地实测每次操作约 137 万 gas
- [x] B.1：dApp 页面 `/tracks/b/1`（2026-10-13）：密钥、历史回溯、note、浏览器内证明；客户端库已离线对照电路校验
- [x] B.1 已部署到 BSC testnet（2026-10-13）；五种操作都在链上跑过 → `tracks/track-b/variant-1/02-deployments.md`
- [x] ADR-0010（2026-10-13 接受，同日完成）：改写 07 §1、§5、§6、§7、§13.1；A.1 和 B.1 各出新版本（`mint` 按转账规则、折叠为独立函数、没有公开账本时 `approve` 回退、去掉 `prepare` / `cancel`）；dApp；重新部署
- [ ] ADR-0011（2026-10-13 接受）：项目定名 Casata（全称 Casata Segreta），向导定名 Cicerone；`pep()` / `IPEP*` / `PEPWrapper` 和 EIP-712 域名在 ADR-0010 的同一批 Variant 版本里改名。除仓库改名（由 owner 在 GitHub 上操作）外都已完成
- [x] ADR-0010 和 ADR-0011 落到文档（2026-10-13）：07、A.1 0.6.0（01-design、04-modules）、B.1 0.2.0、06、10、11、各索引和 README
- [ ] ADR-0012（2026-10-14 接受）：视觉形象。以秘密账簿为风格，以带纹章的火漆印为标志 → `12-visual-style.md`、`brand/seal/`。dApp 里已有、还没有用钱包试过的：品牌和字体；代币页的账簿行、封存记号和页边批注；日间 / 夜间开关；带公开账本的 A.1 代币页上的铸给机密 id 和 `0x81` 销毁；B.1 部署表单；入口页的 Cicerone。首页是独立的应用，尚未开始
- [x] A.1 0.6.0 和 B.1 0.2.0 落到合约和 dApp（2026-10-13）：Casata 的名字、`fold(id, payload)`、按 payload 规则的 `mint`、去掉 `prepare` / `cancel`、没有公开账本时 `approve` 回退、签名前的句柄提示；合约 70 个测试通过
- [x] 测试网上的三个代币已按 A.1 0.6.0 和 B.1 0.2.0 重新部署，并在链上完整跑过一遍（2026-10-13）→ `tracks/track-a/variant-1/03-deployments.md`、`tracks/track-b/variant-1/02-deployments.md`
- [ ] B.1：在浏览器里把 dApp 页面点一遍；监管视图的 B.1 解码器；dApp 里的部署表单
- [ ] ADR-0013 与 A1-0007（2026-10-15 接受）：角色铸造改名为可增发；初始发行和持有人的销毁移进核心；unshield 证明绑定出口类型；面向已有 ERC-20 的家族网关。文档（07、A.1 0.7.0、B.1 0.3.0、`14-gateway.zh-cn.md`）、合约（A.1 八个、B.1 四个生成组合，`CasataGateway`；91 项测试）和 dApp 已完成；参考代币已于 2026-10-15 部署到 BSC testnet。并在链上完整跑过一遍。尚未：链上的网关、网关页面、Cicerone 的发行问题
- [ ] ADR-0014（2026-10-15 接受）：小数位在部署时选（默认 18），所有金额 `< 2¹²⁸`，从 A.1 0.8.0 和 B.1 0.4.0 起。128 位电路已实测：约束 +8.0%（A.1 转账）、+12.5%（unshield）、+0.7%（B.1）。文档已完成（07 §11、A.1 01-design 和 04-modules §9.3、B.1 01-design、14 §3）。电路和合约已完成（94 项测试）；dApp 已跟进，只支持 0.8.0 / 0.4.0（owner：发布前不做兼容）。尚未：部署与链上 gas
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
- [x] 测试网部署：BSC testnet，2026-09-25 → `tracks/track-a/variant-1/03-deployments.md`
