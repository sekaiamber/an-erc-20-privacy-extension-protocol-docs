# ERC-20 Privacy Extension Protocol

研究以太坊及 EVM 兼容链上 **ERC-20 标准代币的隐私扩展协议**：在不破坏 ERC-20 兼容性的前提下，为代币的持有与转账提供可选的隐私保护（隐藏金额、隐藏收付双方、或二者兼有），并探讨其与合规、可组合性、Gas 成本之间的权衡。

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
└── contracts/           合约仓库（git submodule）
                         https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-contracts
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
```

更多内容见 [`docs/README.md`](docs/README.md) 与 [`docs/09-development.md`](docs/09-development.md)。

## 当前状态

项目处于 **研究与原型阶段**。目前完成：

- [x] 主仓库与合约仓库骨架
- [x] 基础研究文档框架
- [x] Hardhat 3 合约开发环境与一个标准 ERC-20 代币（`Test`）
- [ ] 现有隐私方案深入调研
- [ ] 协议设计与规范
- [ ] 隐私扩展合约原型

详见 [`docs/08-roadmap.md`](docs/08-roadmap.md)。
