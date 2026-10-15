English | [中文](02-deployments.zh-cn.md)

# B.1 Deployment Record

## BSC testnet (chain id 97) — 0.4.0 (current)

Deployed: 2026-10-15. `casata()` = `B:1:0.4.0`, 18 decimals (ADR-0014). Deployment id: `b1-notes-v0_4_0-bsc-testnet`. Contract source: contracts `ba3e807`. The join-split circuit is new (128-bit amounts, 22 public inputs), so its verifier is new; the deploy module also put a hash contract on chain, the same code as before. The dApp opens only this token (it drives only the newest version before release).

| Contract | Address | Deployment gas | Transaction |
| --- | --- | --- | --- |
| **`B1NoteToken`** (Notes / NTS, 18 decimals; Mintable + Wrapper port) | [`0xfACc0Cb10E84d5f0db6458c2CcB3d9DD7588B2Dc`](https://testnet.bscscan.com/address/0xfACc0Cb10E84d5f0db6458c2CcB3d9DD7588B2Dc) | 7,519,649 | [0xce50…4bb7](https://testnet.bscscan.com/tx/0xce50e5e0b967d61b49eb95cf31b5b291a42d492bac9a2a8dc00c41cfb4904bb7) |
| `PoseidonT3`, the hash contract | `0x9D96430941FB31A696F98251eA84a7b5bE2514BB` | 2,157,126 | [0x7683…3d87](https://testnet.bscscan.com/tx/0x76834a95306dea33bdc921406660b3e1161f04e18d3e0f6e135e6ef430413d87) |
| `JoinSplitVerifier` (22 public inputs) | `0x0117F6CD175912F3b1C5F8873ddA63603d5DB9Cf` | 1,051,662 | [0x2cc6…5cfa](https://testnet.bscscan.com/tx/0x2cc6816e49e98d1358450caa965a58373d0e01f97f4a34437d626b185f995cfa) |
| The family Wrapper, plugged into the Wrapper port | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | n/a | n/a |

No initial supply, which Mintable allows. Regulator key: the public key the A.1 tokens use, as key id 0.

### On-chain measurements, 0.4.0 (contracts `scripts/track-b/variant-1/e2e-notes.ts`, 2026-10-15)

Amounts in whole tokens of 18 decimals. The first run of the script minted 1,000 and stopped when the RPC refused its log reads (BNB Chain's public endpoint does not serve `eth_getLogs`; the script now reads logs from another endpoint), so the operations below are the second through sixth on the tree.

| Operation | Gas | Transaction |
| --- | --- | --- |
| `mint` 1,000 | 1,384,959 | [0x4605…e628](https://testnet.bscscan.com/tx/0x4605a532874c64bd3af0cbea2f793b85a8242f3f51a03e89b2b9380c7326e628) |
| Note transfer 250 | 1,376,078 | [0xcb41…6c12](https://testnet.bscscan.com/tx/0xcb4132b37c94a7f825da6ec16ba679831362e84b43d16182797e9848079a6c12) |
| Burn 50 | 1,375,865 | [0x98a4…fff5](https://testnet.bscscan.com/tx/0x98a4d858d2b2bb0e680c1138e3f4984b5681e4dd0d88cadd0e82970d4dc7fff5) |
| Wrap 300 (creates the wrapped token) | 2,007,963 | [0x918e…14ef](https://testnet.bscscan.com/tx/0x918e0403250d92f386d02b5be603e8796a79db5d148b668590ae4a82e17614ef) |
| Unwrap 100 into a note | 1,414,121 | [0xa220…bba7](https://testnet.bscscan.com/tx/0xa2203e710cd820568bc459899b69039312bb344480b451e1e27e254c9bc1bba7) |

The wallets find their notes (alice 450, bob 300). `totalSupply()` 1,750 + `wrappedOut()` 200 = `issuedSupply()` 1,950, which includes the first run's mint. Against 0.3.0 the transfer, burn, wrap and unwrap cost 1.5k to 12k more (one more public input, and larger amounts); the mint is not comparable, since 0.3.0 recorded the first operation on the tree.

## BSC testnet (chain id 97) — 0.3.0 (superseded by 0.4.0)

Deployed: 2026-10-15. `casata()` = `B:1:0.3.0`. Deployment id: `b1-notes-v0_3_0-bsc-testnet`. Contract source: contracts `9f3aa98`. The circuit and the proving key are those of 0.1.0. The deploy module puts a hash contract and a verifier on chain with the token; they are the same code as 0.2.0's.

| Contract | Address | Deployment gas | Transaction |
| --- | --- | --- | --- |
| **`B1NoteToken`** (Notes / NTS, 6 decimals; Mintable + Wrapper port) | [`0x9D9b162AEbb26F829e9C0f84430FDc38a680F95F`](https://testnet.bscscan.com/address/0x9D9b162AEbb26F829e9C0f84430FDc38a680F95F) | 7,498,598 | [0x8b1c…ed94](https://testnet.bscscan.com/tx/0x8b1c059fe87edc680a6f7fd7529d0ad1ab37d3ae6382a63e2226a4833fc5ed94) |
| `PoseidonT3`, the hash contract | `0xf11FDaDD67b78f6a5D07E162d2F2D8CD9B63C64F` | 2,157,126 | [0x4569…339a](https://testnet.bscscan.com/tx/0x456912875e8c96345fd6174c28013a13502afe6f3a0173b3fbadf689251a339a) |
| `JoinSplitVerifier` | `0x83b32165903100AebF3B5611E62f5B67842af8a0` | 1,016,217 | [0x880f…4644](https://testnet.bscscan.com/tx/0x880f6b8c4e9374af8e3d4291aed3414cb60bda424639f33cda9187234fec4644) |
| The family Wrapper, plugged into the Wrapper port | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | n/a | n/a |

Read back from the chain right after deployment: `casataModules()` lists Mintable (`0x40c10f19`) at the token and the Wrapper port (`0x1464bbec`) at the Wrapper; `totalSupply()` is 0, since the deployment carries no initial supply, which Mintable allows; admin, minter and regulator admin are the deployer, read with `getRoleMember` (roles are enumerable from 0.3.0); the bytecode is 15,510 bytes. The deployment gas is about 310k more than 0.2.0's, for the enumerable roles and the constructor's initial-issuance path. Regulator key: the public key the A.1 tokens use, as key id 0. No deployment with an initial supply proved for its address has been made on chain yet (measured locally: 8,142,825 gas, 01-design §7.1).

### On-chain measurements, 0.3.0 (contracts `scripts/track-b/variant-1/e2e-notes.ts`, 2026-10-15)

| Operation | Gas | Transaction |
| --- | --- | --- |
| `mint` 1,000 (the first operation on the fresh tree) | 1,828,027 | [0xc1bc…dd90](https://testnet.bscscan.com/tx/0xc1bc35d4a200ceded9cb092a86a85999c6b6ab62587d9a6bdf57a3e4ec1cdd90) |
| Note transfer 250 | 1,369,300 | [0x6beb…d870](https://testnet.bscscan.com/tx/0x6beb1f2fd0b930c561397178007fceac6f2344df8088e97a54860d2477abd870) |
| Burn 50 (the core's burn) | 1,374,365 | [0xe9b7…fe52](https://testnet.bscscan.com/tx/0xe9b77fddd5b77c4652f82a9c7b5e5fcc8b6c2a8345b0fa302635e310ca5dfe52) |
| Wrap 300 (creates wNTS `0x3F4Da57B93abE8e3c1Bc94e959C25e4E34E12fB3`) | 1,995,791 | [0x529f…72f6](https://testnet.bscscan.com/tx/0x529fd84638f999d5bf386a72c5eb20c4ae64469203d8e58d059faa0a909972f6) |
| Unwrap 100 into a note | 1,412,637 | [0xfd3f…8b10](https://testnet.bscscan.com/tx/0xfd3f2693408e283d306351755f1e2bdccacc80841c896a4d3d8087a04c5f8b10) |

The wallets find their notes (alice 450, bob 300), and `totalSupply()` 750 + `wrappedOut()` 200 = `issuedSupply()` 950. The gas matches 0.2.0's to within a few hundred: parsing the payload from memory costs nothing measurable.

The 0.3.0 token stays on the chain; the dApp no longer opens it. The 0.2.0 token below stays as well.

## BSC testnet (chain id 97) — 0.2.0 (superseded by 0.3.0)

Deployed: 2026-10-13. `casata()` = `B:1:0.2.0`. Deployment id: `b1-notes-v0_2_0-bsc-testnet`. Contract source: contracts `a2c0ae0`. The circuit and the proving key are those of 0.1.0.

| Contract | Address | Deployment gas | Transaction |
| --- | --- | --- | --- |
| **`B1NoteToken`** (Notes / NTS, 6 decimals) | [`0xeD0B87cF26C2D58E6da402A5437b8b396430bf0a`](https://testnet.bscscan.com/address/0xeD0B87cF26C2D58E6da402A5437b8b396430bf0a) | 7,184,860 | [0xe33c…975d](https://testnet.bscscan.com/tx/0xe33c474bf683f91256ba2d057048d0c5f686f58b7eb4e0245e1362d5c245975d) |
| `PoseidonT3`, the hash contract (bytecode generated by circomlibjs) | `0x8a507627397e2217b742D3BC9653C3e9B6B8600c` | 2,157,126 | [0xc49b…0124](https://testnet.bscscan.com/tx/0xc49b788aeafa2d1e2db36530919c1a3aff80d28bae20674251b40df9ce7f0124) |
| `JoinSplitVerifier` | `0xe76430bf04c32A0C2Fb5a252A8B72B9ba49322AE` | 1,016,217 | [0x4d57…c72d](https://testnet.bscscan.com/tx/0x4d576c693f3cd3ee366438110fe2535ff4ef004a4bda4db351dd9230bfe7c72d) |
| The family Wrapper, plugged into the Wrapper port (already on the chain, deployed as `PEPWrapper`; the one A.1 uses) | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | n/a | n/a |
| wNTS, the wrapped ERC-20 the Wrapper created on the first wrap | `0xB066794bB33DAa175e1196EA2f70C3052deFBD8e` | part of the first wrap | [0xb6a4…2689](https://testnet.bscscan.com/tx/0xb6a463ae993ad404a6fc74fc99e28c04517108a6f83be20978144672fdbe2689) |

Read back from the chain after the run below:

| | Value |
| --- | --- |
| `casataModules()` | role issuance (`0x40c10f19`) at the token; Wrapper port (`0x1464bbec`) at the Wrapper |
| `TREE_DEPTH()`, `hasher()`, `verifier()` | 24, and the two addresses above |
| `leafCount()` | 10 (five operations) |
| `totalSupply()` = `balanceOf(token)` | 750 NTS |
| `wrappedOut()` | 200 NTS |
| `issuedSupply()` | 950 NTS |

Admin, minter and regulator admin: the deployer wallet `0xF3c7a7f35f69638e209814b469ad3722Ab60aAb1`. Regulator key: the public key the A.1 tokens use, as key id 0.

### On-chain measurements, 0.2.0 (contracts `scripts/track-b/variant-1/e2e-notes.ts`, 2026-10-13)

| Operation | gas | 0.1.0 on chain | Transaction |
| --- | --- | --- | --- |
| `mint` 1000 NTS into a note (the first operation on the tree) | 1,830,123 | 1,830,099 | [0xfb0d…bd05](https://testnet.bscscan.com/tx/0xfb0d51aa4e79291f02cf3c593926ded22fbed9e83609732acd48e69ee7cdbd05) |
| Note transfer, 250 NTS, with change | 1,370,444 | 1,370,386 | [0x9be6…8627](https://testnet.bscscan.com/tx/0x9be62f8c0fde08e89527134a4174e7db95c62b8b6a78ac852995fb42d9c98627) |
| Burn 50 NTS | 1,375,790 | 1,375,768 | [0x4879…6b76](https://testnet.bscscan.com/tx/0x48797378fd2eece1e57b4b2d1dd8ac07b203f73ace7f4b6100e29116bdc36b76) |
| Wrap 300 NTS (the first wrap: includes creating the wNTS contract) | 1,997,729 | 1,997,599 | [0xb6a4…2689](https://testnet.bscscan.com/tx/0xb6a463ae993ad404a6fc74fc99e28c04517108a6f83be20978144672fdbe2689) |
| Unwrap 100 wNTS into a note | 1,414,607 | 1,414,605 | [0x9338…1c1f](https://testnet.bscscan.com/tx/0x9338fe76763b6bb61f436c94a437dfbf1df6c49ecead546e77994fc2756f1c1f) |

- Proofs took 2.9 to 3.9 s each in Node.
- After every step the script read the token's history the way the dApp does and compared the rebuilt tree's root with the chain's. Both wallets found their notes: 450 NTS and 300 NTS at the end.
- The dApp's read path was checked against this token afterwards (`dapp/scripts/check-b1-live.mts`, read-only): five operations walked, ten leaves, the rebuilt root equals the chain's.

Not exercised on chain for 0.2.0: the dApp page in a browser, a regulator view for B.1 (not written), regulator key rotation, `setWrapper`.

## BSC testnet (chain id 97) — 0.1.0 (superseded by 0.2.0)

Deployed: 2026-10-13. `pep()` = `B:1:0.1.0`. Deployment id: `b1-notes-v0_1_0-bsc-testnet`. Contract source: contracts `1ace0e5`.

| Contract | Address | Deployment gas | Transaction |
| --- | --- | --- | --- |
| **`B1NoteToken`** (Notes / NTS, 6 decimals) | [`0xFAAf4fc5975d36527E681347e1CFde2C2d676728`](https://testnet.bscscan.com/address/0xFAAf4fc5975d36527E681347e1CFde2C2d676728) | 7,196,391 | [0xb36d…f152](https://testnet.bscscan.com/tx/0xb36d35eee001afcacd9052808f6584634d87f0d54f4f6c5d006066a00154f152) |
| `PoseidonT3`, the hash contract (bytecode generated by circomlibjs) | `0x512936285c01e68F79F6D9DcCfc9E80D355e7114` | 2,157,126 | [0x0795…1e64](https://testnet.bscscan.com/tx/0x0795b01d35ccf2168f301092f6a7d887a20588386dda99b7b31763adcfb31e64) |
| `JoinSplitVerifier` | `0xE19461Cc4dd70cd92cAF18a61948A1844C77a1bc` | 1,016,217 | [0x1dad…352c](https://testnet.bscscan.com/tx/0x1dadb668e83e9ff76f89f8881b991cc2bbcdf141f746a5065163eabbc837352c) |
| `PEPWrapper`, plugged into the Wrapper port (already on the chain; the one A.1 uses) | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | n/a | n/a |
| wNTS, the wrapped ERC-20 the Wrapper created on the first wrap | `0x8C0e303cc47652D379fe3f0bf2E0bA8da82Ea44c` | part of the first wrap | [0xc80b…c3fb](https://testnet.bscscan.com/tx/0xc80b946e48132d25af525fe412dbd2a0b27425039fed6fb4fd7b299e0012c3fb) |

The deployment ids `b1-v0_1_0`, `b1-v0_1_1` and `b1-v0_2_0` in the contracts repository belong to the former B.1, which is now the privacy-only composition of A.1.

The token's deployment is large because the constructor computes the 24 empty subtrees of the commitment tree on chain (design §3.3).

Read back from the chain after the run below:

| | Value |
| --- | --- |
| `pepModules()` | role issuance (`0x60b2d978`) at the token; Wrapper port (`0x1464bbec`) at `PEPWrapper` |
| `TREE_DEPTH()`, `hasher()`, `verifier()` | 24, and the two addresses above |
| `leafCount()` | 10 (five operations) |
| `totalSupply()` = `balanceOf(token)` | 750 NTS |
| `wrappedOut()` | 200 NTS |
| `issuedSupply()` | 950 NTS |

Admin, minter and regulator admin: the deployer wallet `0xF3c7a7f35f69638e209814b469ad3722Ab60aAb1`. Regulator key: the public key the A.1 tokens use, as key id 0.

### On-chain measurements (contracts `scripts/track-b/variant-1/e2e-notes.ts`, 2026-10-13)

| Operation | gas | Transaction |
| --- | --- | --- |
| Mint 1000 NTS into a note (the first operation on the tree) | 1,830,099 | [0xbf8b…d996](https://testnet.bscscan.com/tx/0xbf8bbb442bbd7ff5df5843382ae100be2a5b24539f189a5193ae655c2cded996) |
| Note transfer, 250 NTS, with change | 1,370,386 | [0x7cc6…6ca6](https://testnet.bscscan.com/tx/0x7cc623749b58c10b40b5e48bdde5e81426f85980f9cfeff8f89dda5dfecf6ca6) |
| Burn 50 NTS | 1,375,768 | [0x0239…b120](https://testnet.bscscan.com/tx/0x0239c434024f6c3a371f31f866f923595f4b57974f0fe6b8ed9b146192b7b120) |
| Wrap 300 NTS (the first wrap: includes creating the wNTS contract) | 1,997,599 | [0xc80b…c3fb](https://testnet.bscscan.com/tx/0xc80b946e48132d25af525fe412dbd2a0b27425039fed6fb4fd7b299e0012c3fb) |
| Unwrap 100 wNTS into a note | 1,414,605 | [0x81ed…2b85](https://testnet.bscscan.com/tx/0x81ed9e564ad64a6ace31d0dc2c8c2883e593d1cad7a521a57824367827492b85) |

- The figures equal the local ones (design §12) to within a few dozen gas.
- The first operation on a fresh tree pays about 455k for the frontier's first writes. A mint on a tree in use costs about 1,375k (measured locally).
- A wrap after the first costs about 1,403k (measured locally).
- Proofs took 2.6 to 3.3 s each in Node.
- After every step the script read the token's history the way the dApp does, from `lastOperationBlock()` backwards through `prevBlock`, rebuilt the tree and compared its root with the chain's. Both wallets found their notes: 450 NTS and 300 NTS at the end.

### Not exercised on chain

- The dApp page `/tracks/b/1` in a browser.
- A regulator view: the regulator memos are on chain, and the tool that decodes them for B.1 is not written.
- Regulator key rotation, and `setWrapper` (the Wrapper was given at deployment).
