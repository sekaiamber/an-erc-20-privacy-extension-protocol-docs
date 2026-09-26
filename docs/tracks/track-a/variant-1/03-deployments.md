# A.1 部署记录

## BSC testnet（chain id 97）— 0.3.0（当前）

部署日期：2026-09-26　deployment id：`a1-v0_3_0-bsc-testnet`　`pep()` = `A:1:0.3.0`　合约源码 contracts `fb3505f`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x7748d19a13B8C0b49a6815D5c8B43Aa9cA473eAa`](https://testnet.bscscan.com/address/0x7748d19a13B8C0b49a6815D5c8B43Aa9cA473eAa) |
| `TransferVerifier` | `0xe08B4669B544c2101BC2C97bb01D5Fa352EEeA07` |
| `UnshieldVerifier` | `0x2e621C4177075623A15Bfa4078416DA4366b6AAA` |
| `FoldVerifier` | `0x88e065fFa3f570bA36ff437853028236E15AC3a9` |
| `G8Table` | `0x5f4eEb3B3288012287555962C27178eA6Ce7568f` |

相对 0.2.5：新增 `0x80` 纯折叠（FoldVerifier）与 `lastReceivedAtBlock`，`confidentialAccountOf` 返回 6 个值，构造函数多一个验证器地址。参数不变。

### 链上实测（dapp 客户端库，2026-09-26）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100 TEST（收款方首次） | 214,534 | [0x2edc…0ed0](https://testnet.bscscan.com/tx/0x2edc639da406a5847ee1302451d6e9532a469d3ac4ad59d3594ee20844ab0ed0) |
| `0x01` 机密转账 12.5 TEST（付款方首次花费，`includePending`；收款方首次） | 715,531 | [0xa708…e261](https://testnet.bscscan.com/tx/0xa7089714eb525f0e6ad215dc184547aeefaf2943ca738b139f310d860f9de261) |
| `0x80` 纯折叠（收款方首次操作，中继提交，无 decryptable） | 463,906 | [0xf1e9…eb35](https://testnet.bscscan.com/tx/0xf1e96810789abde251d0b44fa6364b2dfae3986d191b986c3cdd0423fbeb5d35) |
| `0x04` unshield 5 TEST（折叠后默认模式，中继提交） | 373,539 | [0x2ad2…2aab](https://testnet.bscscan.com/tx/0x2ad20640838a1b3040fc6b74794aefbb1ab3acd7e7ca3d78d85c5fdcbf532aab) |

证明生成（Node）：transfer 2.08 s，fold 0.26 s，unshield 0.98 s。

读数说明：
- 首次 shield 比 0.2.5 多约 22k：`lastReceivedAtBlock` 与 `nonce` / `foldedAtBlock` 同槽，收款方首次收款把这个槽从零写起（22.1k）；之后每次收款只是热写 2.9k。而该账户首次花费 / 折叠因此少付一次冷写，`0x01` 总体只多 5k。
- 首次折叠 464k 的大头是 `available`（4 槽）与 `folded`（4 槽）的冷写约 177k，Groth16 验证约 200k；稳态折叠约 250k。
- 折叠之后的 unshield 走默认模式（只绑定 `available`），比 0.2.5 的 566k 少 192k。
- 链上 `foldedAtBlock` 与 `lastReceivedAtBlock` 均等于对应交易的区块号，pending 归零、available 解密等于 memo 金额。

## BSC testnet（chain id 97）— 0.2.5（已废弃）

部署日期：2026-09-26　deployment id：`a1-v0_2_5-bsc-testnet`　`pep()` = `A:1:0.2.5`　合约源码 contracts `f70c32b`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x0d2c14251BB166fB1C53805731834F63249CaC5f`](https://testnet.bscscan.com/address/0x0d2c14251BB166fB1C53805731834F63249CaC5f) |
| `TransferVerifier` | `0x0B637450B0b26B5E416908593b1b2666081430Dd` |
| `UnshieldVerifier` | `0x900e162f977296990798667C4C8BE42F63Bc3B0b` |
| `G8Table` | `0xF440fEd8857ff9b4e95d8b7e484FE11A4A1613d1` |

相对 0.2.4 的唯一合约改动：账户增加 `foldedAtBlock`（01-design §4.3），`confidentialAccountOf` 多返回一个值。参数不变（Test / TEST，1,000,000 初始铸造给部署账户，监管公钥 id 0 同一把）。验证器与窗口表字节码未变，但在新 deployment id 下重新部署了一份。

### 链上实测（dapp 客户端库，2026-09-26）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100 TEST（收款方非首次） | 103,795 | [0x6598…4ef4f](https://testnet.bscscan.com/tx/0x659835333d929bd3a9f11d41208df50c13a225af0989d1e4623b74f27bb4ef4f) |
| `0x01` 机密转账 12.5 TEST（付款方首次花费，`includePending`） | 710,511 | [0x4891…d92](https://testnet.bscscan.com/tx/0x48910a2bcb199ba01662e8e661194ba1df7c459c1efaaa4f2466696ab77b3d92) |
| `0x04` unshield 5 TEST（中继提交） | 565,982 | [0x7468…2ec](https://testnet.bscscan.com/tx/0x74687f42758d49a45b94cf2f44b7f969ccb704a83259a9f1868dd016368162ec) |

与 0.2.4 持平（`foldedAtBlock` 与 `nonce` 同槽，无额外写）。花费后链上 `foldedAtBlock` 等于该交易所在区块（133237427），nonce 1。首次 shield 到已存在账户为 103,795（0.2.4 记录的 192,378 是收款方首次、冷写）。

另外观察到：`bsc-testnet-rpc.publicnode.com` 是负载均衡的，交易回执返回后立刻 `eth_getLogs` 可能落到尚未索引该块的节点、返回空；隔几秒重试即有。dapp 每 15 s 轮询，自然覆盖；e2e 脚本加了重试。

## BSC testnet — 0.2.4（已废弃）

部署日期：2026-09-25　deployment id：`a1-v0_2_4-bsc-testnet`　带 `pep()` 描述符 `A:1:0.2.4`　合约源码 contracts `41b9df8`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0xEb12e2963A983A1A9E98c0eCf89f1D704F19BB7b`](https://testnet.bscscan.com/address/0xEb12e2963A983A1A9E98c0eCf89f1D704F19BB7b) |
| `TransferVerifier` | `0x491cE73B121215F5764E527FDA006a3F488b5096` |
| `UnshieldVerifier` | `0x9Be4b1dB9C5B1bCF490f61e32e29f621426b5C47` |
| `G8Table` | `0xE962438d2CcC4010F3Fcfa56C1Fd62F018C0bcf8` |

参数与 0.2.3 相同（Test / TEST，1,000,000 初始铸造给部署账户，监管公钥 id 0 同一把）。地址同时导出在 `contracts/exports/deployments.json`。

### 链上实测（dapp 客户端库，2026-09-25）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100 TEST（收款方首次） | 192,378 | [0x96a5…a0fe](https://testnet.bscscan.com/tx/0x96a560e54288fe0884cab0ff8798e93bcc70073e2136a0257054af572abca0fe) |
| `0x01` 机密转账 12.5 TEST（付款方首次花费，`includePending`） | 710,479 | [0x9e91…12c38](https://testnet.bscscan.com/tx/0x9e91ce6a1651f4f630ff9e6c041a089f4acfb8699ec0d196b34487078e412c38) |
| `0x04` unshield 5 TEST（收款方由部署钱包代为提交，本人无以太坊账户） | 565,986 | [0xb4e9…ca08](https://testnet.bscscan.com/tx/0xb4e9be1dee8d847d0a6291a80f6b9d639bfb4624628d98383a5673824939ca08) |

证明生成（Node，M 系列）：transfer 2.27 s，unshield 1.17 s。收款方从事件 memo 解出 12.5 并与密文对账一致；钱包公开余额变化 −95，`shieldedSupply` 95。与本地估算一致。

### 公共 RPC 的日志历史限制（2026-09-26 实测）

收款方重建 pending 余额依赖 `eth_getLogs` 读取自己名下的 `ConfidentialTransfer` / `LedgerCrossing` 事件。公共 RPC 对此有硬限制：

| RPC | `eth_getLogs` 表现 |
| --- | --- |
| `bsc-testnet-rpc.publicnode.com`（dapp 默认） | 只保留最近约 90,000 个区块的日志，更早返回 `-32701 History has been pruned` |
| `bsc-testnet-dataseed.bnbchain.org` / `data-seed-prebsc-1-s1.bnbchain.org` | 即使 1,000 区块的范围也返回 `-32005 limit exceeded` |

dapp 的对策（0.3.0 dapp）：窗口为 `[foldedAtBlock, lastReceivedAtBlock]`，页面内存里保存一个扫描游标——每次刷新只向前扫新收款，只有 pending 尚未对齐时才从新到旧向后扩展，每轮最多 `NEXT_PUBLIC_LOG_MAX_CHUNKS` 次请求；已知跨度超过一轮预算时不自动扫，由用户点「继续扫描一轮」逐轮推进或改用本地解密；RPC 拒绝即截断并标注；available 不受影响（来自链上 `decryptable` 副本），只有窗口外的 pending 收款无法对账。要看更早的收款需换保留完整历史的节点。

0.2.5 起窗口精确为 `[foldedAtBlock, latest]`，dapp 增加边界：窗口跨度超过 `NEXT_PUBLIC_LOG_CHUNK_BLOCKS × NEXT_PUBLIC_LOG_MAX_CHUNKS`（默认 5,000 × 10）时不扫描，改为提示本人**本地解密 pending 总额**（先用自己的密钥解出 `pending·G`，再用并行 kangaroo 在 `[0, 2^bits)` 内求离散对数；纯 BigInt JS 约 5 µs/步，2^40 区间约 20–30 s，只得总数无逐笔明细）或强制扫描。这一步只有持账户私钥的人能做，不构成攻击面（安全边界仍是 251 位的 `r`）。这也是 A.1「收款方靠事件 memo 而非链上状态得知 pending 明细」这一设计的固有代价，见 01-design §4.3。

## BSC testnet — 0.2.3（已废弃，无 `pep()`）

部署日期：2026-09-25　Ignition deployment id：`a1-bsc-testnet`　记录：`contracts/ignition/deployments/a1-bsc-testnet/`

| 合约 | 地址 |
| --- | --- |
| `ConfidentialERC20A1`（Test / TEST，6 位小数） | [`0x2D9a837496f39a2725c6dA01C2DAaEBa74498D07`](https://testnet.bscscan.com/address/0x2D9a837496f39a2725c6dA01C2DAaEBa74498D07) |
| `TransferVerifier`（15 公开输入） | [`0x012aF1857622Ef9830F0cB7542bDe9DB9b8e234E`](https://testnet.bscscan.com/address/0x012aF1857622Ef9830F0cB7542bDe9DB9b8e234E) |
| `UnshieldVerifier`（7 公开输入） | [`0x816d01AaBa30d910960D9fe1CA2F6bF2EEF153a2`](https://testnet.bscscan.com/address/0x816d01AaBa30d910960D9fe1CA2F6bF2EEF153a2) |
| `G8Table`（12,288 字节窗口表） | [`0xe3Eb1f1D0E9e06529e6DeC0859c0c479c978511E`](https://testnet.bscscan.com/address/0xe3Eb1f1D0E9e06529e6DeC0859c0c479c978511E) |

| 项 | 值 |
| --- | --- |
| 部署账户 / admin（MINTER、REGULATOR_ADMIN） | `0xF3c7a7f35f69638e209814b469ad3722Ab60aAb1` |
| 初始铸造 | 1,000,000 TEST 给部署账户 |
| 监管公钥 id | 0（公钥见 `contracts/ignition/params/a1.json`，私钥离线） |
| 电路 / 可信设置 | `transfer.circom` 35,137 约束、`unshield.circom` 16,622 约束；**本地开发用 ptau，非真实仪式，仅供测试** |
| 合约源码 | contracts `8f3498a` |
| BscScan 验证 | 未做（未配置 API key） |

dapp 的 `NEXT_PUBLIC_TOKEN_ADDRESS` 指向 0.3.0 地址。0.2.4 实例仍在链上，但 dapp 读取其账户会因 ABI 不同（`confidentialAccountOf` 返回值数量）失败。
