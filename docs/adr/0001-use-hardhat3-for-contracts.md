# 0001 合约开发环境采用 Hardhat 3

- 状态：Accepted
- 日期：2026-09-22

## 背景

合约仓库需要一个通用、易上手的 EVM 开发环境，支持编译、测试、本地模拟链与部署。团队环境中已有 Node.js，尚未安装 Foundry。

## 决策

采用 **Hardhat 3** 官方 `mocha-ethers` 模板作为合约仓库的基础：

- TypeScript 集成测试（mocha + ethers v6 + chai）
- Foundry 兼容的 Solidity 单元测试（forge-std）
- Hardhat Ignition 做部署
- OpenZeppelin Contracts v5 作为基础库

## 备选方案

- **Foundry**：编译与测试速度更快，纯 Solidity 测试；但需要额外安装工具链，且后续客户端 / 证明生成脚本大概率使用 TypeScript，Hardhat 更便于统一。Hardhat 3 已支持 forge-std 风格的 Solidity 测试，两者的差距缩小。
- **Hardhat 2**：生态成熟，但已进入维护期，新项目不再推荐。

## 后果

- 正面：一套仓库同时支持 Solidity 与 TypeScript 测试；部署与网络配置统一。
- 负面：Hardhat 3 相对较新，部分第三方插件可能尚未适配；ESM-only 对某些工具链有兼容要求。
- 若后续证明系统工具链强依赖 Foundry，可在子仓库中并行引入 Foundry，不与本决策冲突。
