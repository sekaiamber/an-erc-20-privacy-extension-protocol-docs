[English](README.md) | 中文

# Casata

*Casata Segreta：隐私代币合约世家。*

Casata 是一个研究项目，维护一族面向以太坊及 EVM 兼容链的隐私代币合约。家族里的代币为持有与转账提供可选的隐私保护（隐藏金额、隐藏收付双方、或二者兼有），保留 ERC-20 中对这类代币仍然为真的部分，并在设计上向监管方开放只读访问。这些合约公开发布，任何人都可以基于它们发行代币，或在其基础上自行定制。项目同时研究隐私与合规、可组合性、Gas 成本之间的权衡。它不是发币项目。

2026-10-13 之前，项目名为「ERC-20 Privacy Extension Protocol」（PEP），见 [ADR-0011](docs/adr/0011-project-name-casata.zh-cn.md)。各仓库目前仍带着旧名字。

本仓库是整个项目的**主仓库（monorepo 入口）**，包含研究文档与设计规范；合约代码位于独立仓库并以 git submodule 的方式挂载在 `contracts/` 目录。

## 仓库结构

```
.
├── README.md            本文件
├── CLAUDE.md            面向 AI 编码助手的项目说明
├── docs/                研究文档、设计规范、决策记录
│   ├── README.md        文档索引（从这里开始阅读）
│   ├── adr/             架构决策记录（ADR）
│   └── research/        调研笔记
├── contracts/           合约仓库（git submodule）
│                        https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-contracts
└── dapp/                验证前端（git submodule，Next.js + wagmi，BSC testnet）
                         https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-dapp
```

## 快速开始

```bash
# 克隆主仓库并同时拉取 submodule
git clone --recurse-submodules https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-docs.git
cd an-erc-20-privacy-extension-protocol-docs

# 如果已经 clone 过但没有拉取 submodule
git submodule update --init --recursive

# 合约开发环境（Hardhat 3）
cd contracts
npm install
npx hardhat test

# 验证前端（Next.js，pnpm）
cd ../dapp
cp .env.example .env
pnpm install && pnpm db:migrate && pnpm dev
```

更多内容见 [`docs/README.md`](docs/README.zh-cn.md) 与 [`docs/09-development.md`](docs/09-development.zh-cn.md)。

## 当前状态

项目处于 **研究与原型阶段**。目前完成：

- [x] 主仓库与合约仓库骨架
- [x] 基础研究文档框架
- [x] Hardhat 3 合约开发环境与一个标准 ERC-20 代币（`Test`）
- [x] 协议家族结构（Track / Variant）与家族级约定
- [x] 主线 A.1 设计（0.2.3-draft）、ADR、第一轮安全自审
- [x] A.1 原型：电路、合约、客户端库，本地端到端跑通
- [x] 验证前端骨架（`dapp/`，BSC testnet）
- [ ] 现有隐私方案深入调研
- [ ] A.1 测试网部署与前端功能

详见 [`docs/08-roadmap.md`](docs/08-roadmap.zh-cn.md)。
