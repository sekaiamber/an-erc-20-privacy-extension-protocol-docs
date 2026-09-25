# A.1 部署记录

## BSC testnet（chain id 97）

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

dapp 的 `NEXT_PUBLIC_TOKEN_ADDRESS` 已指向该地址（dapp `d125b1a`）。
