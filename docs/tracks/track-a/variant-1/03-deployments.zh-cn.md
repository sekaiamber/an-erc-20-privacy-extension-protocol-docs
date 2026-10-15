[English](03-deployments.md) | 中文

# A.1 部署记录

## BSC testnet（chain id 97）— 0.8.0（当前）

部署于 2026-10-15。`casata()` = `A:1:0.8.0`；两个代币都是 18 位小数（ADR-0014）。合约源码：contracts `ba3e807`。转账和 unshield 电路是新的（金额 128 位），所以它们的验证合约随带公开账本的代币一起部署，同时部署的还有 `G8TableHigh`，即第 48..127 位的窗口表。折叠验证合约和 `G8Table`（第 0..47 位）沿用下面 0.6.0 时上链的那份，没有变化。dApp 只打开这两个代币（发布之前只支持最新版本）。

| 组合 | 部署 id | 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- | --- | --- |
| 带公开账本 | `a1-v0_8_0-ledger-bsc-testnet` | **`A1LedgerToken`**（Test / TEST，18 位小数） | [`0x051d44D54D9A1df478a50A8c548864de4c307402`](https://testnet.bscscan.com/address/0x051d44D54D9A1df478a50A8c548864de4c307402) | 5,938,268 | [0x8d1b…3df7](https://testnet.bscscan.com/tx/0x8d1b8192618e3dfa1d878cda8c0c5f9359250284be44f593f94297e3a4663df7) |
| 纯隐私 | `a1-v0_8_0-private-bsc-testnet` | **`A1PrivateToken`**（Closed / CLS，18 位小数） | [`0xbe003F180864B70B3cD0f1Bc2306Ee47d0153480`](https://testnet.bscscan.com/address/0xbe003F180864B70B3cD0f1Bc2306Ee47d0153480) | 6,030,223 | [0xf9e8…56ad](https://testnet.bscscan.com/tx/0xf9e888e515a3d9dd448c5e9525537e2b2748a20a812d76d6428ef59a40c856ad) |

| 共享合约（0.8.0 新部署） | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- |
| `TransferVerifier`（14 个公开输入，128 位范围） | `0x0b997e814Aac94fBff2B2a632bCA36D9910692b2` | 764,925 | [0x439b…3029](https://testnet.bscscan.com/tx/0x439b1e49e003adff491ade0897f15acdfa5973c013bd2d984d70eba7e21c3029) |
| `UnshieldVerifier`（8 个公开输入） | `0x9010dF96017f3a3dD98E262F6e08092B1d0b4d0f` | 535,497 | [0x617f…b354](https://testnet.bscscan.com/tx/0x617fe6ccb2ce6055dd793b1f651e5ef7ab98180b3ea5982ca66dcf2b7e76b354) |
| `G8TableHigh`（20,480 字节） | `0x4A8bE23d83ABE40bbd38956639A81f62E47F22f2` | 4,541,011 | [0x1c41…55a2](https://testnet.bscscan.com/tx/0x1c418e174ea69a01318ad0a7a2df1dcdadf153c4207f3658d1631ba2b4f155a2) |

带公开账本的代币在构造函数里给部署者发行了 1,000,000 TEST（10²⁴ 个最小单位）；纯隐私代币没有初始发行。监管密钥：沿用 key id 0。

### 链上实测，0.8.0，`A1PrivateToken`（contracts `scripts/track-a/variant-1/e2e-private-bsc.ts`，2026-10-15）

金额都是 18 位小数的整数个代币，所以每一笔都超过 `2⁴⁸` 个最小单位。

| 操作 | gas | 交易 |
| --- | --- | --- |
| `mint` 1,000 到 id（`0x82`） | 228,745 | [0x8798…8ee2](https://testnet.bscscan.com/tx/0x8798f834ae3df99611a2b2e73322194ecc89273c0cc330d881243c56b5cb8ee2) |
| `0x01` 250，alice 给 bob | 705,453 | [0xda38…5a01](https://testnet.bscscan.com/tx/0xda38a7a61c3c4e987f91655eabbd29129fa62a8df1fb2a675a67a3d732be5a01) |
| `fold` | 462,821 | [0xb5fd…0e35](https://testnet.bscscan.com/tx/0xb5fdb78de5dbc40ac1c77aba2bce39bd9a21ac0cc4bb72628ac9792548550e35) |
| `0x81` 销毁 50 | 369,263 | [0x2e7d…c4ca](https://testnet.bscscan.com/tx/0x2e7d037aba7ebf21dccccf618cc858694bcb4635f2f6db172594af103e8ac4ca) |
| wrap 300；创建 wCLS `0x82557d902Ba23d148F6e77f0b5Dd40EA0246C3C1`（18 位小数） | 996,972 | [0x235a…b8cc](https://testnet.bscscan.com/tx/0x235ad2426809f7e1fb6d66872b262a4881b1ee64f365c1a1426543377572b8cc) |
| unwrap 100 到 bob 的 id | 178,819 | [0x6f47…1f66](https://testnet.bscscan.com/tx/0x6f473525ba987b64895faee4e5c07302160c50926039fc216f40538dd2831f66) |

脚本解出的每个余额都对得上。和 0.7.0 相比：mint 多 32k，因为 1,000·10¹⁸ 用到了第二张窗口表；转账、折叠、销毁差别在 7k 以内，电路变大影响的是证明，不是验证。脚本前两次运行在头几笔交易后停住（负载均衡的 RPC 用落后一个区块的节点回答读取；脚本现在固定在上一笔回执所在的区块读），所以代币里多了两笔各 1,000 CLS 的铸造。

### 链上实测，0.8.0，`A1LedgerToken`（dApp 客户端库，`dapp/scripts/e2e-bsc.mts`，2026-10-15）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100（收款方第二次收款；第一次来自一次中断的运行，花了 263,829） | 158,146 | [0x6ee6…cdd2](https://testnet.bscscan.com/tx/0x6ee6917e102821ac4a8b52b571fa7b6e1387addabd14f751660ce0ab581ecdd2) |
| `0x01` 12.5 | 705,688 | [0x4b17…7a46](https://testnet.bscscan.com/tx/0x4b178edbdbf213021f47e4272a6d7a89e92ba2835ef0e45d2a833e1b82fa7a46) |
| `fold`，中继提交 | 462,682 | [0x9dac…445d](https://testnet.bscscan.com/tx/0x9daca9e01e60edf798d60ad7aca5d6579da72e1e25d6f5ff289584c1d227445d) |
| `0x04` unshield 5，中继提交 | 380,840 | [0x906b…bbd2](https://testnet.bscscan.com/tx/0x906be0059c5cb857a5dc75466554f6e891d9792d38933ed5b0cbf35d75eebbd2) |

以上部署和所有运行，按测试网 gas 价格共花掉部署者 0.0047 BNB。

## BSC testnet（chain id 97）— 0.7.0（已被 0.8.0 取代）

部署日期：2026-10-15。两个代币的 `casata()` 都是 `A:1:0.7.0`，靠 `casataModules()` 区分。合约源码：contracts `9f3aa98`（04-modules M10 的生成组合）。电路没有变，所以两个代币都用下面 0.6.0 部署的验证合约和窗口表；除了这两个代币，没有部署别的。

| 组合 | 部署 id | 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- | --- | --- |
| 带公开账本 | `a1-v0_7_0-ledger-bsc-testnet` | **`A1LedgerToken`**（Test / TEST） | [`0xA287205B6E6638BE271F24aD82Ac9d73eB7244Bf`](https://testnet.bscscan.com/address/0xA287205B6E6638BE271F24aD82Ac9d73eB7244Bf) | 5,891,416 | [0xe815…7bbd](https://testnet.bscscan.com/tx/0xe815418511e3ae657a5cdd662b232db5776e7302e465a82c50fe3ce829bd7bbd) |
| 纯隐私 | `a1-v0_7_0-private-bsc-testnet` | **`A1PrivateToken`**（Closed / CLS） | [`0x7df7de993882819BDC27d1085814becEF12d6101`](https://testnet.bscscan.com/address/0x7df7de993882819BDC27d1085814becEF12d6101) | 5,979,185 | [0xfacc…7a5d](https://testnet.bscscan.com/tx/0xfaccc607d2c6f30bf23131263fb7b90aae88fe18e48ae820ba5efda72f177a5d) |

部署后立即从链上读回：

| | `A1LedgerToken` | `A1PrivateToken` |
| --- | --- | --- |
| `casataModules()` | 公开账本（`0x43dcbbd9`）和可增发（`0x40c10f19`），都在代币本身 | 可增发（`0x40c10f19`）在代币本身；Wrapper 端口（`0x1464bbec`）指向家族 Wrapper `0xfA04…5455` |
| `totalSupply()` | 1,000,000 TEST：构造函数公开发给部署者的初始供应（ADR-0013） | 0：没有初始供应，带可增发时允许 |
| 角色（`getRoleMember`，0.7.0 起可枚举） | admin、铸造者和监管管理员都是部署者 | 同左 |
| 字节码 | 14,683 字节 | 15,195 字节 |

监管密钥：与之前相同的 key id 0。部署 gas 比 0.6.0 多约 45 万：来自可枚举角色；带公开账本的代币还包括初始发行，0.6.0 时它是一笔单独的 `mint`（70,714 gas）。

### 链上实测，0.7.0，`A1PrivateToken`（contracts `scripts/track-a/variant-1/e2e-private-bsc.ts`，2026-10-15）

| 操作 | Gas | 交易 |
| --- | --- | --- |
| `mint` 1,000 到一个 id（`0x82`） | 196,591 | [0x205b…494f](https://testnet.bscscan.com/tx/0x205b4a03978d540862c2df90f11b19020bd9dd63728d66f7a38cb7a4ed7f494f) |
| `0x01` 250，alice 给 bob | 705,383 | [0xe088…d497](https://testnet.bscscan.com/tx/0xe088c2e7dbdd47c66a9f3413265028fee28999d59572a0edee4ea329e306d497) |
| `fold` | 462,799 | [0xea54…a2d4](https://testnet.bscscan.com/tx/0xea54bbf60f320e96710f030c51f4e55fecbf8a03cf6710800e4255b11715a2d4) |
| `0x81` 销毁 50（内核的销毁） | 362,563 | [0xc811…f16f](https://testnet.bscscan.com/tx/0xc811be7845b6e5694a21a87b73085571de76b99fce00d99a5dfac4331133f16f) |
| wrap 300，证明绑定 Wrapper 出口（A1-0007）；创建 wCLS `0xaF5Cb948B51E076B0523Cf5916533CbE41f1B6eb` | 990,064 | [0xc3b1…6cbb](https://testnet.bscscan.com/tx/0xc3b1d5616aad95d717b5f0d249eaec0bb8912914900f16f5f257424ef92c6cbb) |
| unwrap 100 到 bob 的 id | 129,680 | [0x38e7…f97e](https://testnet.bscscan.com/tx/0x38e72fe5fe6f2782d00a8ac317b5a960277168d50d52508cd956e56bd6dbf97e) |

脚本解出的每个余额都对得上，供应量也对得上：`totalSupply()` 750 CLS + wCLS 200 = 发行 1,000 − 销毁 50。

### 链上实测，0.7.0，`A1LedgerToken`（dApp 客户端库，`dapp/scripts/e2e-bsc.mts`，2026-10-15）

| 操作 | Gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100 | 214,678 | [0x5f37…4af5](https://testnet.bscscan.com/tx/0x5f37b1ce5f08720c7793dd54222a1ee0978c4befe18bf563718743565e154af5) |
| `0x01` 12.5 | 705,654 | [0x3ad0…56b0](https://testnet.bscscan.com/tx/0x3ad001e48e74267d38360a6546ef3a7aff6e8dd2a3dd0e47f5ee7d33906a56b0) |
| `fold`，代发 | 462,672 | [0x102d…b26f](https://testnet.bscscan.com/tx/0x102d505bbb97a7a7b40b60a1feadf471c47a62e059c6c8a41c35e5268570b26f) |
| `0x04` unshield 5，代发，证明绑定 unshield 出口（A1-0007） | 374,123 | [0xc1e8…959f](https://testnet.bscscan.com/tx/0xc1e8c32d8bb96df4335bf2d3ef7876b95321d4cf11cb6762152b8c9f64ad959f) |

跑完后 `shieldedSupply()` 为 95 TEST，钱包的公开余额为 999,905 TEST。每种操作的 gas 与 0.6.0 相差约 1k 以内。

0.7.0 的代币仍留在链上，dApp 已不再打开它们。下面 0.6.0 的代币也一样留在链上。

## BSC testnet（chain id 97）— 0.6.0（已被 0.7.0 取代）

部署日期：2026-10-13。两个代币的 `casata()` 都是 `A:1:0.6.0`，靠 `casataModules()` 区分。合约源码：contracts `a2c0ae0`。电路和证明密钥仍是 0.4.0 的，没有变化。

| 组合 | 部署 id | 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- | --- | --- |
| 带公开账本 | `a1-v0_6_0-ledger-bsc-testnet` | **`A1LedgerToken`**（Test / TEST） | [`0x9DC3A5864016924A0CCb598dcF60F5E7eFBAA327`](https://testnet.bscscan.com/address/0x9DC3A5864016924A0CCb598dcF60F5E7eFBAA327) | 5,430,530 | [0xbf99…4623](https://testnet.bscscan.com/tx/0xbf991c3008f3ebbeead63a5eb729189ded95c73c9d41cda84854886846424623) |
| 纯隐私 | `a1-v0_6_0-private-bsc-testnet` | **`A1PrivateToken`**（Closed / CLS） | [`0xbb818064790B9d4942f5662DACA1FEc61a6F9a20`](https://testnet.bscscan.com/address/0xbb818064790B9d4942f5662DACA1FEc61a6F9a20) | 5,560,694 | [0x32d1…1065](https://testnet.bscscan.com/tx/0x32d10c112b953423e36521ebb4e3659c711a57b74efd3467af7844dfb5e41065) |

| 共用合约 | 地址 | 部署 gas |
| --- | --- | --- |
| `TransferVerifier` | `0xa4f6deE18d7Aa3441CB7c84d76ce65343ED7d1b1` | 764,973 |
| `UnshieldVerifier` | `0x2d4a51dBa1E71c233cDEF84EC7ddC24CB7D5621a` | 500,764 |
| `FoldVerifier` | `0x487A1bF4D113228165330514A0f7a86e7797a456` | 331,714 |
| `G8Table` | `0xa60B4926f64203dba5Bb8310245F23e128901E51` | 2,745,934 |
| 家族 Wrapper（插在纯隐私代币的端口上；链上已有，部署时名为 `PEPWrapper`） | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | 无 |

验证合约和窗口表随带公开账本的代币重新部署了一份，纯隐私代币复用它们。它们与 0.5.0 那次部署的是同样的代码；直接复用那一份也可以。

下面两次运行之后从链上读回：

| | `A1LedgerToken` | `A1PrivateToken` |
| --- | --- | --- |
| `casataModules()` | 公开账本（`0x43dcbbd9`）和角色铸造（`0x40c10f19`），都在代币自身 | 角色铸造（`0x40c10f19`）在代币自身；Wrapper 端口（`0x1464bbec`）在 Wrapper |
| `totalSupply()` | 1,000,000 TEST（初始公开铸造） | 750 CLS |
| `shieldedSupply()` / `wrappedOut()` | 95 TEST | 200 CLS |

管理员、铸造者和监管管理员：部署钱包。监管密钥：与之前相同，密钥编号 0。初始公开铸造是一次不带 payload 的 `mint`（[0xe904…99fd](https://testnet.bscscan.com/tx/0xe9047e256007837a9db55f6b2380d44ec4aa6f4e95304263c9a46ffab85199fd)，70,714 gas）。

### 链上实测，0.6.0，`A1PrivateToken`（contracts `scripts/track-a/variant-1/e2e-private-bsc.ts`，2026-10-13）

| 操作 | gas | 0.5.0 链上 | 交易 |
| --- | --- | --- | --- |
| `mint` 加 payload `0x82`，1000 CLS 发给一个新 id | 196,603 | 196,372 | [0x91d8…24c9](https://testnet.bscscan.com/tx/0x91d8f4b1aacf3278c04098d604a5a9ab0637a4dabfb20fa21c0aa5762ca224c9) |
| `0x01` 250 CLS（双方都是第一次） | 705,427 | 705,873 | [0xc35f…57a7](https://testnet.bscscan.com/tx/0xc35f359c38e0ae04db490391bd5027e9b9e54d6df1599faa0815e15e864c57a7) |
| `fold`（收款方的第一次操作） | 462,787 | 463,769 | [0x8f88…2db6](https://testnet.bscscan.com/tx/0x8f882b349e2392d08bb61bc2958e673d19f58809ed946b0e06dcff137e702db6) |
| `0x81` 直接销毁 50 CLS | 362,469 | 362,553 | [0xe203…72fc](https://testnet.bscscan.com/tx/0xe20355b9f868d07e380400e033d604c882882d22f9c4fe3833971c42371072fc) |
| `wrap` 300 CLS（第一次 wrap：包含创建 wCLS 合约） | 989,663 | 989,584 | [0xea54…21ff](https://testnet.bscscan.com/tx/0xea5418f9f15c8147f0d5a5c5785beb5511ab253b9430e6780efdd334bd0a21ff) |
| wCLS `transfer`（普通 ERC-20） | 26,570 | 26,570 | 未记录 |
| `unwrap` 100 wCLS 进机密 id | 129,614 | 129,703 | [0x650c…0c8b](https://testnet.bscscan.com/tx/0x650c81c64f587263c7d81ffb27ac04eef6c395a85fe28733d875d6a575650c8b) |

证明时间（Node）：transfer 2.63 秒，fold 0.46 秒，销毁与 wrap 约 1.2 秒。每个解密出的余额都与预期明文一致。跑完之后，`totalSupply()` 750 加 wCLS 的 `totalSupply()` 200，等于已发行 1000 减已销毁 50。这次运行创建的包装代币是 wCLS，地址 `0x937bd3D71B513EbbB52c63FB7d2F9fF3CE3051D6`。

### 链上实测，0.6.0，`A1LedgerToken`（dApp 客户端库，`dapp/scripts/e2e-bsc.mts`，2026-10-13）

| 操作 | gas | 0.5.0 链上 | 交易 |
| --- | --- | --- | --- |
| `0x03` shield 100 TEST（收款方第一次收款） | 214,634 | 214,568 | [0x88a8…d37c](https://testnet.bscscan.com/tx/0x88a8012c99183b999c3f3e6aa6c2a65c6ff38d1ba10bc73f4e967d20f3d6d37c) |
| `0x01` 机密转账 12.5 TEST（双方都是第一次） | 705,566 | 705,880 | [0x8861…6327](https://testnet.bscscan.com/tx/0x8861a8d5e5bc0680efd8cfb7049c33650625bbef8d051118c86b16a31b656327) |
| `fold`（收款方的第一次操作，代提交） | 462,660 | 463,882 | [0xf370…fa47](https://testnet.bscscan.com/tx/0xf37053413d9d00c14716c67a0b351f0179681a3c76f3b300c0116c11d6e5fa47) |
| `0x04` unshield 5 TEST（折叠后的默认模式，代提交） | 373,875 | 373,871 | [0x1b68…250d](https://testnet.bscscan.com/tx/0x1b68fd7f6623f76d0f97391736876db77c403e0505ce09c0df1072b6717d250d) |

证明时间（Node）：transfer 1.84 秒，fold 0.38 秒，unshield 1.39 秒。收款方的 memo 解出 12.5，与密文一致；跑完之后钱包的公开余额减少 95，`shieldedSupply()` 为 95。

**0.6.0 没有在链上跑过的**：`A1LedgerToken` 上发给机密 id 的 `mint` 和 `0x81` 销毁（只有本地测试覆盖），以及浏览器里的 dApp 页面。

## BSC testnet（chain id 97）— 0.5.0（已被 0.6.0 取代）

部署日期：2026-10-13　两个代币的 `pep()` 都是 `A:1:0.5.0`，靠 `pepModules()` 区分　合约源码 contracts `3414e24`

| 组合 | deployment id | 合约 | 地址 |
| --- | --- | --- | --- |
| 带公开账本 | `a1-v0_5_0-ledger-bsc-testnet` | **`A1LedgerToken`**（Test / TEST） | [`0x6CA39A8b9Dd09162E99614D4386B897c88d38ccf`](https://testnet.bscscan.com/address/0x6CA39A8b9Dd09162E99614D4386B897c88d38ccf) |
| 纯隐私 | `a1-v0_5_0-private-bsc-testnet` | **`A1PrivateToken`**（Closed / CLS） | [`0x5F855e2221E9eBf854c3374149dF31298fF608B0`](https://testnet.bscscan.com/address/0x5F855e2221E9eBf854c3374149dF31298fF608B0) |

| 共用合约 | 地址 |
| --- | --- |
| `TransferVerifier` | `0xE6c4717933F803b405f79c5AAa284e23Ac1ee189` |
| `UnshieldVerifier` | `0xEC9D20d244866dD9863F0FDFCA0127DD16A7873C` |
| `FoldVerifier` | `0xC26Bb79C880dddA2fC0cd22848beF2458CbEAb70` |
| `G8Table` | `0x53d2d59F7EEc575A214e1B2cB2413EcE26506A9A` |
| `PEPWrapper`（插在纯隐私代币的端口上；随原 B.1 0.2.0 一起部署） | `0xfA04051c4cC38e439f871cBfA179424a257c5455` |

验证器和窗口表随带公开账本的代币一起部署，纯隐私代币复用它们。电路与 0.4.0 相同，没有改动。

部署后从链上读回的结果：

| | `A1LedgerToken` | `A1PrivateToken` |
| --- | --- | --- |
| `pepModules()` | 公开账本（`0x43dcbbd9`）与角色铸造（`0x60b2d978`），地址都是代币自身 | 角色铸造（`0x60b2d978`），地址是代币自身；Wrapper 端口（`0x1464bbec`），地址是 `PEPWrapper` |
| `totalSupply()` | 1,000,000 TEST（初始公开铸造） | 0 |
| `shieldedSupply()` / `wrappedOut()` | 0 | 0 |

管理员、铸造角色和监管管理员都是部署钱包。监管密钥与 0.4.0 那次部署相同，key id 为 0。

### 链上实测，`A1PrivateToken`（contracts `scripts/track-a/variant-1/e2e-private-bsc.ts`，2026-10-13）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `mintConfidential` 1000 CLS 到一个全新的 id | 196,372 | [0x203a…7e83](https://testnet.bscscan.com/tx/0x203a7aa03de25e696f71a22c34f32bc9b0cd22447df3f435da9bb4ed640b7e83) |
| `0x01` 250 CLS（双方都是首次） | 705,873 | [0x5578…2c62](https://testnet.bscscan.com/tx/0x5578642b080f4b831e35dc7ec8f2181cd668fd4ede8f1b81e766dd2b279d2c62) |
| `0x80` 折叠（收款方的首次操作） | 463,769 | [0x815f…f1dd](https://testnet.bscscan.com/tx/0x815f0f0c45d562778cc6bfb3781bc93a63995b2ea71709e08b03c39bcb04f1dd) |
| `0x81` 直接销毁 50 CLS | 362,553 | [0x42f4…5157](https://testnet.bscscan.com/tx/0x42f4256990565ff4b2ea4d17ce5344349bd7f140906f88ed33109841209a5157) |
| `wrap` 300 CLS（首次 wrap：含创建 wCLS 合约） | 989,584 | [0x781e…7d8d](https://testnet.bscscan.com/tx/0x781e524d8ae5e1bd53a3c3067f6fc4adc08a74c06a7d4003790bcf492e487d8d) |
| wCLS `transfer`（普通 ERC-20） | 26,570 | 未记录 |
| `unwrap` 100 wCLS 到一个机密 id | 129,703 | [0x2945…052d](https://testnet.bscscan.com/tx/0x2945f2daceadfe82d8debfe5c04c7088e541d53ad2f16ec6bb2fd7310fb2052d) |

证明时间（Node）：transfer 1.53 秒，fold 0.39 秒，销毁与 wrap 1.0 到 1.2 秒。每个解密出的余额都与预期明文一致。跑完之后，`totalSupply()` 750 加 wCLS 的 `totalSupply()` 200，等于已发行 1000 减已销毁 50。这次运行创建的包装代币是 wCLS，地址 `0xBC980A0ab8aF1bEf495e55b4106A55A5F9f28eBB`。

### 链上实测，`A1LedgerToken`（dApp 客户端库，`dapp/scripts/e2e-bsc.mts`，2026-10-13）

| 操作 | gas | 0.4.0 链上实测 | 交易 |
| --- | --- | --- | --- |
| `0x03` shield 100 TEST（收款方首次收款） | 214,568 | 214,534 | [0x8f2a…f1b5](https://testnet.bscscan.com/tx/0x8f2a586749ab874a190956fa033aaac027d6961f45576abbeba438195cc2f1b5) |
| `0x01` 机密转账 12.5 TEST（双方都是首次） | 705,880 | 705,970 | [0xc81f…9eb9](https://testnet.bscscan.com/tx/0xc81f1e9366d49b4ef9d3eb15f542e33442fb16fc83676ca94c52d7252f139eb9) |
| `0x80` 纯折叠（收款方的首次操作，代发） | 463,882 | 463,871 | [0x6cee…3dcf](https://testnet.bscscan.com/tx/0x6cee7217d3e99758c473e35e886e50ddfbe55a2de577e5fc43b7f357d07e3dcf) |
| `0x04` unshield 5 TEST（折叠后的默认模式，代发） | 373,871 | 373,589 | [0xc281…6712](https://testnet.bscscan.com/tx/0xc281cb7b4e18e7d70c1db866665a93e0b8cdb0f45cd941c5de3c4d799a9c6712) |

证明时间（Node）：transfer 1.77 秒，fold 0.44 秒，unshield 1.39 秒。收款方的 memo 解出 12.5，与密文一致；跑完之后钱包的公开余额减少 95，`shieldedSupply()` 为 95。

**没有在链上跑过的**：`A1LedgerToken` 上的 `mintConfidential` 和 `0x81` 销毁，这两项是这种组合新增的，目前只有本地测试覆盖（04-modules §10）。

相对 0.4.0 和原 B.1 0.2.0：两个独立合约变成了一个内核加若干模块（[04-modules §9](04-modules.zh-cn.md)）。**下面的 0.4.0 代币以及原 B.1 0.2.0 代币，dApp 已不再打开。** 它们仍留在链上。

## BSC testnet（chain id 97）— 0.4.0（已被 0.5.0 取代）

部署日期：2026-09-28　deployment id：`a1-v0_4_0-bsc-testnet`　`pep()` = `A:1:0.4.0`　合约源码 contracts `c518c1c`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x61035537DF2aac1CC21f9F56958938954786836c`](https://testnet.bscscan.com/address/0x61035537DF2aac1CC21f9F56958938954786836c) |
| `TransferVerifier`（14 公开输入，新电路） | `0x48A7CEbfdD43d5C9f10691609A8ec182f4DB53ed` |
| `UnshieldVerifier`（新电路） | `0x591046c256Dd0Bea8e365a0bd388139eaDdAE0A1` |
| `FoldVerifier`（新电路） | `0xfB6c2380D764c1BC88C015294b74bcf84a7E3014` |
| `G8Table` | `0xE8282e0E03f052b7c25b56Bda6Ef6a8D3C7A2B2C` |

相对 0.3.1：密码内核改为普通 ElGamal（01-design 0.4.0 变更记录）。三个电路全部重编；**0.3.1 及更早实例的密钥约定与 payload 布局不兼容，作废。**

### 链上实测（dapp 客户端库，2026-09-28）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100 TEST（收款方首次） | 214,534 | [0xc1cd…9466](https://testnet.bscscan.com/tx/0xc1cdac2bb0f431b5dd15cd20df41233b7b74fe039e1777ba64e3813950e09466) |
| `0x01` 机密转账 12.5 TEST（双方首次） | 705,970 | [0x7f57…6d94](https://testnet.bscscan.com/tx/0x7f574bc77d7c1594268bfd911a0c80c116fcb8d042acbb23930cd6db36396d94) |
| `0x80` 纯折叠（收款方首次操作） | 463,871 | [0xf980…4f49](https://testnet.bscscan.com/tx/0xf980be3b2ddc0a7d5cbbc4827ece11e33985a4ae4340713f008de85b25334f49) |
| `0x04` unshield 5 TEST（折叠后默认模式，中继提交） | 373,589 | [0x2655…ded0](https://testnet.bscscan.com/tx/0x2655fffa5e462946ffd48a4a2706976a8e5b58acbd132a8ded68da0cb9b5ded0) |

证明生成（Node）：transfer **1.53 s**（0.3.1：2.1 s），fold 0.34 s，unshield 1.04 s。`0x01` 比 0.3.1 少约 9.6k gas（少一个公开输入、payload 少 64 字节）。

## BSC testnet（chain id 97）— 0.3.1（已废弃：密钥约定与 payload 布局已变）

部署日期：2026-09-27　deployment id：`a1-v0_3_1-bsc-testnet`　`pep()` = `A:1:0.3.1`　合约源码 contracts `3563f29`

| 合约 | 地址 |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x2f2bDD5772E8F765F12B05268356558E95cFeD3c`](https://testnet.bscscan.com/address/0x2f2bDD5772E8F765F12B05268356558E95cFeD3c) |
| `TransferVerifier` | `0x1154910e4CDfCb20D89D285FaaBbe2aaE5a70fE9` |
| `UnshieldVerifier` | `0xb856aCD391459b1B4143b7FB31ce8ff9B8dfb213`（新电路） |
| `FoldVerifier` | `0x13f41DA46756d665AB09d1A06367aFc8Ba3dEFa1` |
| `G8Table` | `0xB4e749938Ed451f38BF175D9584993bb4AF55D82` |

相对 0.3.0 的唯一改动：安全修复 F14（unshield 收款地址绑进证明）。**0.3.0 实例存在可被抢跑偷走 unshield 的漏洞，作废。**

### 链上实测（dapp 客户端库，2026-09-27）

| 操作 | gas | 交易 |
| --- | --- | --- |
| `0x03` shield 100 TEST（收款方首次） | 214,534 | [0xff14…e720](https://testnet.bscscan.com/tx/0xff1452111fc2d7e2366d0bc8858da8cc22e2dadc4223dd7a7247cbd03acfe720) |
| `0x01` 机密转账 12.5 TEST（双方首次） | 715,555 | [0x6018…26b0](https://testnet.bscscan.com/tx/0x60189a36614e2c4af775e48c181892fd46d331a42723774cc31cb31c45f726b0) |
| `0x80` 纯折叠（收款方首次操作） | 463,918 | [0x8e3d…c9cf](https://testnet.bscscan.com/tx/0x8e3d8689caeb83ada75475d9bdc2db0b5c0ddaa53ec6708a82fb63799cfc6c9f) |
| `0x04` unshield 5 TEST（折叠后默认模式，中继提交，收款地址已绑定） | 373,642 | [0xd745…23a7](https://testnet.bscscan.com/tx/0xd74552cf032aa71d687b81de9ebc5e4d95aa3d2f556ac977306e9d4352f923a7) |

证明生成（Node）：transfer 2.12 s，fold 0.25 s，unshield 1.02 s。绑定 `to` 对 gas 无可见影响（+103）。

## BSC testnet（chain id 97）— 0.3.0（已废弃，F14 漏洞）

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

dapp 的 `NEXT_PUBLIC_TOKEN_ADDRESS` 指向 0.4.0 地址。0.2.4 实例仍在链上，但 dapp 读取其账户会因 ABI 不同（`confidentialAccountOf` 返回值数量）失败。
