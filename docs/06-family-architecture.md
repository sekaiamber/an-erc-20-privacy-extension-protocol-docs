English | [中文](06-family-architecture.zh-cn.md)

# 06 Family architecture

Status: `Draft`

## Layers

The protocol family has three layers; each answers a question for a different audience:

| Layer | Audience | Question answered | Carrier |
| --- | --- | --- | --- |
| **Family conventions** | All integrators and implementers | What a "privacy-extended ERC-20" looks like on-chain and how to call it | [07 Family conventions](07-family-conventions.md) |
| **Track** | Integrators such as wallets, DEXes, explorers | Whether there is a public ledger, and what the `balanceOf` / `transfer` semantics are | `docs/tracks/track-x/README.md` |
| **Variant** | End users and regulators | What is hidden, what is trusted, who is responsible for keys and proofs | `docs/tracks/track-x/variant-n/` |

From an integrator's point of view, different Tracks are different interface contracts; Variants under the same Track behave identically to integrators and differ only in their privacy guarantees and cryptographic core. Variants are self-contained and independent of one another (ADR-0002).

## Current family

```
Track A  Dual ledger: public ledger (standard ERC-20) + confidential ledger
  └─ A.1  twisted ElGamal encrypted accounts + Groth16, account = public key   ← mainline, prototype running
Track B  Purely confidential: no public ledger
  └─ (placeholder)
```

## Typical structure of a Variant (A.1 as the example)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Token contract (one address)                                           │
│                                                                         │
│  ┌──────────────────────┐      0x03 shield       ┌────────────────────┐ │
│  │ Public ledger        │ ─────────────────────► │ Confidential ledger│ │
│  │ OpenZeppelin ERC20   │ ◄───────────────────── │ id → {available,   │ │
│  │ balanceOf/transfer   │      0x04 unshield     │  pending, folded,  │ │
│  │ holds shielded tokens│                        │  nonce}            │ │
│  └──────────────────────┘                        └─────────┬──────────┘ │
│                                                            │ 0x01       │
│  ┌──────────────────────┐   ┌────────────────┐   ┌─────────▼──────────┐ │
│  │ A1Payload parser     │   │ BabyJubjub     │   │ Groth16 verifiers  │ │
│  │ type/flags/segments  │   │ add / windows  │   │ transfer/unshield  │ │
│  └──────────────────────┘   └────────────────┘   └────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                     ▲ standard transfer / transferFrom selector + trailing payload
        ┌────────────┴─────────────────┐      ┌──────────────────────────────┐
        │ Client / relayer             │      │ Regulator                    │
        │ keys, encryption, memo, proof│      │ memo decrypt, balance rebuild│
        └──────────────────────────────┘      └──────────────────────────────┘
```

The family conventions govern the topmost edge (selector + payload) plus events, key derivation and the regulator interface; everything inside the box belongs to the Variant.

## Evolution rules

- Adding a Track: a new integrator contract, requires a family-level ADR.
- Adding a Variant: create a new directory under an existing Track with its own design, specification and evaluation table; no family-level ADR needed.
- Changes to the family conventions affect every Track and must go through an ADR with a migration note.
- Only the mainline Variant has an implementation (ADR-0002, item 5).
