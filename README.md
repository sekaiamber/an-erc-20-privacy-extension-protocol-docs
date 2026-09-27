English | [中文](README.zh-cn.md)

# ERC-20 Privacy Extension Protocol

Research on a **privacy extension protocol for ERC-20 standard tokens** on Ethereum and EVM-compatible chains: providing optional privacy protection for token holdings and transfers (hiding amounts, hiding payer and payee, or both) without breaking ERC-20 compatibility, and exploring the trade-offs against compliance, composability, and gas cost.

This repository is the **main repository (monorepo entry point)** of the whole project, containing the research documents and design specifications; the contract code lives in a separate repository mounted as a git submodule under the `contracts/` directory.

## Repository structure

```
.
├── README.md            This file
├── CLAUDE.md            Project notes for AI coding assistants
├── docs/                Research documents, design specifications, decision records
│   ├── README.md        Documentation index (start reading here)
│   ├── adr/             Architecture Decision Records (ADR)
│   └── research/        Research notes
├── contracts/           Contract repository (git submodule)
│                        https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-contracts
└── dapp/                Verification frontend (git submodule, Next.js + wagmi, BSC testnet)
                         https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-dapp
```

## Quick start

```bash
# Clone the main repository and fetch the submodules at the same time
git clone --recurse-submodules https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-docs.git
cd an-erc-20-privacy-extension-protocol-docs

# If already cloned but the submodules were not fetched
git submodule update --init --recursive

# Contract development environment (Hardhat 3)
cd contracts
npm install
npx hardhat test

# Verification frontend (Next.js, pnpm)
cd ../dapp
cp .env.example .env
pnpm install && pnpm db:migrate && pnpm dev
```

See [`docs/README.md`](docs/README.md) and [`docs/09-development.md`](docs/09-development.md) for more.

## Current status

The project is in the **research and prototype phase**. Completed so far:

- [x] Main repository and contract repository skeletons
- [x] Basic research document framework
- [x] Hardhat 3 contract development environment and a standard ERC-20 token (`Test`)
- [x] Protocol family structure (Track / Variant) and family-level conventions
- [x] Mainline A.1 design (0.2.3-draft), ADRs, first-round security self-review
- [x] A.1 prototype: circuits, contracts, client library, running end to end locally
- [x] Verification frontend skeleton (`dapp/`, BSC testnet)
- [ ] In-depth research of existing privacy solutions
- [ ] A.1 testnet deployment and frontend features

See [`docs/08-roadmap.md`](docs/08-roadmap.md) for details.
