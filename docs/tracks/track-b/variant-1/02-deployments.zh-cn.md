[English](02-deployments.md) | 中文

# B.1 部署记录

## BSC testnet（chain id 97）— 0.2.0（当前）

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
