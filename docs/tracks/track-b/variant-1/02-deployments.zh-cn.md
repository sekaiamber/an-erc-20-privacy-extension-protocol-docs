[English](02-deployments.md) | 中文

# B.1 部署记录

## BSC testnet（chain id 97）— 0.4.0（当前）

部署于 2026-10-15。`casata()` = `B:1:0.4.0`，18 位小数（ADR-0014）。部署 id：`b1-notes-v0_4_0-bsc-testnet`。合约源码：contracts `ba3e807`。join-split 电路是新的（金额 128 位，22 个公开输入），所以验证合约是新的；部署模块还顺带上链了一个哈希合约，代码和以前相同。dApp 只打开这个代币（发布之前只支持最新版本）。

| 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- |
| **`B1NoteToken`**（Notes / NTS，18 位小数；可增发 + Wrapper 端口） | [`0xfACc0Cb10E84d5f0db6458c2CcB3d9DD7588B2Dc`](https://testnet.bscscan.com/address/0xfACc0Cb10E84d5f0db6458c2CcB3d9DD7588B2Dc) | 7,519,649 | [0xce50…4bb7](https://testnet.bscscan.com/tx/0xce50e5e0b967d61b49eb95cf31b5b291a42d492bac9a2a8dc00c41cfb4904bb7) |
| `PoseidonT3`，哈希合约 | `0x9D96430941FB31A696F98251eA84a7b5bE2514BB` | 2,157,126 | [0x7683…3d87](https://testnet.bscscan.com/tx/0x76834a95306dea33bdc921406660b3e1161f04e18d3e0f6e135e6ef430413d87) |
| `JoinSplitVerifier`（22 个公开输入） | `0x0117F6CD175912F3b1C5F8873ddA63603d5DB9Cf` | 1,051,662 | [0x2cc6…5cfa](https://testnet.bscscan.com/tx/0x2cc6816e49e98d1358450caa965a58373d0e01f97f4a34437d626b185f995cfa) |
| 家族 Wrapper，插在 Wrapper 端口里 | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | 无 | 无 |

没有初始发行，可增发允许这样。监管密钥：A.1 代币用的那把公钥，key id 0。

### 链上实测，0.4.0（contracts `scripts/track-b/variant-1/e2e-notes.ts`，2026-10-15）

金额都是 18 位小数的整数个代币。脚本第一次运行铸造了 1,000，随后因为 RPC 拒绝读日志而停住（BNB Chain 的公共节点不提供 `eth_getLogs`；脚本现在从另一个节点读日志），所以下面是树上的第二到第六次操作。

| 操作 | gas | 交易 |
| --- | --- | --- |
| `mint` 1,000 | 1,384,959 | [0x4605…e628](https://testnet.bscscan.com/tx/0x4605a532874c64bd3af0cbea2f793b85a8242f3f51a03e89b2b9380c7326e628) |
| note 转账 250 | 1,376,078 | [0xcb41…6c12](https://testnet.bscscan.com/tx/0xcb4132b37c94a7f825da6ec16ba679831362e84b43d16182797e9848079a6c12) |
| 销毁 50 | 1,375,865 | [0x98a4…fff5](https://testnet.bscscan.com/tx/0x98a4d858d2b2bb0e680c1138e3f4984b5681e4dd0d88cadd0e82970d4dc7fff5) |
| wrap 300（创建包装代币） | 2,007,963 | [0x918e…14ef](https://testnet.bscscan.com/tx/0x918e0403250d92f386d02b5be603e8796a79db5d148b668590ae4a82e17614ef) |
| unwrap 100 成一个 note | 1,414,121 | [0xa220…bba7](https://testnet.bscscan.com/tx/0xa2203e710cd820568bc459899b69039312bb344480b451e1e27e254c9bc1bba7) |

两个钱包都找到了自己的 note（alice 450，bob 300）。`totalSupply()` 1,750 + `wrappedOut()` 200 = `issuedSupply()` 1,950，其中包括第一次运行的那笔铸造。和 0.3.0 相比，转账、销毁、wrap、unwrap 各多 1.5k 到 12k（多了一个公开输入，金额也更大）；mint 不可比，0.3.0 记的是树上的第一次操作。

## BSC testnet（chain id 97）— 0.3.0（已被 0.4.0 取代）

部署日期：2026-10-15。`casata()` = `B:1:0.3.0`。部署 id：`b1-notes-v0_3_0-bsc-testnet`。合约源码：contracts `9f3aa98`。电路和证明密钥仍是 0.1.0 的。部署模块会随代币一起部署一个哈希合约和一个验证合约，代码与 0.2.0 的相同。

| 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- |
| **`B1NoteToken`**（Notes / NTS，6 位小数；可增发 + Wrapper 端口） | [`0x9D9b162AEbb26F829e9C0f84430FDc38a680F95F`](https://testnet.bscscan.com/address/0x9D9b162AEbb26F829e9C0f84430FDc38a680F95F) | 7,498,598 | [0x8b1c…ed94](https://testnet.bscscan.com/tx/0x8b1c059fe87edc680a6f7fd7529d0ad1ab37d3ae6382a63e2226a4833fc5ed94) |
| `PoseidonT3`，哈希合约 | `0xf11FDaDD67b78f6a5D07E162d2F2D8CD9B63C64F` | 2,157,126 | [0x4569…339a](https://testnet.bscscan.com/tx/0x456912875e8c96345fd6174c28013a13502afe6f3a0173b3fbadf689251a339a) |
| `JoinSplitVerifier` | `0x83b32165903100AebF3B5611E62f5B67842af8a0` | 1,016,217 | [0x880f…4644](https://testnet.bscscan.com/tx/0x880f6b8c4e9374af8e3d4291aed3414cb60bda424639f33cda9187234fec4644) |
| 家族 Wrapper，插在 Wrapper 端口上 | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | 不适用 | 不适用 |

部署后立即从链上读回：`casataModules()` 列出可增发（`0x40c10f19`，在代币本身）和 Wrapper 端口（`0x1464bbec`，指向 Wrapper）；`totalSupply()` 为 0，因为这次部署没有初始供应，带可增发时允许；admin、铸造者和监管管理员都是部署者，用 `getRoleMember` 读出（0.3.0 起角色可枚举）；字节码 15,510 字节。部署 gas 比 0.2.0 多约 31 万，来自可枚举角色和构造函数里的初始发行路径。监管密钥：A.1 代币用的那把公钥，作为 key id 0。带初始发行（针对预测地址证明）的部署还没在链上做过（本地实测 8,142,825 gas，01-design §7.1）。

### 链上实测，0.3.0（contracts `scripts/track-b/variant-1/e2e-notes.ts`，2026-10-15）

| 操作 | Gas | 交易 |
| --- | --- | --- |
| `mint` 1,000（新树上的第一次操作） | 1,828,027 | [0xc1bc…dd90](https://testnet.bscscan.com/tx/0xc1bc35d4a200ceded9cb092a86a85999c6b6ab62587d9a6bdf57a3e4ec1cdd90) |
| note 转账 250 | 1,369,300 | [0x6beb…d870](https://testnet.bscscan.com/tx/0x6beb1f2fd0b930c561397178007fceac6f2344df8088e97a54860d2477abd870) |
| 销毁 50（内核的销毁） | 1,374,365 | [0xe9b7…fe52](https://testnet.bscscan.com/tx/0xe9b77fddd5b77c4652f82a9c7b5e5fcc8b6c2a8345b0fa302635e310ca5dfe52) |
| wrap 300（创建 wNTS `0x3F4Da57B93abE8e3c1Bc94e959C25e4E34E12fB3`） | 1,995,791 | [0x529f…72f6](https://testnet.bscscan.com/tx/0x529fd84638f999d5bf386a72c5eb20c4ae64469203d8e58d059faa0a909972f6) |
| unwrap 100 成一个 note | 1,412,637 | [0xfd3f…8b10](https://testnet.bscscan.com/tx/0xfd3f2693408e283d306351755f1e2bdccacc80841c896a4d3d8087a04c5f8b10) |

钱包都找到了自己的 note（alice 450，bob 300），`totalSupply()` 750 + `wrappedOut()` 200 = `issuedSupply()` 950。gas 与 0.2.0 相差不过几百：从内存解析 payload 的开销测不出来。

0.3.0 的代币仍留在链上，dApp 已不再打开它。下面 0.2.0 的代币也一样留在链上。

## BSC testnet（chain id 97）— 0.2.0（已被 0.3.0 取代）

部署日期：2026-10-13。`casata()` = `B:1:0.2.0`。部署 id：`b1-notes-v0_2_0-bsc-testnet`。合约源码：contracts `a2c0ae0`。电路和证明密钥与 0.1.0 相同。

| 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- |
| **`B1NoteToken`**（Notes / NTS，6 位小数） | [`0xeD0B87cF26C2D58E6da402A5437b8b396430bf0a`](https://testnet.bscscan.com/address/0xeD0B87cF26C2D58E6da402A5437b8b396430bf0a) | 7,184,860 | [0xe33c…975d](https://testnet.bscscan.com/tx/0xe33c474bf683f91256ba2d057048d0c5f686f58b7eb4e0245e1362d5c245975d) |
| `PoseidonT3`，哈希合约（circomlibjs 生成的字节码） | `0x8a507627397e2217b742D3BC9653C3e9B6B8600c` | 2,157,126 | [0xc49b…0124](https://testnet.bscscan.com/tx/0xc49b788aeafa2d1e2db36530919c1a3aff80d28bae20674251b40df9ce7f0124) |
| `JoinSplitVerifier` | `0xe76430bf04c32A0C2Fb5a252A8B72B9ba49322AE` | 1,016,217 | [0x4d57…c72d](https://testnet.bscscan.com/tx/0x4d576c693f3cd3ee366438110fe2535ff4ef004a4bda4db351dd9230bfe7c72d) |
| 家族 Wrapper，插在 Wrapper 端口上（链上已有，部署时名为 `PEPWrapper`；A.1 用的也是它） | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | 无 | 无 |
| wNTS，Wrapper 在第一次 wrap 时创建的包装 ERC-20 | `0xB066794bB33DAa175e1196EA2f70C3052deFBD8e` | 含在第一次 wrap 里 | [0xb6a4…2689](https://testnet.bscscan.com/tx/0xb6a463ae993ad404a6fc74fc99e28c04517108a6f83be20978144672fdbe2689) |

下面这次运行之后从链上读回：

| | 值 |
| --- | --- |
| `casataModules()` | 角色铸造（`0x40c10f19`）在代币自身；Wrapper 端口（`0x1464bbec`）在 Wrapper |
| `TREE_DEPTH()`、`hasher()`、`verifier()` | 24，以及上面两个地址 |
| `leafCount()` | 10（五次操作） |
| `totalSupply()` = `balanceOf(token)` | 750 NTS |
| `wrappedOut()` | 200 NTS |
| `issuedSupply()` | 950 NTS |

管理员、铸造者和监管管理员：部署钱包 `0xF3c7a7f35f69638e209814b469ad3722Ab60aAb1`。监管密钥：A.1 代币使用的那把公钥，密钥编号 0。

### 链上实测，0.2.0（contracts `scripts/track-b/variant-1/e2e-notes.ts`，2026-10-13）

| 操作 | gas | 0.1.0 链上 | 交易 |
| --- | --- | --- | --- |
| `mint` 1000 NTS 铸成 note（树上的第一次操作） | 1,830,123 | 1,830,099 | [0xfb0d…bd05](https://testnet.bscscan.com/tx/0xfb0d51aa4e79291f02cf3c593926ded22fbed9e83609732acd48e69ee7cdbd05) |
| note 转账 250 NTS，带找零 | 1,370,444 | 1,370,386 | [0x9be6…8627](https://testnet.bscscan.com/tx/0x9be62f8c0fde08e89527134a4174e7db95c62b8b6a78ac852995fb42d9c98627) |
| 销毁 50 NTS | 1,375,790 | 1,375,768 | [0x4879…6b76](https://testnet.bscscan.com/tx/0x48797378fd2eece1e57b4b2d1dd8ac07b203f73ace7f4b6100e29116bdc36b76) |
| wrap 300 NTS（第一次 wrap：包含创建 wNTS 合约） | 1,997,729 | 1,997,599 | [0xb6a4…2689](https://testnet.bscscan.com/tx/0xb6a463ae993ad404a6fc74fc99e28c04517108a6f83be20978144672fdbe2689) |
| unwrap 100 wNTS 换回 note | 1,414,607 | 1,414,605 | [0x9338…1c1f](https://testnet.bscscan.com/tx/0x9338fe76763b6bb61f436c94a437dfbf1df6c49ecead546e77994fc2756f1c1f) |

- 每个证明在 Node 里用时 2.9 到 3.9 秒。
- 每一步之后，脚本都按 dApp 的方式读取代币的历史，并把重建出的树根与链上的比较。两个钱包都找到了自己的 note：最后分别是 450 NTS 和 300 NTS。
- 之后用 dApp 的读取路径对这个代币做了只读检查（`dapp/scripts/check-b1-live.mts`）：读到五次操作、十个叶子，重建的树根与链上一致。

0.2.0 没有在链上验证的部分：浏览器里的 dApp 页面、B.1 的监管视图（还没写）、监管密钥轮换、`setWrapper`。

## BSC testnet（chain id 97）— 0.1.0（已被 0.2.0 取代）

部署日期：2026-10-13。`pep()` = `B:1:0.1.0`。部署 id：`b1-notes-v0_1_0-bsc-testnet`。合约源码：contracts `1ace0e5`。

| 合约 | 地址 | 部署 gas | 交易 |
| --- | --- | --- | --- |
| **`B1NoteToken`**（Notes / NTS，6 位小数） | [`0xFAAf4fc5975d36527E681347e1CFde2C2d676728`](https://testnet.bscscan.com/address/0xFAAf4fc5975d36527E681347e1CFde2C2d676728) | 7,196,391 | [0xb36d…f152](https://testnet.bscscan.com/tx/0xb36d35eee001afcacd9052808f6584634d87f0d54f4f6c5d006066a00154f152) |
| `PoseidonT3`，哈希合约（circomlibjs 生成的字节码） | `0x512936285c01e68F79F6D9DcCfc9E80D355e7114` | 2,157,126 | [0x0795…1e64](https://testnet.bscscan.com/tx/0x0795b01d35ccf2168f301092f6a7d887a20588386dda99b7b31763adcfb31e64) |
| `JoinSplitVerifier` | `0xE19461Cc4dd70cd92cAF18a61948A1844C77a1bc` | 1,016,217 | [0x1dad…352c](https://testnet.bscscan.com/tx/0x1dadb668e83e9ff76f89f8881b991cc2bbcdf141f746a5065163eabbc837352c) |
| `PEPWrapper`，插在 Wrapper 端口上（链上已有，与 A.1 用的是同一个） | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | 无 | 无 |
| wNTS，Wrapper 在第一次 wrap 时创建的包装 ERC-20 | `0x8C0e303cc47652D379fe3f0bf2E0bA8da82Ea44c` | 含在第一次 wrap 里 | [0xc80b…c3fb](https://testnet.bscscan.com/tx/0xc80b946e48132d25af525fe412dbd2a0b27425039fed6fb4fd7b299e0012c3fb) |

合约仓库里的部署 id `b1-v0_1_0`、`b1-v0_1_1`、`b1-v0_2_0` 属于原来的 B.1，也就是现在 A.1 的纯隐私组合。

代币的部署 gas 很大，是因为构造函数在链上算出了承诺树的 24 个空子树（设计 §3.3）。

下面这次运行之后从链上读回的值：

| | 值 |
| --- | --- |
| `pepModules()` | 角色铸造（`0x60b2d978`）在代币自身；Wrapper 端口（`0x1464bbec`）在 `PEPWrapper` |
| `TREE_DEPTH()`、`hasher()`、`verifier()` | 24，以及上表的两个地址 |
| `leafCount()` | 10（五次操作） |
| `totalSupply()` = `balanceOf(token)` | 750 NTS |
| `wrappedOut()` | 200 NTS |
| `issuedSupply()` | 950 NTS |

管理员、铸造方、监管管理员：部署钱包 `0xF3c7a7f35f69638e209814b469ad3722Ab60aAb1`。监管密钥：与 A.1 两个代币相同的公钥，密钥 id 为 0。

### 链上实测（contracts `scripts/track-b/variant-1/e2e-notes.ts`，2026-10-13）

| 操作 | gas | 交易 |
| --- | --- | --- |
| 铸造 1000 NTS 成一张 note（这棵树上的第一次操作） | 1,830,099 | [0xbf8b…d996](https://testnet.bscscan.com/tx/0xbf8bbb442bbd7ff5df5843382ae100be2a5b24539f189a5193ae655c2cded996) |
| note 转账 250 NTS，带找零 | 1,370,386 | [0x7cc6…6ca6](https://testnet.bscscan.com/tx/0x7cc623749b58c10b40b5e48bdde5e81426f85980f9cfeff8f89dda5dfecf6ca6) |
| 销毁 50 NTS | 1,375,768 | [0x0239…b120](https://testnet.bscscan.com/tx/0x0239c434024f6c3a371f31f866f923595f4b57974f0fe6b8ed9b146192b7b120) |
| wrap 300 NTS（第一次 wrap：含创建 wNTS 合约） | 1,997,599 | [0xc80b…c3fb](https://testnet.bscscan.com/tx/0xc80b946e48132d25af525fe412dbd2a0b27425039fed6fb4fd7b299e0012c3fb) |
| unwrap 100 wNTS 成一张 note | 1,414,605 | [0x81ed…2b85](https://testnet.bscscan.com/tx/0x81ed9e564ad64a6ace31d0dc2c8c2883e593d1cad7a521a57824367827492b85) |

- 这些数字与本地实测（设计 §12）只差几十 gas。
- 对一棵新树的第一次操作要多付约 45.5 万，花在前沿的首次写入上。树已在使用时，铸造约 1,375k（本地实测）。
- 第一次之后的 wrap 约 1,403k（本地实测）。
- 每个证明在 Node 里用了 2.6 到 3.3 秒。
- 脚本在每一步之后都按 dApp 的方式读取代币历史：从 `lastOperationBlock()` 沿 `prevBlock` 往回读，重建承诺树，并把树根与链上的比较。两个钱包都找到了自己的 note：最后分别是 450 NTS 和 300 NTS。

### 没有在链上验证的部分

- 在浏览器里使用 dApp 页面 `/tracks/b/1`。
- 监管视图：监管 memo 已经在链上，但给 B.1 解码的工具还没有写。
- 监管密钥轮换，以及 `setWrapper`（Wrapper 在部署时就给定了）。
