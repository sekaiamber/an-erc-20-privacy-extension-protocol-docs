# 09 开发指南

状态：`Review`

## 环境要求

- Git
- Node.js 22 或更高版本（合约仓库使用 Hardhat 3，要求 Node.js ≥ 22）
- npm（随 Node.js 安装）

## 获取代码

```bash
git clone --recurse-submodules https://github.com/sekaiamber/an-erc-20-privacy-extension-protocol-docs.git
cd an-erc-20-privacy-extension-protocol-docs
```

已 clone 但没有拉取 submodule 时：

```bash
git submodule update --init --recursive
```

## Submodule 工作流

`contracts/` 是独立仓库，主仓库只记录它的某个 commit。日常流程：

```bash
# 1. 进入子仓库修改并提交
cd contracts
git checkout main
# ... 修改 ...
git add -A && git commit -m "feat: ..."
git push origin main

# 2. 回到主仓库，更新 submodule 指针
cd ..
git add contracts
git commit -m "chore: bump contracts submodule"
git push
```

拉取他人的更新：

```bash
git pull
git submodule update --init --recursive
```

注意：在子仓库中提交后，如果忘记回到主仓库提交指针，其他人拉取主仓库时看到的仍是旧版本。

## 合约开发

合约仓库使用 Hardhat 3 + TypeScript + ethers v6，详见 `contracts/README.md`。常用命令：

```bash
cd contracts
npm install                 # 安装依赖
npx hardhat compile         # 编译
npx hardhat test            # 运行全部测试（Solidity + mocha）
npx hardhat test solidity   # 只运行 Solidity 测试
npx hardhat test mocha      # 只运行 TypeScript 测试
npx hardhat ignition deploy ignition/modules/TestToken.ts   # 部署到本地模拟链
```

## 验证前端（dapp）

`dapp/` 使用 pnpm（Node.js ≥ 24）。

```bash
cd dapp
cp .env.example .env      # BSC testnet 参数与 sqlite 路径
pnpm install              # postinstall 会执行 prisma generate
pnpm db:migrate           # 首次或 schema 变更后
pnpm dev                  # http://localhost:3000
```

约定见 `dapp/AGENTS.md`：全局状态在 `stores/`，组件内部状态在组件同级 `*.store.ts`；服务端数据走 react-query；链配置只从 `lib/wagmi.ts` 读取。

## 文档编写

- 文档使用 Markdown，中文撰写，技术术语保留英文。
- 新增文档在 `docs/README.md` 索引中登记。
- 重要决策使用 ADR，模板见 `docs/adr/README.md`。
- 外部资料统一登记到 `docs/references.md`。
