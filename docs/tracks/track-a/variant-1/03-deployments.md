# A.1 部署记录

## BSC testnet（chain id 97）— 0.2.5（当前）

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

dapp 的对策：默认窗口 80,000 区块，从新到旧分块扫描，遇到拒绝即截断并在页面标注「只扫到区块 N」；available 不受影响（来自链上 `decryptable` 副本），只有窗口外的 pending 收款无法对账。要看更早的收款需换保留完整历史的节点。这也是 A.1「收款方靠事件 memo 而非链上状态得知 pending 明细」这一设计的固有代价，见 01-design §4.3。

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

dapp 的 `NEXT_PUBLIC_TOKEN_ADDRESS` 指向 0.2.5 地址。0.2.4 实例仍在链上，但 dapp 读取其账户会因 ABI 不同（`confidentialAccountOf` 返回值数量）失败。
