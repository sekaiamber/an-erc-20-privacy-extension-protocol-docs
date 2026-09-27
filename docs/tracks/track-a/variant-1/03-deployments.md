English | [中文](03-deployments.zh-cn.md)

# A.1 Deployment Record

## BSC testnet (chain id 97) — 0.3.1 (current)

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
