[English](02-deployments.md) | 中文

# B.1 部署记录

## BSC testnet（chain id 97）— 0.1.0（当前）

部署日期：2026-09-27　deployment id：`b1-v0_1_0-bsc-testnet`　`pep()` = `B:1:0.1.0`　合约源码 contracts `56ab57d`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20B1`**（Closed / CLS） | [`0x3170a659498a4ee88f1Ea59C3eA769f76Ff83855`](https://testnet.bscscan.com/address/0x3170a659498a4ee88f1Ea59C3eA769f76Ff83855) |
| **`PEPWrapper`**（家族工具，每链一份） | [`0xF76615A85583896bDF945B97d6dEf9C73819cC25`](https://testnet.bscscan.com/address/0xF76615A85583896bDF945B97d6dEf9C73819cC25) |
| `WrappedERC20` wCLS（首次 wrap 时由 wrapper 创建） | [`0x465B2900D86A7c9edBe9Db51A93cf0C72C817bE3`](https://testnet.bscscan.com/address/0x465B2900D86A7c9edBe9Db51A93cf0C72C817bE3) |
| 验证器 / 窗口表 | 按地址复用 A.1 0.3.1 的（`a1-v0_3_1-bsc-testnet`） |

Admin / MINTER / REGULATOR_ADMIN：部署钱包。监管密钥：与 A.1 部署相同的 id 0。无初始铸造：发行由 MINTER 调用 `mint(id, amount)`。

### 链上实测（contracts `scripts/track-b/variant-1/e2e-bsc.ts`，2026-09-27）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `mint` 1000 CLS 到新 id | 176,890 | [0x90ed…7415](https://testnet.bscscan.com/tx/0x90ed4eeb097ed63693521400f441fd2da18f62334212c2d2e816519d18147415) |
| `0x01` 250 CLS（双方首次） | 715,473 | [0xee03…4c28](https://testnet.bscscan.com/tx/0xee03ac7f2916c1808ee30f57027c1ed938f55c949f09e9d717ce4780f3d44c28) |
| `0x80` 折叠（收款方首次操作） | 463,813 | [0x7a5b…00b2](https://testnet.bscscan.com/tx/0x7a5b8e9de1a02897efb46301d2dad48b0f353c0458615ba5b675d8b379cf00b2) |
| `0x81` 直接销毁 50 CLS | 362,423 | [0xd737…7123](https://testnet.bscscan.com/tx/0xd737d04f10b26c71d510c4cb7fce360e40e800b777cea17d9510471d4bb7f123) |
| `wrap` 300 CLS → wCLS（**首次 wrap，含创建 wCLS 合约**） | 967,012 | [0x536f…9e64](https://testnet.bscscan.com/tx/0x536f1fa2aa8dd861aa45c98eef20a95c15411d73e06cdecaaf19694cdf3f9e64) |
| wCLS `transfer`（普通 ERC-20） | 26,570 | — |
| `unwrap` 100 wCLS → 机密 id | 124,655 | [0x9f27…5b2c](https://testnet.bscscan.com/tx/0x9f2751096d8f68fbe4a903ff4bd8556b42ad03a6d98e6d55050c97cf0fcf5b2c) |

证明生成（Node）：transfer 2.05 s，fold 0.28 s，burn / wrap 0.9–1.0 s（A.1 电路，未改）。所有解密余额与预期明文一致；运行结束时 `B1.totalSupply() + wCLS.totalSupply()` 等于已发行 − 已销毁（2,000 − 50：此前一次运行已向另一个 id 铸造过 1,000）。

稳态预期：同一代币第二次 `wrap` 不再创建 wCLS（约少 560k，即销毁成本 + 一次 ERC-20 铸造 ≈ 410k）；向槽已非零的 id `mint` ≈ 155k。

## 说明

- `balanceOf` 对任何地址返回 0；区块浏览器会看到有供应量但没有持有人。这就是 Track B 的契约。
- A.1 的安全自审覆盖 B.1 复用的一切（电路、账本逻辑、F1–F14）。B.1 特有部分（wrapper 门禁、销毁路径）的自审待做。
