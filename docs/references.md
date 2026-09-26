# 参考资料

登记本项目引用的 EIP、论文、代码库与文章。新增条目请保持分类，并给出一句话说明。

## EIP / ERC

| 编号 | 标题 | 说明 |
| --- | --- | --- |
| [EIP-20](https://eips.ethereum.org/EIPS/eip-20) | Token Standard | ERC-20 代币标准 |
| [ERC-5564](https://eips.ethereum.org/EIPS/eip-5564) | Stealth Addresses | 隐匿地址标准 |
| [ERC-6538](https://eips.ethereum.org/EIPS/eip-6538) | Stealth Meta-Address Registry | 隐匿元地址注册表 |
| [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) | Account Abstraction Using Alt Mempool | 账户抽象 |
| [ERC-7503](https://eips.ethereum.org/EIPS/eip-7503) | Zero-Knowledge Wormholes | 基于证明烧毁的私密转移提案 |
| ERC-7984 | Confidential Fungible Token | 机密同质化代币接口提案（`待核实` 编号与状态） |

## 论文 / 文章

| 标题 | 说明 |
| --- | --- |
| Zcash Protocol Specification (Sapling) | note 承诺 + nullifier 模型的权威描述 |
| Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium (2023) | Privacy Pools 的理论基础 |
| Bulletproofs: Short Proofs for Confidential Transactions and More | 范围证明 |
| Zether: Towards Privacy in a Smart Contract World（Bünz, Agrawal, Zamani, Boneh, 2019） | 账户模型 + ElGamal 密文 + ZK 的机密转账；提出 front-running 问题与 epoch 解法，A.1 pending 设计的直接对照 |

## 项目 / 代码库

| 项目 | 说明 |
| --- | --- |
| Tornado Cash (classic) | 固定面额混币池 |
| Railgun | 通用 ERC-20 屏蔽池 |
| Privacy Pools (0xbow) | 带关联集合证明的隐私池 |
| Zama fhEVM | 基于 FHE 的机密合约执行环境 |
| Aztec | 隐私 zk-rollup |
| Solana Token-2022 Confidential Transfer | 账户模型机密转账扩展，pending / available 两桶 + `ApplyPendingBalance` |
| Secret Network SNIP-20 / Oasis Sapphire | TEE 内明文计算的机密代币，无 pending 的对照 |
| Umbra | 隐匿地址实现 |
| Semaphore | 匿名信号 / 群成员证明 |
| OpenZeppelin Contracts | 本项目合约使用的基础库 |

## 工具

| 工具 | 说明 |
| --- | --- |
| [Hardhat 3](https://hardhat.org/) | 合约开发环境 |
| [ethers v6](https://docs.ethers.org/v6/) | 客户端库 |
| [circom / snarkjs](https://docs.circom.io/) | ZK 电路开发（候选） |
| [Noir](https://noir-lang.org/) | ZK 电路开发（候选） |
