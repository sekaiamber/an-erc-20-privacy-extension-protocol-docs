# CLAUDE.md

本仓库是「ERC-20 隐私扩展协议」研究项目的主仓库。

## 结构

- `docs/`：研究文档、设计规范、ADR。**对外文档默认英文**（`xxx.md`），中文版为同目录 `xxx.zh-cn.md`；改任一语言版本时必须同步另一份。首行为语言切换链接（英文：`English | [中文](xxx.zh-cn.md)`，中文：`[English](xxx.md) | 中文`）。CLAUDE.md / AGENTS.md 等内部说明不受此约束。
- `contracts/`：git submodule，指向独立的合约仓库（Hardhat 3 + TypeScript + Solidity）。
  - 修改合约需要进入 `contracts/` 目录，在该子仓库中提交并推送，然后回到主仓库更新 submodule 指针。
  - 合约仓库自带 `CLAUDE.md`，进入后请先阅读。
- `dapp/`：git submodule，验证前端（Next.js 16 + Tailwind v4 + shadcn + Zustand + react-query + wagmi + Prisma sqlite，pnpm）。目标链 BSC testnet。界面 i18n：默认英文，文案在 `dapp/i18n/<locale>/<namespace>.json`，组件通过 `useT()` 取文案，不得在组件里写死自然语言。工作流同 `contracts/`：在子仓库提交推送后回主仓库更新指针。仓库自带 `AGENTS.md`。

## 约定

- 文档编号前缀（`01-`、`02-`…）表示推荐阅读顺序，新增文档沿用该规则。新增文档必须同时提供英文与 `zh-cn` 两份。
- 文档内相对链接：英文版链向英文文件，中文版链向 `.zh-cn.md` 文件。
- 重要设计决策写入 `docs/adr/`，文件名 `NNNN-短标题.md`，模板见 `docs/adr/README.md`。
- 协议家族按 Track / Variant 组织，见 `docs/06-family-architecture.md`；各 Track / Variant 的文档在 `docs/tracks/`，Variant 之间自包含。家族级约定在 `docs/07-family-conventions.md`，Variant 文档不得与之冲突。
- 调研某个外部方案时，在 `docs/research/` 下新建单独文件，并在 `docs/03-landscape.md` 中加入索引。
- 引用外部资料（EIP、论文、代码库）统一登记到 `docs/references.md`。
- 不要在主仓库根目录放置合约代码；所有 Solidity 代码都在 `contracts/` 子仓库。
