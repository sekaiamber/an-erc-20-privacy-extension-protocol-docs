English | [中文](06-family-architecture.zh-cn.md)

# 06 Family architecture

Status: `Draft`

## Layers

The family has four layers. Each answers a different question:

| Layer | Question answered | What changing it costs | Carrier |
| --- | --- | --- | --- |
| **Family conventions** | What a "privacy-extended ERC-20" looks like on-chain and how to call it | Every Track is affected; an ADR with a migration note | [07 Family conventions](07-family-conventions.md) |
| **Track** | Which state model and which trust base | Every family tool is adapted; a family ADR | `docs/tracks/track-x/README.md` |
| **Variant** | Which set of circuits: the cryptographic core and what it hides | New verifiers, a new trusted setup, a new security review | `docs/tracks/track-x/variant-n/` |
| **Module** | Which contract-level options this token carries, on unchanged circuits | A contract change only | Registered in [07 §13](07-family-conventions.md); implemented per Variant |

A route is a Track only if it passes two tests ([ADR-0007](adr/0007-track-definition.md), with the clause added by [ADR-0008](adr/0008-modules.md)):

- **Not substitutable**: its defining property cannot be delivered inside an existing Track by adding a payload type, replacing a circuit, adding a client-side convention, or adding or leaving out a module.
- **Externally visible**: it changes a premise that integrators, users or regulators must know in advance.

What fails either test is a Variant (it changes the circuits), a module (it changes the contract only) or a feature (no contract change).

Modules come in two kinds ([ADR-0008](adr/0008-modules.md)):

- A **compile-time module** is inherited into the token contract. It is used for what reads or writes confidential state or changes how an existing function behaves. The public ledger is one.
- A **runtime module** is an external contract plugged into a **port** of the token. It is used for what has its own state and needs nothing but the port. The family Wrapper is one.

The base of every Variant is a privacy-only ledger. Whether a token also has a public ledger at its own address is a module, so two tokens of the same Track can differ in what `balanceOf` and a payload-less `transfer` do. Integrators learn this from the probe (07 §13), not from the Track letter. Variants are independent of one another; code is shared inside a Variant and through family runtime modules.

## Current family

```
Track A  Encrypted accounts: one homomorphic-ciphertext balance per account
  └─ A.1  ElGamal on Baby Jubjub + Groth16, account = public key                ← mainline
       ├─ with the public ledger            contract A1LedgerToken,  pep() A:1:0.5.0   ← prototype on BSC testnet
       └─ privacy-only, with the Wrapper port   contract A1PrivateToken, pep() A:1:0.5.0   ← prototype on BSC testnet
Track B  Notes: a tree of commitments and a set of nullifiers, no accounts
  └─ B.1  Poseidon notes, one join-split circuit, Groth16                       ← deployed on BSC testnet, `B:1:0.1.0` (ADR-0009)
Runtime module  generic Wrapper (10-wrapper): issues wTOKEN for tokens without the public ledger   ← deployed (CasataWrapper)
Family tool     Regulatory Committee (11): threshold regulator key, membership, policies, audit    ← prototype
```

Both Tracks have the same trust base: user-held keys, client-side proofs, no external network.

Both compositions report the same descriptor and are told apart by the module probe. The privacy-only composition was opened as "Track B / B.1" and shipped under that name until the contracts were restructured on 2026-10-13 (ADR-0008, Transition).

## Typical structure of a token (A.1 with the public-ledger module)

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

The family conventions govern the topmost edge (selector + payload) plus events, key derivation and the regulator interface; everything inside the box belongs to the Variant. The left-hand box, the public ledger with `0x03` / `0x04`, is the public-ledger module; a privacy-only composition does not have it.

## Evolution rules

- Adding a Track: only for a route that is actually going to be pursued; letters are not allocated in advance. It requires a family-level ADR stating how the route passes the two tests of ADR-0007 and what each family tool has to do to support it.
- Adding a Variant: only for a new set of circuits. Create a new directory under an existing Track with its own design, specification and evaluation table; no family-level ADR needed.
- Adding a module: register it in 07 §13 with its kind, its interface and, for a port, its limit; then implement it in each Variant that supports it. A module never changes a circuit, is never installable after deployment, and never runs in the token's storage (ADR-0008). Each version of a Variant declares the modules it supports; an existing version does not gain a module registered later, and supporting it takes a new version of that Variant.
- Changes to the family conventions affect every Track and must go through an ADR with a migration note.
- Outside the mainline only a one-page sketch was allowed until the mainline ran end to end with gas figures (ADR-0002, item 5). That condition has been met since A.1 0.4.0.
