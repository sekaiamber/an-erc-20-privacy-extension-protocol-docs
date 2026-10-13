English | [中文](03-deployments.zh-cn.md)

# A.1 Deployment Record

## BSC testnet (chain id 97) — 0.6.0 (current)

Deployed: 2026-10-13. `casata()` = `A:1:0.6.0` for both tokens; they are told apart by `casataModules()`. Contract source: contracts `a2c0ae0`. The circuits and proving keys are those of 0.4.0, unchanged.

| Composition | Deployment id | Contract | Address | Deployment gas | Transaction |
| --- | --- | --- | --- | --- | --- |
| With the public ledger | `a1-v0_6_0-ledger-bsc-testnet` | **`A1LedgerToken`** (Test / TEST) | [`0x9DC3A5864016924A0CCb598dcF60F5E7eFBAA327`](https://testnet.bscscan.com/address/0x9DC3A5864016924A0CCb598dcF60F5E7eFBAA327) | 5,430,530 | [0xbf99…4623](https://testnet.bscscan.com/tx/0xbf991c3008f3ebbeead63a5eb729189ded95c73c9d41cda84854886846424623) |
| Privacy-only | `a1-v0_6_0-private-bsc-testnet` | **`A1PrivateToken`** (Closed / CLS) | [`0xbb818064790B9d4942f5662DACA1FEc61a6F9a20`](https://testnet.bscscan.com/address/0xbb818064790B9d4942f5662DACA1FEc61a6F9a20) | 5,560,694 | [0x32d1…1065](https://testnet.bscscan.com/tx/0x32d10c112b953423e36521ebb4e3659c711a57b74efd3467af7844dfb5e41065) |

| Shared contract | Address | Deployment gas |
| --- | --- | --- |
| `TransferVerifier` | `0xa4f6deE18d7Aa3441CB7c84d76ce65343ED7d1b1` | 764,973 |
| `UnshieldVerifier` | `0x2d4a51dBa1E71c233cDEF84EC7ddC24CB7D5621a` | 500,764 |
| `FoldVerifier` | `0x487A1bF4D113228165330514A0f7a86e7797a456` | 331,714 |
| `G8Table` | `0xa60B4926f64203dba5Bb8310245F23e128901E51` | 2,745,934 |
| The family Wrapper (plugged into the privacy-only token's port; already on the chain, deployed as `PEPWrapper`) | `0xfA04051c4cC38e439f871cBfA179424a257c5455` | n/a |

The verifiers and the table were deployed again with the ledger token and are reused by the privacy-only token. They are the same code as in the 0.5.0 deployment; reusing those would have worked as well.

Read back from the chain after the runs below:

| | `A1LedgerToken` | `A1PrivateToken` |
| --- | --- | --- |
| `casataModules()` | public ledger (`0x43dcbbd9`) and role issuance (`0x40c10f19`), both at the token | role issuance (`0x40c10f19`) at the token; Wrapper port (`0x1464bbec`) at the Wrapper |
| `totalSupply()` | 1,000,000 TEST (the initial public mint) | 750 CLS |
| `shieldedSupply()` / `wrappedOut()` | 95 TEST | 200 CLS |

Admin, minter and regulator admin: the deployer wallet. Regulator key: the same key id 0 as before. The initial public mint is a `mint` without a payload ([0xe904…99fd](https://testnet.bscscan.com/tx/0xe9047e256007837a9db55f6b2380d44ec4aa6f4e95304263c9a46ffab85199fd), 70,714 gas).

### On-chain measurements, 0.6.0, `A1PrivateToken` (contracts `scripts/track-a/variant-1/e2e-private-bsc.ts`, 2026-10-13)

| Operation | gas | 0.5.0 on chain | Transaction |
| --- | --- | --- | --- |
| `mint` + payload `0x82`, 1000 CLS to a fresh id | 196,603 | 196,372 | [0x91d8…24c9](https://testnet.bscscan.com/tx/0x91d8f4b1aacf3278c04098d604a5a9ab0637a4dabfb20fa21c0aa5762ca224c9) |
| `0x01` 250 CLS (both parties' first) | 705,427 | 705,873 | [0xc35f…57a7](https://testnet.bscscan.com/tx/0xc35f359c38e0ae04db490391bd5027e9b9e54d6df1599faa0815e15e864c57a7) |
| `fold` (recipient's first operation) | 462,787 | 463,769 | [0x8f88…2db6](https://testnet.bscscan.com/tx/0x8f882b349e2392d08bb61bc2958e673d19f58809ed946b0e06dcff137e702db6) |
| `0x81` direct burn 50 CLS | 362,469 | 362,553 | [0xe203…72fc](https://testnet.bscscan.com/tx/0xe20355b9f868d07e380400e033d604c882882d22f9c4fe3833971c42371072fc) |
| `wrap` 300 CLS (first wrap: includes creating the wCLS contract) | 989,663 | 989,584 | [0xea54…21ff](https://testnet.bscscan.com/tx/0xea5418f9f15c8147f0d5a5c5785beb5511ab253b9430e6780efdd334bd0a21ff) |
| wCLS `transfer` (plain ERC-20) | 26,570 | 26,570 | not recorded |
| `unwrap` 100 wCLS into a confidential id | 129,614 | 129,703 | [0x650c…0c8b](https://testnet.bscscan.com/tx/0x650c81c64f587263c7d81ffb27ac04eef6c395a85fe28733d875d6a575650c8b) |

Proving (Node): transfer 2.63 s, fold 0.46 s, burn and wrap about 1.2 s. Every decrypted balance matched the expected plaintext. After the run, `totalSupply()` 750 plus wCLS `totalSupply()` 200 equals issued 1000 minus burned 50. The wrapped token created by this run is wCLS at `0x937bd3D71B513EbbB52c63FB7d2F9fF3CE3051D6`.

### On-chain measurements, 0.6.0, `A1LedgerToken` (dApp client library, `dapp/scripts/e2e-bsc.mts`, 2026-10-13)

| Operation | gas | 0.5.0 on chain | Transaction |
| --- | --- | --- | --- |
| `0x03` shield 100 TEST (recipient's first receipt) | 214,634 | 214,568 | [0x88a8…d37c](https://testnet.bscscan.com/tx/0x88a8012c99183b999c3f3e6aa6c2a65c6ff38d1ba10bc73f4e967d20f3d6d37c) |
| `0x01` confidential transfer 12.5 TEST (both parties' first) | 705,566 | 705,880 | [0x8861…6327](https://testnet.bscscan.com/tx/0x8861a8d5e5bc0680efd8cfb7049c33650625bbef8d051118c86b16a31b656327) |
| `fold` (recipient's first operation, relayed) | 462,660 | 463,882 | [0xf370…fa47](https://testnet.bscscan.com/tx/0xf37053413d9d00c14716c67a0b351f0179681a3c76f3b300c0116c11d6e5fa47) |
| `0x04` unshield 5 TEST (default mode after the fold, relayed) | 373,875 | 373,871 | [0x1b68…250d](https://testnet.bscscan.com/tx/0x1b68fd7f6623f76d0f97391736876db77c403e0505ce09c0df1072b6717d250d) |

Proving (Node): transfer 1.84 s, fold 0.38 s, unshield 1.39 s. The recipient's memo opened to 12.5 and matched the ciphertext; after the run the wallet's public balance is down by 95 and `shieldedSupply()` is 95.

**Not run on chain for 0.6.0**: a `mint` to a confidential id and the `0x81` burn on `A1LedgerToken` (covered by the local tests only), and the dApp pages in a browser.

## BSC testnet (chain id 97) — 0.5.0 (superseded by 0.6.0)

Deployed: 2026-10-13. `pep()` = `A:1:0.5.0` for both tokens; they are told apart by `pepModules()`. Contract source: contracts `3414e24`.

| Composition | Deployment id | Contract | Address |
| --- | --- | --- | --- |
| With the public ledger | `a1-v0_5_0-ledger-bsc-testnet` | **`A1LedgerToken`** (Test / TEST) | [`0x6CA39A8b9Dd09162E99614D4386B897c88d38ccf`](https://testnet.bscscan.com/address/0x6CA39A8b9Dd09162E99614D4386B897c88d38ccf) |
| Privacy-only | `a1-v0_5_0-private-bsc-testnet` | **`A1PrivateToken`** (Closed / CLS) | [`0x5F855e2221E9eBf854c3374149dF31298fF608B0`](https://testnet.bscscan.com/address/0x5F855e2221E9eBf854c3374149dF31298fF608B0) |

| Shared contract | Address |
| --- | --- |
| `TransferVerifier` | `0xE6c4717933F803b405f79c5AAa284e23Ac1ee189` |
| `UnshieldVerifier` | `0xEC9D20d244866dD9863F0FDFCA0127DD16A7873C` |
| `FoldVerifier` | `0xC26Bb79C880dddA2fC0cd22848beF2458CbEAb70` |
| `G8Table` | `0x53d2d59F7EEc575A214e1B2cB2413EcE26506A9A` |
| `PEPWrapper` (plugged into the privacy-only token's port; deployed with the former B.1 0.2.0) | `0xfA04051c4cC38e439f871cBfA179424a257c5455` |

The verifiers and the table were deployed with the ledger token and are reused by the privacy-only token. The circuits are those of 0.4.0, unchanged.

Read back from the chain after deployment:

| | `A1LedgerToken` | `A1PrivateToken` |
| --- | --- | --- |
| `pepModules()` | public ledger (`0x43dcbbd9`) and role issuance (`0x60b2d978`), both at the token | role issuance (`0x60b2d978`) at the token; Wrapper port (`0x1464bbec`) at `PEPWrapper` |
| `totalSupply()` | 1,000,000 TEST (the initial public mint) | 0 |
| `shieldedSupply()` / `wrappedOut()` | 0 | 0 |

Admin, minter and regulator admin: the deployer wallet. Regulator key: the same key id 0 as the 0.4.0 deployment.

### On-chain measurements, `A1PrivateToken` (contracts `scripts/track-a/variant-1/e2e-private-bsc.ts`, 2026-10-13)

| Operation | gas | Transaction |
| --- | --- | --- |
| `mintConfidential` 1000 CLS to a fresh id | 196,372 | [0x203a…7e83](https://testnet.bscscan.com/tx/0x203a7aa03de25e696f71a22c34f32bc9b0cd22447df3f435da9bb4ed640b7e83) |
| `0x01` 250 CLS (both parties' first) | 705,873 | [0x5578…2c62](https://testnet.bscscan.com/tx/0x5578642b080f4b831e35dc7ec8f2181cd668fd4ede8f1b81e766dd2b279d2c62) |
| `0x80` fold (recipient's first operation) | 463,769 | [0x815f…f1dd](https://testnet.bscscan.com/tx/0x815f0f0c45d562778cc6bfb3781bc93a63995b2ea71709e08b03c39bcb04f1dd) |
| `0x81` direct burn 50 CLS | 362,553 | [0x42f4…5157](https://testnet.bscscan.com/tx/0x42f4256990565ff4b2ea4d17ce5344349bd7f140906f88ed33109841209a5157) |
| `wrap` 300 CLS (first wrap: includes creating the wCLS contract) | 989,584 | [0x781e…7d8d](https://testnet.bscscan.com/tx/0x781e524d8ae5e1bd53a3c3067f6fc4adc08a74c06a7d4003790bcf492e487d8d) |
| wCLS `transfer` (plain ERC-20) | 26,570 | not recorded |
| `unwrap` 100 wCLS into a confidential id | 129,703 | [0x2945…052d](https://testnet.bscscan.com/tx/0x2945f2daceadfe82d8debfe5c04c7088e541d53ad2f16ec6bb2fd7310fb2052d) |

Proving (Node): transfer 1.53 s, fold 0.39 s, burn and wrap 1.0 to 1.2 s. Every decrypted balance matched the expected plaintext. After the run, `totalSupply()` 750 plus wCLS `totalSupply()` 200 equals issued 1000 minus burned 50. The wrapped token created by this run is wCLS at `0xBC980A0ab8aF1bEf495e55b4106A55A5F9f28eBB`.

### On-chain measurements, `A1LedgerToken` (dApp client library, `dapp/scripts/e2e-bsc.mts`, 2026-10-13)

| Operation | gas | 0.4.0 on chain | Transaction |
| --- | --- | --- | --- |
| `0x03` shield 100 TEST (recipient's first receipt) | 214,568 | 214,534 | [0x8f2a…f1b5](https://testnet.bscscan.com/tx/0x8f2a586749ab874a190956fa033aaac027d6961f45576abbeba438195cc2f1b5) |
| `0x01` confidential transfer 12.5 TEST (both parties' first) | 705,880 | 705,970 | [0xc81f…9eb9](https://testnet.bscscan.com/tx/0xc81f1e9366d49b4ef9d3eb15f542e33442fb16fc83676ca94c52d7252f139eb9) |
| `0x80` pure fold (recipient's first operation, relayed) | 463,882 | 463,871 | [0x6cee…3dcf](https://testnet.bscscan.com/tx/0x6cee7217d3e99758c473e35e886e50ddfbe55a2de577e5fc43b7f357d07e3dcf) |
| `0x04` unshield 5 TEST (default mode after the fold, relayed) | 373,871 | 373,589 | [0xc281…6712](https://testnet.bscscan.com/tx/0xc281cb7b4e18e7d70c1db866665a93e0b8cdb0f45cd941c5de3c4d799a9c6712) |

Proving (Node): transfer 1.77 s, fold 0.44 s, unshield 1.39 s. The recipient's memo opened to 12.5 and matched the ciphertext; after the run the wallet's public balance is down by 95 and `shieldedSupply()` is 95.

**Not run on chain**: `mintConfidential` and the `0x81` burn on `A1LedgerToken`, which are new to this composition. They are covered by the local tests only (04-modules §10).

Change from 0.4.0 and from the former B.1 0.2.0: the two standalone contracts became one core plus modules ([04-modules §9](04-modules.md)). **The 0.4.0 token below and the former B.1 0.2.0 token are no longer opened by the dApp.** They remain on chain.

## BSC testnet (chain id 97) — 0.4.0 (superseded by 0.5.0)

Deployed: 2026-09-28. Deployment id: `a1-v0_4_0-bsc-testnet`. `pep()` = `A:1:0.4.0`. Contract source: contracts `c518c1c`.

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x61035537DF2aac1CC21f9F56958938954786836c`](https://testnet.bscscan.com/address/0x61035537DF2aac1CC21f9F56958938954786836c) |
| `TransferVerifier` (14 public inputs, new circuit) | `0x48A7CEbfdD43d5C9f10691609A8ec182f4DB53ed` |
| `UnshieldVerifier` (new circuit) | `0x591046c256Dd0Bea8e365a0bd388139eaDdAE0A1` |
| `FoldVerifier` (new circuit) | `0xfB6c2380D764c1BC88C015294b74bcf84a7E3014` |
| `G8Table` | `0xE8282e0E03f052b7c25b56Bda6Ef6a8D3C7A2B2C` |

Change from 0.3.1: the crypto core is plain ElGamal (01-design 0.4.0 changelog). All three circuits were rebuilt; **0.3.1 and earlier instances use an incompatible key convention and payload layout and are deprecated.**

### On-chain measurements (dapp client library, 2026-09-28)

| Operation | gas | Transaction |
| --- | --- | --- |
| `0x03` shield 100 TEST (recipient's first receipt) | 214,534 | [0xc1cd…9466](https://testnet.bscscan.com/tx/0xc1cdac2bb0f431b5dd15cd20df41233b7b74fe039e1777ba64e3813950e09466) |
| `0x01` confidential transfer 12.5 TEST (both parties' first) | 705,970 | [0x7f57…6d94](https://testnet.bscscan.com/tx/0x7f574bc77d7c1594268bfd911a0c80c116fcb8d042acbb23930cd6db36396d94) |
| `0x80` pure fold (recipient's first operation) | 463,871 | [0xf980…4f49](https://testnet.bscscan.com/tx/0xf980be3b2ddc0a7d5cbbc4827ece11e33985a4ae4340713f008de85b25334f49) |
| `0x04` unshield 5 TEST (default mode after the fold, relayed) | 373,589 | [0x2655…ded0](https://testnet.bscscan.com/tx/0x2655fffa5e462946ffd48a4a2706976a8e5b58acbd132a8ded68da0cb9b5ded0) |

Proving (Node): transfer **1.53 s** (0.3.1: 2.1 s), fold 0.34 s, unshield 1.04 s. `0x01` costs about 9.6k gas less than 0.3.1 (one public input and 64 payload bytes fewer).

## BSC testnet (chain id 97) — 0.3.1 (deprecated: key convention and payload layout changed)

Deployed: 2026-09-27. Deployment id: `a1-v0_3_1-bsc-testnet`. `pep()` = `A:1:0.3.1`. Contract source: contracts `3563f29`

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x2f2bDD5772E8F765F12B05268356558E95cFeD3c`](https://testnet.bscscan.com/address/0x2f2bDD5772E8F765F12B05268356558E95cFeD3c) |
| `TransferVerifier` | `0x1154910e4CDfCb20D89D285FaaBbe2aaE5a70fE9` |
| `UnshieldVerifier` | `0xb856aCD391459b1B4143b7FB31ce8ff9B8dfb213` (new circuit) |
| `FoldVerifier` | `0x13f41DA46756d665AB09d1A06367aFc8Ba3dEFa1` |
| `G8Table` | `0xB4e749938Ed451f38BF175D9584993bb4AF55D82` |

The only change from 0.3.0 is security fix F14 (the unshield recipient is bound into the proof). **The 0.3.0 instance is vulnerable to front-running theft of unshields and is deprecated.**

### On-chain measurements (dapp client library, 2026-09-27)

| Operation | gas | Transaction |
| --- | --- | --- |
| `0x03` shield 100 TEST (recipient's first receipt) | 214,534 | [0xff14…e720](https://testnet.bscscan.com/tx/0xff1452111fc2d7e2366d0bc8858da8cc22e2dadc4223dd7a7247cbd03acfe720) |
| `0x01` confidential transfer 12.5 TEST (both parties' first) | 715,555 | [0x6018…26b0](https://testnet.bscscan.com/tx/0x60189a36614e2c4af775e48c181892fd46d331a42723774cc31cb31c45f726b0) |
| `0x80` pure fold (recipient's first operation) | 463,918 | [0x8e3d…c9cf](https://testnet.bscscan.com/tx/0x8e3d8689caeb83ada75475d9bdc2db0b5c0ddaa53ec6708a82fb63799cfc6c9f) |
| `0x04` unshield 5 TEST (default mode after the fold, relayed, recipient bound) | 373,642 | [0xd745…23a7](https://testnet.bscscan.com/tx/0xd74552cf032aa71d687b81de9ebc5e4d95aa3d2f556ac977306e9d4352f923a7) |

Proving (Node): transfer 2.12 s, fold 0.25 s, unshield 1.02 s. Binding `to` has no visible gas impact (+103).

## BSC testnet (chain id 97) — 0.3.0 (deprecated: F14 vulnerability)

Deployment date: 2026-09-26. deployment id: `a1-v0_3_0-bsc-testnet`. `pep()` = `A:1:0.3.0`. Contract source: contracts `fb3505f`.

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x7748d19a13B8C0b49a6815D5c8B43Aa9cA473eAa`](https://testnet.bscscan.com/address/0x7748d19a13B8C0b49a6815D5c8B43Aa9cA473eAa) |
| `TransferVerifier` | `0xe08B4669B544c2101BC2C97bb01D5Fa352EEeA07` |
| `UnshieldVerifier` | `0x2e621C4177075623A15Bfa4078416DA4366b6AAA` |
| `FoldVerifier` | `0x88e065fFa3f570bA36ff437853028236E15AC3a9` |
| `G8Table` | `0x5f4eEb3B3288012287555962C27178eA6Ce7568f` |

Relative to 0.2.5: adds the `0x80` pure fold (FoldVerifier) and `lastReceivedAtBlock`, `confidentialAccountOf` returns 6 values, and the constructor takes one more verifier address. Parameters unchanged.

### On-chain measurements (dapp client library, 2026-09-26)

| Operation | gas | Transaction |
| --- | --- | --- |
| `0x03` shield 100 TEST (recipient's first time) | 214,534 | [0x2edc…0ed0](https://testnet.bscscan.com/tx/0x2edc639da406a5847ee1302451d6e9532a469d3ac4ad59d3594ee20844ab0ed0) |
| `0x01` confidential transfer 12.5 TEST (payer's first spend, `includePending`; recipient's first time) | 715,531 | [0xa708…e261](https://testnet.bscscan.com/tx/0xa7089714eb525f0e6ad215dc184547aeefaf2943ca738b139f310d860f9de261) |
| `0x80` pure fold (recipient's first operation, relayer-submitted, no decryptable) | 463,906 | [0xf1e9…eb35](https://testnet.bscscan.com/tx/0xf1e96810789abde251d0b44fa6364b2dfae3986d191b986c3cdd0423fbeb5d35) |
| `0x04` unshield 5 TEST (default mode after fold, relayer-submitted) | 373,539 | [0x2ad2…2aab](https://testnet.bscscan.com/tx/0x2ad20640838a1b3040fc6b74794aefbb1ab3acd7e7ca3d78d85c5fdcbf532aab) |

Proof generation (Node): transfer 2.08 s, fold 0.26 s, unshield 0.98 s.

Notes on the readings:
- The first shield costs about 22k more than 0.2.5: `lastReceivedAtBlock` shares a slot with `nonce` / `foldedAtBlock`, and the recipient's first receipt writes that slot from zero (22.1k); every subsequent receipt is only a 2.9k warm write. That account's first spend / fold therefore saves one cold write, so `0x01` is only 5k more overall.
- The bulk of the 464k first fold is the cold writes of `available` (4 slots) and `folded` (4 slots), about 177k, plus Groth16 verification, about 200k; a steady-state fold is about 250k.
- The unshield after the fold uses default mode (binding only `available`), 192k less than the 566k of 0.2.5.
- On-chain `foldedAtBlock` and `lastReceivedAtBlock` both equal the block number of the corresponding transaction; pending is zeroed and the decrypted available equals the memo amount.

## BSC testnet (chain id 97) — 0.2.5 (deprecated)

Deployment date: 2026-09-26. deployment id: `a1-v0_2_5-bsc-testnet`. `pep()` = `A:1:0.2.5`. Contract source: contracts `f70c32b`.

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0x0d2c14251BB166fB1C53805731834F63249CaC5f`](https://testnet.bscscan.com/address/0x0d2c14251BB166fB1C53805731834F63249CaC5f) |
| `TransferVerifier` | `0x0B637450B0b26B5E416908593b1b2666081430Dd` |
| `UnshieldVerifier` | `0x900e162f977296990798667C4C8BE42F63Bc3B0b` |
| `G8Table` | `0xF440fEd8857ff9b4e95d8b7e484FE11A4A1613d1` |

The only contract change relative to 0.2.4: the account gains `foldedAtBlock` (01-design §4.3), and `confidentialAccountOf` returns one more value. Parameters unchanged (Test / TEST, 1,000,000 initial mint to the deployer account, the same regulator public key id 0). The verifier and window-table bytecode did not change, but a new copy was deployed under the new deployment id.

### On-chain measurements (dapp client library, 2026-09-26)

| Operation | gas | Transaction |
| --- | --- | --- |
| `0x03` shield 100 TEST (recipient not first time) | 103,795 | [0x6598…4ef4f](https://testnet.bscscan.com/tx/0x659835333d929bd3a9f11d41208df50c13a225af0989d1e4623b74f27bb4ef4f) |
| `0x01` confidential transfer 12.5 TEST (payer's first spend, `includePending`) | 710,511 | [0x4891…d92](https://testnet.bscscan.com/tx/0x48910a2bcb199ba01662e8e661194ba1df7c459c1efaaa4f2466696ab77b3d92) |
| `0x04` unshield 5 TEST (relayer-submitted) | 565,982 | [0x7468…2ec](https://testnet.bscscan.com/tx/0x74687f42758d49a45b94cf2f44b7f969ccb704a83259a9f1868dd016368162ec) |

On par with 0.2.4 (`foldedAtBlock` shares a slot with `nonce`, no extra write). After the spend, on-chain `foldedAtBlock` equals the block containing that transaction (133237427), nonce 1. The first shield to an already existing account is 103,795 (the 192,378 recorded for 0.2.4 was the recipient's first time, a cold write).

Also observed: `bsc-testnet-rpc.publicnode.com` is load-balanced; an `eth_getLogs` issued immediately after the transaction receipt returns may land on a node that has not yet indexed that block and return empty; retrying after a few seconds succeeds. The dapp polls every 15 s, which naturally covers this; the e2e script added retries.

## BSC testnet — 0.2.4 (deprecated)

Deployment date: 2026-09-25. deployment id: `a1-v0_2_4-bsc-testnet`. Carries the `pep()` descriptor `A:1:0.2.4`. Contract source: contracts `41b9df8`.

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20A1`** | [`0xEb12e2963A983A1A9E98c0eCf89f1D704F19BB7b`](https://testnet.bscscan.com/address/0xEb12e2963A983A1A9E98c0eCf89f1D704F19BB7b) |
| `TransferVerifier` | `0x491cE73B121215F5764E527FDA006a3F488b5096` |
| `UnshieldVerifier` | `0x9Be4b1dB9C5B1bCF490f61e32e29f621426b5C47` |
| `G8Table` | `0xE962438d2CcC4010F3Fcfa56C1Fd62F018C0bcf8` |

Parameters identical to 0.2.3 (Test / TEST, 1,000,000 initial mint to the deployer account, the same regulator public key id 0). The addresses are also exported in `contracts/exports/deployments.json`.

### On-chain measurements (dapp client library, 2026-09-25)

| Operation | gas | Transaction |
| --- | --- | --- |
| `0x03` shield 100 TEST (recipient's first time) | 192,378 | [0x96a5…a0fe](https://testnet.bscscan.com/tx/0x96a560e54288fe0884cab0ff8798e93bcc70073e2136a0257054af572abca0fe) |
| `0x01` confidential transfer 12.5 TEST (payer's first spend, `includePending`) | 710,479 | [0x9e91…12c38](https://testnet.bscscan.com/tx/0x9e91ce6a1651f4f630ff9e6c041a089f4acfb8699ec0d196b34487078e412c38) |
| `0x04` unshield 5 TEST (submitted on the recipient's behalf by the deployer wallet; the recipient has no Ethereum account) | 565,986 | [0xb4e9…ca08](https://testnet.bscscan.com/tx/0xb4e9be1dee8d847d0a6291a80f6b9d639bfb4624628d98383a5673824939ca08) |

Proof generation (Node, M-series): transfer 2.27 s, unshield 1.17 s. The recipient decoded 12.5 from the event memo and it reconciled with the ciphertext; the wallet's public balance changed by −95, `shieldedSupply` 95. Consistent with local estimates.

### Log history limits of public RPCs (measured 2026-09-26)

The recipient's reconstruction of the pending balance relies on `eth_getLogs` to read the `ConfidentialTransfer` / `LedgerCrossing` events under its own name. Public RPCs impose hard limits on this:

| RPC | `eth_getLogs` behavior |
| --- | --- |
| `bsc-testnet-rpc.publicnode.com` (dapp default) | Keeps logs only for roughly the most recent 90,000 blocks; earlier ranges return `-32701 History has been pruned` |
| `bsc-testnet-dataseed.bnbchain.org` / `data-seed-prebsc-1-s1.bnbchain.org` | Returns `-32005 limit exceeded` even for a 1,000-block range |

The dapp's countermeasure (0.3.0 dapp): the window is `[foldedAtBlock, lastReceivedAtBlock]`, and the page keeps a scan cursor in memory. Each refresh only scans forward for new receipts; it only extends backward from newest to oldest when pending is not yet reconciled, with at most `NEXT_PUBLIC_LOG_MAX_CHUNKS` requests per round. When the known span exceeds one round's budget it does not scan automatically; the user advances round by round by clicking "scan one more round" or switches to local decryption. If the RPC refuses, the scan is truncated and marked as such. Available is unaffected (it comes from the on-chain `decryptable` copy); only pending receipts outside the window cannot be reconciled. To see earlier receipts, switch to a node that retains full history.

From 0.2.5 the window is exactly `[foldedAtBlock, latest]`, and the dapp adds a boundary: when the window span exceeds `NEXT_PUBLIC_LOG_CHUNK_BLOCKS × NEXT_PUBLIC_LOG_MAX_CHUNKS` (default 5,000 × 10) it does not scan, and instead prompts the owner to **locally decrypt the pending total** (first decrypt `pending·G` with their own key, then solve the discrete log in `[0, 2^bits)` with a parallel kangaroo; pure BigInt JS at about 5 µs/step, a 2^40 range takes about 20–30 s, yielding only the total with no per-transfer breakdown) or to force a scan. Only the holder of the account's private key can do this step, so it is not an attack surface (the security boundary remains the 251-bit `r`). This is also the inherent cost of the A.1 design "the recipient learns pending details from event memos rather than on-chain state", see 01-design §4.3.

## BSC testnet — 0.2.3 (deprecated, no `pep()`)

Deployment date: 2026-09-25. Ignition deployment id: `a1-bsc-testnet`. Record: `contracts/ignition/deployments/a1-bsc-testnet/`.

| Contract | Address |
| --- | --- |
| `ConfidentialERC20A1` (Test / TEST, 6 decimals) | [`0x2D9a837496f39a2725c6dA01C2DAaEBa74498D07`](https://testnet.bscscan.com/address/0x2D9a837496f39a2725c6dA01C2DAaEBa74498D07) |
| `TransferVerifier` (15 public inputs) | [`0x012aF1857622Ef9830F0cB7542bDe9DB9b8e234E`](https://testnet.bscscan.com/address/0x012aF1857622Ef9830F0cB7542bDe9DB9b8e234E) |
| `UnshieldVerifier` (7 public inputs) | [`0x816d01AaBa30d910960D9fe1CA2F6bF2EEF153a2`](https://testnet.bscscan.com/address/0x816d01AaBa30d910960D9fe1CA2F6bF2EEF153a2) |
| `G8Table` (12,288-byte window table) | [`0xe3Eb1f1D0E9e06529e6DeC0859c0c479c978511E`](https://testnet.bscscan.com/address/0xe3Eb1f1D0E9e06529e6DeC0859c0c479c978511E) |

| Item | Value |
| --- | --- |
| Deployer account / admin (MINTER, REGULATOR_ADMIN) | `0xF3c7a7f35f69638e209814b469ad3722Ab60aAb1` |
| Initial mint | 1,000,000 TEST to the deployer account |
| Regulator public key id | 0 (public key in `contracts/ignition/params/a1.json`, private key offline) |
| Circuits / trusted setup | `transfer.circom` 35,137 constraints, `unshield.circom` 16,622 constraints; **local development ptau, not a real ceremony, for testing only** |
| Contract source | contracts `8f3498a` |
| BscScan verification | Not done (no API key configured) |

The dapp's `NEXT_PUBLIC_TOKEN_ADDRESS` points to the 0.3.0 address. The 0.2.4 instance is still on-chain, but the dapp's reads of its accounts fail because of the differing ABI (number of return values of `confidentialAccountOf`).
