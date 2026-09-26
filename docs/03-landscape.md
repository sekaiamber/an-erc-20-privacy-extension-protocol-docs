# 03 方案全景

状态：`Draft`

本文对现有的 EVM 链上隐私方案做分类概览。对单个方案的详细调研请放入 `research/` 目录，并在本文对应位置加上链接。

> 注意：本文中对各方案的描述基于公开资料的初步理解，尚未逐一核对源码，标注为 `待核实` 的条目需要在深入调研后更新。

## 分类维度

| 维度 | 取值 |
| --- | --- |
| 隐私范围 | 金额 / 收付方身份 / 交易关联 |
| 状态模型 | 账户模型 / UTXO（note）模型 / 加密账户模型 |
| 核心技术 | 混币 / ZK 证明 / FHE / 隐匿地址 / TEE |
| 与 ERC-20 的关系 | 原生代币 / 包装（wrap）现有代币 / 扩展现有代币 |
| 信任假设 | 无信任 / 可信设置 / 中继者 / 阈值网络 / 硬件 |
| 合规能力 | 无 / 查看密钥 / 关联集合证明 / 白名单 |

## 方案分类

### A. 混币 / 屏蔽池（Shielded pool）

把代币存入池子获得一个承诺（note），之后凭零知识证明提取或在池内转账。

- **Tornado Cash**：固定面额、只支持存取，不支持池内转账。金额隐私依赖固定面额。
- **Railgun**：UTXO 模型的通用 ERC-20 屏蔽池，支持池内转账与调用外部合约（通过 relay adapt）。`待核实`
- **Privacy Pools**：在 Tornado 的基础上增加"关联集合证明"（association set），允许用户证明资金来源不属于某个黑名单集合，兼顾合规。`待核实`
- **Zcash / Sapling 电路**：非 EVM，但其 note 承诺 + nullifier 模型是上述方案的共同祖先。

特点：隐私强，但资产必须"进入池子"，处于池内的代币不再是标准 ERC-20，可组合性受限。

### B. 隐匿地址（Stealth address）

发送方为接收方一次性派生一个新地址，只有接收方能用私钥发现并花费。

- **ERC-5564**：以太坊隐匿地址标准接口。
- **ERC-6538**：隐匿元地址（stealth meta-address）注册表。
- **Umbra**：早期的隐匿地址实现。

特点：只隐藏接收方身份，不隐藏金额；与 ERC-20 完全兼容，几乎不需要改动代币合约；但接收方后续花费时的 Gas 来源会造成关联泄露。

### C. 加密账户模型（Confidential token）

余额以密文形式存储在账户模型中，转账时对密文做运算。

- **Zama fhEVM / Confidential ERC-20**：基于全同态加密，余额与金额为 FHE 密文，由阈值网络解密。`待核实`
- **ERC-7984（Confidential Fungible Token）**：机密同质化代币接口提案。`待核实`
- **Pedersen 承诺 + 范围证明（Bulletproofs 风格）**：类似 Monero RingCT 的思路在账户模型上的变体。

特点：保留账户模型，兼容性较好；金额隐私强，但收付方身份通常仍公开；FHE 方案有额外的信任假设（阈值解密网络）与较高的成本。

### D. 隐私 L2 / 隐私执行环境

- **Aztec**：带私有状态的 zk-rollup，私有函数在客户端执行并生成证明。
- **基于 TEE 的方案**：在可信硬件中执行合约，状态加密。

特点：隐私能力最完整，但代币需要跨链到该环境，脱离了原链的 ERC-20 生态。

### E. 其他相关提案

- **ERC-7503（Zero-Knowledge Wormholes）**：通过"证明某笔烧毁"来实现私密转移。`待核实`
- **ERC-4337 / Paymaster**：账户抽象与代付 Gas，可用来缓解 B 类方案中的 Gas 关联问题。
- **Semaphore**：匿名信号 / 群成员证明，可作为身份层组件。

## 与本项目的关系

本项目关心的是**"扩展现有 ERC-20"**这一列，并把上述路线映射到协议家族的 Track / Variant 上：

| 外部方案类别 | 对应家族位置 | 说明 |
| --- | --- | --- |
| C 类加密账户（Zether、Solana Confidential Transfer） | **Track A / A.1**（主线） | 账户模型 + 同态密文 + ZK；本项目在其上加了"账户 = 公钥、公钥不上链"和密码学强制的监管密文 |
| A 类 note 模型屏蔽池（Zcash Sapling、Railgun） | Track A / A.x 或 Track B / B.x | 收付方隐藏，作为备选 Variant |
| C 类 FHE（Zama、ERC-7984） | Track A / A.x 或 Track C | 无用户密钥但依赖阈值网络，仅调研 |
| B 类隐匿地址（ERC-5564） | A.1 的 `0x02` stealth 类型 | 账户已与地址解耦，只需付款方派生一次性公钥 |

选型理由见 ADR-0002、A1-0001、A1-0002。

## 专题：哪些系统没有 pending（2026-09-26）

A.1 的机密账户分 `available` / `pending` 两个密文（A1-0004）。这个结构不是本项目独有，而是三个前提叠加的必然结果：**账户模型** + **余额是同态密文** + **由用户出证明证明"余额够"**。证明与付款方当前密文和 nonce 绑定，若第三方（打款人）能改动这份密文，付款方在 mempool 里的交易就会作废，每个区块打 1 单位即可让其永远转不出去（Zether 论文所述 front-running 问题）。因此"只有本人能改的状态"（available）与"他人写入的状态"（pending）必须分开。

去掉任一前提，pending 就消失。已知的三条路线：

| 路线 | 去掉的前提 | 代表 | 为何不需要 pending | 代价 |
| --- | --- | --- | --- | --- |
| note / UTXO 模型 | 账户 | Zcash、Aztec、Railgun、Tornado | 没有余额密文；每笔收款是独立的 note，花费 = 销毁旧 note、生成新 note。他人生成的 note 不触碰已有 note，证明不会被作废 | 收款方需试解全链 note 才知道哪些属于自己（对历史的依赖比账户模型更重）；无单一余额，需管理 note 集合；找零需新 note |
| 合约在密文上自行判断 | 用户端证明 | Zama fhEVM / ERC-7984（FHE）、Inco、Fhenix；Oasis Sapphire、Secret Network SNIP-20（TEE） | `balance ≥ amount` 由合约在 FHE 密文上直接计算（不足则同态置零），或在 enclave 内明文计算。没有用户证明，就没有"证明绑定旧状态"的问题，收款直接进 available | 安全性不再是纯密码学：FHE 依赖门限解密网络（用户查看自己余额也需其重加密），TEE 依赖硬件；gas 与延迟高一到两个数量级；监管解密由网络授权而非独立密钥 |
| 证明针对历史状态 | （形式上保留三者） | Zether 论文讨论的变体 | 用户对某历史密文 `C_old` 证明 `b_old ≥ v`，合约把差额同态作用到当前密文。他人只能加钱，真实余额 ≥ `b_old`，不会透支 | 合约需验证 `C_old` 确为该账户的历史状态（历史承诺的 Merkle 根），并需 nonce 防同一 `C_old` 被本人重复用于两笔。nonce 只在本人花费时递增，`C_old` 于是只能是"本人上次花费后的状态"——合约必须存下它，这正是 available；其后的入账即 pending。只是换了名字 |

结论：在"账户 + 用户证明"模型下，合约必然要记住"本人最后一次知道的状态"，区别只在于叫 checkpoint / current 还是 available / pending。Zether 的 epoch、Solana Token-2022 Confidential Transfer 的 pending / available（需显式 `ApplyPendingBalance`）、A.1 的惰性折叠，是同一结构的三种展现。A.1 选择账户 + 证明，是为了 ERC-20 语义（一个地址一个余额、直接复用 `transfer`）与纯密码学安全，pending 是这一选择的代价，不是额外的复杂度。

与之相关的实际影响：available 明文可由链上 `decryptable` 副本直接读出，而 pending 明文只能从本人上次折叠之后的事件 memo 重建，因此长期只收不花的账户依赖 RPC 的日志保留深度（见 track-a/variant-1/03-deployments）。

## 调研待办

- [ ] Railgun：合约结构、note 格式、relay adapt 机制
- [ ] Privacy Pools：关联集合证明的电路与合约接口
- [ ] Zama Confidential ERC-20 与 ERC-7984：接口设计、解密流程、信任假设
- [ ] ERC-5564 / ERC-6538：与代币合约集成的最小改动
- [ ] Aztec：私有代币的 note 设计，作为对照
- [ ] Zether：epoch 机制与 front-running 处理的细节，与 A.1 惰性折叠逐项对比
- [ ] Solana Token-2022 Confidential Transfer：pending / available 与 `ApplyPendingBalance` 的接口与成本
- [ ] 各方案在主网上的实际 Gas 成本
