English | [中文](README.zh-cn.md)

# A.1: ElGamal encrypted accounts + Groth16

Version: `0.6.0` (core plus modules, [ADR-0008](../../../adr/0008-modules.md); 0.6.0 is implemented and deployed on BSC testnet since 2026-10-13). Status: `Draft`.

Implemented as `A1LedgerToken` and `A1PrivateToken` and deployed on BSC testnet on 2026-10-13 ([03-deployments](03-deployments.md)). The two standalone contracts that predate the module structure, `ConfidentialERC20A1` 0.4.0 and `ConfidentialERC20B1` 0.2.0, remain on chain and are no longer opened by the dApp.

## In one sentence

A confidential account is a Baby Jubjub public key. Only the hash of the key, the account id, appears on chain; the key itself never does. The balance is an ElGamal ciphertext. Spending is authorised by a zero-knowledge proof that also guarantees conservation and non-negativity, and every confidential transfer encrypts the amount to the regulator key as well. Payers and recipients appear as stable pseudonyms; amounts and balances are hidden.

## Structure

| Part | What it is | Specified in |
| --- | --- | --- |
| **Core** | The privacy-only ledger: accounts, `0x01` transfer, `fold`, regulator key, the three circuits | [01-design.md](01-design.md) |
| **Public ledger** (module) | Standard ERC-20 balances at the token's address; `0x03` shield, `0x04` unshield | [04-modules.md](04-modules.md) §4.1; flows in 01-design §4.1 and §4.4 |
| **Role issuance** (module) | Mint by a role, burn by the holder, both with public amounts | [04-modules.md](04-modules.md) §4.2 |
| **Wrapper port** (module) | `ICasataWrappable` for the family Wrapper | [04-modules.md](04-modules.md) §4.3 |

A.1 0.6.0 declares support for exactly these three modules; a module registered later needs a new A.1 version (07 §13.2).

How the parts combine, how supply is accounted for across them, and what changes when the contracts are restructured: [04-modules.md](04-modules.md).

## Compositions

| Composition | Modules | Deployed as | Records |
| --- | --- | --- | --- |
| With the public ledger | Public ledger, role issuance | `A1LedgerToken`, `A:1:0.6.0` | [02-security-review.md](02-security-review.md), [03-deployments.md](03-deployments.md) |
| Privacy-only | Role issuance, Wrapper port | `A1PrivateToken`, `A:1:0.6.0` | [03-deployments.md](03-deployments.md); for the standalone contract before 0.5.0: [variant-1-privacy-only](../variant-1-privacy-only/README.md) |

## Privacy evaluation (family conventions §12)

| Goal | Achieved | Notes |
| --- | --- | --- |
| P1 Amount hiding | Full for `0x01` | Amounts of mint, burn, shield, unshield, wrap and unwrap are public |
| P2 Recipient | Pseudonymous | A stable id; the key behind it is never on chain |
| P3 Sender | Pseudonymous | As P2 |
| P4 Transaction linkability | Linkable | All activity of an id is linked. The reserved `0x02` one-time id would unlink receipts only |
| P5 Ledger-crossing linkability | Depends on the modules | With the public ledger every `0x03` / `0x04` is a public edge between a wallet and an id. Privacy-only: only a mint, a wrap or an unwrap is |
| S1–S5 | Satisfied | Range and balance proofs; nonce and single-writer ciphertexts; spending needs the key; the public ledger is unmodified ERC-20; no freeze or seizure interface |

## Documents

| Document | Contents |
| --- | --- |
| [01-design.md](01-design.md) | The core in detail: parameters, accounts and state, payload, flows, circuits, events, client flows, gas |
| [04-modules.md](04-modules.md) | Modules and compositions: primitives, supply accounting, each module, ERC-20 surface per composition, probe, what changes at 0.5.0 and at 0.6.0 |
| [02-security-review.md](02-security-review.md) | Round-one security self-review of the composition with the public ledger |
| [03-deployments.md](03-deployments.md) | Deployment record (BSC testnet): both compositions from 0.5.0, the composition with the public ledger before it |
| [variant-1-privacy-only](../variant-1-privacy-only/README.md) | Records of the privacy-only composition under its former name B.1 |
