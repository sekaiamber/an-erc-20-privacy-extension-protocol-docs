# CLAUDE.md

本仓库是「ERC-20 隐私扩展协议」研究项目的主仓库。

## 结构

- `docs/`：研究文档、设计规范、ADR。文档以中文撰写，技术术语保留英文原文。
- `contracts/`：git submodule，指向独立的合约仓库（Hardhat 3 + TypeScript + Solidity）。
  - 修改合约需要进入 `contracts/` 目录，在该子仓库中提交并推送，然后回到主仓库更新 submodule 指针。
  - 合约仓库自带 `CLAUDE.md`，进入后请先阅读。

## 约定

- 文档编号前缀（`01-`、`02-`…）表示推荐阅读顺序，新增文档沿用该规则。
- 重要设计决策写入 `docs/adr/`，文件名 `NNNN-短标题.md`，模板见 `docs/adr/README.md`。
- 调研某个外部方案时，在 `docs/research/` 下新建单独文件，并在 `docs/03-landscape.md` 中加入索引。
- 引用外部资料（EIP、论文、代码库）统一登记到 `docs/references.md`。
- 不要在主仓库根目录放置合约代码；所有 Solidity 代码都在 `contracts/` 子仓库。
