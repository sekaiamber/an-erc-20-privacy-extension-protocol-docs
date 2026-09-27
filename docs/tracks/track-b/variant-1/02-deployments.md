English | [中文](02-deployments.zh-cn.md)

# B.1 deployment record

## BSC testnet (chain id 97) — 0.1.1 (current)

Deployed: 2026-09-27 (after the round-1 security review). Deployment id: `b1-v0_1_1-bsc-testnet`. `pep()` = `B:1:0.1.1`. Contract source: contracts `ab723ee`.

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20B1`** (Closed / CLS) | [`0xd53eb8f539153e73Db5532A9281f24f479Fa8e75`](https://testnet.bscscan.com/address/0xd53eb8f539153e73Db5532A9281f24f479Fa8e75) |
| **`PEPWrapper`** | [`0xcAF2c404a7EB33D3EE9f08AEB3Cf9a743c0Abe24`](https://testnet.bscscan.com/address/0xcAF2c404a7EB33D3EE9f08AEB3Cf9a743c0Abe24) |
| `WrappedERC20` wCLS | [`0x6273c1684B281fdFe3252f99B857D6Bb74010Bf2`](https://testnet.bscscan.com/address/0x6273c1684B281fdFe3252f99B857D6Bb74010Bf2) |

Changes from 0.1.0: review fixes B1-F1..F4 ([03-security-review](03-security-review.md)). Live run of the same flow: mint 196,300 · 0x01 715,485 · fold 463,801 · burn 362,387 · wrap (first) 991,115 · unwrap 129,631; balances and `issuedSupply` conservation verified.

## BSC testnet (chain id 97) — 0.1.0 (deprecated: B1-F1 / B1-F2)

Deployed: 2026-09-27. Deployment id: `b1-v0_1_0-bsc-testnet`. `pep()` = `B:1:0.1.0`. Contract source: contracts `56ab57d`.

| Contract | Address |
| --- | --- |
| **`ConfidentialERC20B1`** (Closed / CLS) | [`0x3170a659498a4ee88f1Ea59C3eA769f76Ff83855`](https://testnet.bscscan.com/address/0x3170a659498a4ee88f1Ea59C3eA769f76Ff83855) |
| **`PEPWrapper`** (family tool, one per chain) | [`0xF76615A85583896bDF945B97d6dEf9C73819cC25`](https://testnet.bscscan.com/address/0xF76615A85583896bDF945B97d6dEf9C73819cC25) |
| `WrappedERC20` wCLS (created by the wrapper on first wrap) | [`0x465B2900D86A7c9edBe9Db51A93cf0C72C817bE3`](https://testnet.bscscan.com/address/0x465B2900D86A7c9edBe9Db51A93cf0C72C817bE3) |
| verifiers / window table | A.1 0.3.1's (`a1-v0_3_1-bsc-testnet`), reused by address |

Admin / MINTER / REGULATOR_ADMIN: the deployer wallet. Regulator key: the same key id 0 as the A.1 deployment. No initial mint: issuance is `mint(id, amount)` by the MINTER.

### On-chain measurements (contracts `scripts/track-b/variant-1/e2e-bsc.ts`, 2026-09-27)

| Operation | gas | Transaction |
| --- | --- | --- |
| `mint` 1000 CLS to a fresh id | 176,890 | [0x90ed…7415](https://testnet.bscscan.com/tx/0x90ed4eeb097ed63693521400f441fd2da18f62334212c2d2e816519d18147415) |
| `0x01` 250 CLS (both parties' first) | 715,473 | [0xee03…4c28](https://testnet.bscscan.com/tx/0xee03ac7f2916c1808ee30f57027c1ed938f55c949f09e9d717ce4780f3d44c28) |
| `0x80` fold (recipient's first operation) | 463,813 | [0x7a5b…00b2](https://testnet.bscscan.com/tx/0x7a5b8e9de1a02897efb46301d2dad48b0f353c0458615ba5b675d8b379cf00b2) |
| `0x81` direct burn 50 CLS | 362,423 | [0xd737…7123](https://testnet.bscscan.com/tx/0xd737d04f10b26c71d510c4cb7fce360e40e800b777cea17d9510471d4bb7f123) |
| `wrap` 300 CLS → wCLS (**first wrap: includes creating the wCLS contract**) | 967,012 | [0x536f…9e64](https://testnet.bscscan.com/tx/0x536f1fa2aa8dd861aa45c98eef20a95c15411d73e06cdecaaf19694cdf3f9e64) |
| wCLS `transfer` (plain ERC-20) | 26,570 | — |
| `unwrap` 100 wCLS → confidential id | 124,655 | [0x9f27…5b2c](https://testnet.bscscan.com/tx/0x9f2751096d8f68fbe4a903ff4bd8556b42ad03a6d98e6d55050c97cf0fcf5b2c) |

Proving (Node): transfer 2.05 s, fold 0.28 s, burn / wrap 0.9–1.0 s (the A.1 circuits, unchanged). All decrypted balances matched the expected plaintexts; after the run `B1.totalSupply() + wCLS.totalSupply()` equalled issued − burned (2,000 − 50: the run before it had minted 1,000 to another id).

Steady-state expectations: a second `wrap` on the same token skips the wCLS creation (≈ 560k less, i.e. burn cost + one ERC-20 mint ≈ 410k); `mint` to an id that already has a non-zero slot ≈ 155k.

## Notes

- `balanceOf` returns 0 for every address; explorers show a supply with no holders. That is the Track B contract.
- The A.1 security review applies to everything B.1 reuses (circuits, ledger logic, F1–F14). B.1-specific review (wrapper gating, burn paths) is pending.
