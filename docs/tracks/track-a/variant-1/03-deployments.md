# A.1 部署记录

## BSC testnet（chain id 97）— 0.2.4（当前）

部署日期：2026-09-25　deployment id：`a1-v0_2_4-bsc-testnet`　带 `pep()` 描述符 `A:1:0.2.4`　合约源码 contracts `41b9df8`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0xEb12e2963A983A1A9E98c0eCf89f1D704F19BB7b`](https://testnet.bscscan.com/address/0xEb12e2963A983A1A9E98c0eCf89f1D704F19BB7b) |
| `TransferVerifier` | `0x491cE73B121215F5764E527FDA006a3F488b5096` |
| `UnshieldVerifier` | `0x9Be4b1dB9C5B1bCF490f61e32e29f621426b5C47` |
| `G8Table` | `0xE962438d2CcC4010F3Fcfa56C1Fd62F018C0bcf8` |

参数与 0.2.3 相同（Test / TEST，1,000,000 初始铸造给部署账户，监管公钥 id 0 同一把）。地址同时导出在 `contracts/exports/deployments.json`。

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

dapp 的 `NEXT_PUBLIC_TOKEN_ADDRESS` 指向 0.2.4 地址。
