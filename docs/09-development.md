English | [中文](09-development.zh-cn.md)

# 09 Development guide

Status: `Review`

## Requirements

- Git
- Node.js 22 or later (the contract repository uses Hardhat 3, which requires Node.js ≥ 22)
- npm (installed with Node.js)

## Getting the code

```bash
git clone --recurse-submodules https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-docs.git
cd an-erc-20-privacy-extension-protocol-docs
```

If you already cloned without fetching the submodules:

```bash
git submodule update --init --recursive
```

## Submodule workflow

`contracts/` is an independent repository; the main repository only records one of its commits. Day-to-day flow:

```bash
# 1. Enter the submodule, make changes and commit
cd contracts
git checkout main
# ... changes ...
git add -A && git commit -m "feat: ..."
git push origin main

# 2. Return to the main repository and update the submodule pointer
cd ..
git add contracts
git commit -m "chore: bump contracts submodule"
git push
```

Pulling others' updates:

```bash
git pull
git submodule update --init --recursive
```

Note: after committing in the submodule, if you forget to go back to the main repository and commit the pointer, others pulling the main repository will still see the old version.

## Contract development

The contract repository uses Hardhat 3 + TypeScript + ethers v6; see `contracts/README.md` for details. Common commands:

```bash
cd contracts
npm install                 # install dependencies
npx hardhat compile         # compile
npx hardhat test            # run all tests (Solidity + mocha)
npx hardhat test solidity   # run only the Solidity tests
npx hardhat test mocha      # run only the TypeScript tests
npx hardhat ignition deploy ignition/modules/TestToken.ts   # deploy to the local simulated chain
```

## Verification frontend (dapp)

`dapp/` uses pnpm (Node.js ≥ 24).

```bash
cd dapp
cp .env.example .env      # BSC testnet parameters and sqlite path
pnpm install              # postinstall runs prisma generate
pnpm db:migrate           # first time, or after a schema change
pnpm dev                  # http://localhost:3000
```

Conventions are in `dapp/AGENTS.md`: global state lives in `stores/`, component-internal state in a sibling `*.store.ts` next to the component; server-side data goes through react-query; chain configuration is read only from `lib/wagmi.ts`.

## Writing documentation

- Documents are Markdown. **English is the default** (`xxx.md`); the Chinese version is `xxx.zh-cn.md` in the same directory and must stay in sync. The first line of every document is a language-switch link. The Chinese versions keep technical terms in English.
- Register new documents in the `docs/README.md` index.
- Use ADRs for important decisions; the template is in `docs/adr/README.md`.
- Register external references in `docs/references.md`.
