English | [中文](README.zh-cn.md)

# A.1: ElGamal encrypted accounts + Groth16

Version: `0.8.0` (designed, not implemented: amounts below `2¹²⁸` and decimals chosen at deployment, [ADR-0014](../../../adr/0014-eighteen-decimals.md); 04-modules §9.3). `0.7.0` (implemented and deployed on BSC testnet on 2026-10-15; [ADR-0013](../../../adr/0013-mintable.md), [A1-0007](../../../adr/a1-0007-exit-kind-binding.md)). `0.6.0` stays deployed since 2026-10-13 (core plus modules, [ADR-0008](../../../adr/0008-modules.md)). Status: `Draft`.

0.7.0 is implemented as eight generated contracts, one per subset of the modules; its two reference tokens, `A1LedgerToken` and `A1PrivateToken`, were deployed on BSC testnet on 2026-10-15, beside the 0.6.0 ones of 2026-10-13 ([03-deployments](03-deployments.md)). The two standalone contracts that predate the module structure, `ConfidentialERC20A1` 0.4.0 and `ConfidentialERC20B1` 0.2.0, remain on chain and are no longer opened by the dApp.

## In one sentence

A confidential account is a Baby Jubjub public key. Only the hash of the key, the account id, appears on chain; the key itself never does. The balance is an ElGamal ciphertext. Spending is authorised by a zero-knowledge proof that also guarantees conservation and non-negativity, and every confidential transfer encrypts the amount to the regulator key as well. Payers and recipients appear as stable pseudonyms; amounts and balances are hidden.

## Structure

| Part | What it is | Specified in |
| --- | --- | --- |
| **Core** | The privacy-only ledger: accounts, the initial issuance, `0x01` transfer, `fold`, the `0x81` burn, regulator key, the three circuits | [01-design.md](01-design.md); initial issuance and burn in [04-modules.md](04-modules.md) §3 and §4.0 |
| **Public ledger** (module) | Standard ERC-20 balances at the token's address; `0x03` shield, `0x04` unshield | [04-modules.md](04-modules.md) §4.1; flows in 01-design §4.1 and §4.4 |
| **Mintable** (module) | Issuance after deployment by a role, with public amounts. Named role issuance up to 0.6.0, when it also carried the burn | [04-modules.md](04-modules.md) §4.2 |
| **Wrapper port** (module) | `ICasataWrappable` for the family Wrapper or the family gateway ([14](../../../14-gateway.md)) | [04-modules.md](04-modules.md) §4.3 |

A.1 0.7.0 declares support for exactly these three modules, as 0.5.0 and 0.6.0 did; a module registered later needs a new A.1 version (07 §13.2). Every subset of them is a token from 0.7.0: the core alone is a fixed-supply privacy token.

How the parts combine, how supply is accounted for across them, and what each version changes: [04-modules.md](04-modules.md).

## Compositions

Shipped in 0.6.0. 0.7.0 makes all eight subsets of the modules tokens; it ships one generated contract per subset (04-modules §6, M10).

| Composition | Modules | Deployed as | Records |
| --- | --- | --- | --- |
| With the public ledger | Public ledger, role issuance (Mintable from 0.7.0) | `A1LedgerToken`, `A:1:0.6.0` | [02-security-review.md](02-security-review.md), [03-deployments.md](03-deployments.md) |
| Privacy-only | Role issuance (Mintable from 0.7.0), Wrapper port | `A1PrivateToken`, `A:1:0.6.0` | [03-deployments.md](03-deployments.md); for the standalone contract before 0.5.0: [variant-1-privacy-only](../variant-1-privacy-only/README.md) |

## Privacy evaluation (family conventions §12)

| Goal | Achieved | Notes |
| --- | --- | --- |
| P1 Amount hiding | Full for `0x01` | Amounts of the initial issuance, mint, burn, shield, unshield, wrap and unwrap are public |
| P2 Recipient | Pseudonymous | A stable id; the key behind it is never on chain |
| P3 Sender | Pseudonymous | As P2 |
| P4 Transaction linkability | Linkable | All activity of an id is linked. The reserved `0x02` one-time id would unlink receipts only |
| P5 Ledger-crossing linkability | Depends on the modules | With the public ledger every `0x03` / `0x04` is a public edge between a wallet and an id. Privacy-only: only an issuance to an id, a wrap or an unwrap is, and with the gateway a deposit or a withdrawal |
| S1–S5 | Satisfied | Range and balance proofs; nonce and single-writer ciphertexts; spending needs the key; the public ledger is unmodified ERC-20; no freeze or seizure interface |

## Documents

| Document | Contents |
| --- | --- |
| [01-design.md](01-design.md) | The core in detail: parameters, accounts and state, payload, flows, circuits, events, client flows, gas |
| [04-modules.md](04-modules.md) | Modules and compositions: primitives, supply accounting, each module, ERC-20 surface per composition, probe, what changes at 0.5.0, 0.6.0, 0.7.0 and 0.8.0 |
| [02-security-review.md](02-security-review.md) | Round-one security self-review of the composition with the public ledger |
| [03-deployments.md](03-deployments.md) | Deployment record (BSC testnet): both compositions from 0.5.0, the composition with the public ledger before it |
| [variant-1-privacy-only](../variant-1-privacy-only/README.md) | Records of the privacy-only composition under its former name B.1 |
