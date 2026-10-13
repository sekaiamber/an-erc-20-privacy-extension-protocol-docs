[English](02-deployments.md) | 中文

# B.1 部署记录

## BSC testnet（chain id 97）— 0.2.0（当前）

部署日期：2026-09-28　deployment id：`b1-v0_2_0-bsc-testnet`　`pep()` = `B:1:0.2.0`　合约源码 contracts `c518c1c`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20B1`**（Closed / CLS） | [`0x48DE3039e44Ed7CFbce6A4f69e5EA0c83cfB7258`](https://testnet.bscscan.com/address/0x48DE3039e44Ed7CFbce6A4f69e5EA0c83cfB7258) |
| **`PEPWrapper`** | [`0xfA04051c4cC38e439f871cBfA179424a257c5455`](https://testnet.bscscan.com/address/0xfA04051c4cC38e439f871cBfA179424a257c5455) |
| `WrappedERC20` wCLS | [`0x9F2380D5a23250ce95f9308C3E4E98A6649f11e4`](https://testnet.bscscan.com/address/0x9F2380D5a23250ce95f9308C3E4E98A6649f11e4) |
| 验证器 / 窗口表 | 复用 A.1 0.4.0 的（`a1-v0_4_0-bsc-testnet`） |

相对 0.1.1：随 A.1 0.4.0 改为普通 ElGamal（密钥约定、payload 布局、事件字段变更）；**0.1.1 及更早实例作废。** 实测：mint 196,300 · 0x01 705,929 · 折叠 463,825 · 销毁 362,411 · wrap（首次）991,127 · unwrap 129,631；余额与 `issuedSupply` 守恒验证通过。

## BSC testnet（chain id 97）— 0.1.1（已废弃：密钥约定与 payload 布局已变）

部署日期：2026-09-27（第一轮安全自审之后）　deployment id：`b1-v0_1_1-bsc-testnet`　`pep()` = `B:1:0.1.1`　合约源码 contracts `ab723ee`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20B1`**（Closed / CLS） | [`0xd53eb8f539153e73Db5532A9281f24f479Fa8e75`](https://testnet.bscscan.com/address/0xd53eb8f539153e73Db5532A9281f24f479Fa8e75) |
| **`PEPWrapper`** | [`0xcAF2c404a7EB33D3EE9f08AEB3Cf9a743c0Abe24`](https://testnet.bscscan.com/address/0xcAF2c404a7EB33D3EE9f08AEB3Cf9a743c0Abe24) |
| `WrappedERC20` wCLS | [`0x6273c1684B281fdFe3252f99B857D6Bb74010Bf2`](https://testnet.bscscan.com/address/0x6273c1684B281fdFe3252f99B857D6Bb74010Bf2) |

相对 0.1.0：自审修复 B1-F1..F4（[03-security-review](03-security-review.zh-cn.md)）。同一流程实测：mint 196,300 · 0x01 715,485 · 折叠 463,801 · 销毁 362,387 · wrap（首次）991,115 · unwrap 129,631；余额与 `issuedSupply` 守恒均已验证。

## BSC testnet（chain id 97）— 0.1.0（已废弃：B1-F1 / B1-F2）

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
