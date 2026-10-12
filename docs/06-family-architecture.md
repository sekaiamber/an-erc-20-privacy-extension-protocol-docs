English | [中文](06-family-architecture.zh-cn.md)

# 06 Family architecture

Status: `Draft`

## Layers

The protocol family has three layers; each answers a question for a different audience:

| Layer | Audience | Question answered | Carrier |
| --- | --- | --- | --- |
| **Family conventions** | All integrators and implementers | What a "privacy-extended ERC-20" looks like on-chain and how to call it | [07 Family conventions](07-family-conventions.md) |
| **Track** | Integrators such as wallets, DEXes, explorers; also users and regulators where the route changes what they must assume | What cannot be changed without becoming a different system: the interface and ledger semantics, the state model, the trust base | `docs/tracks/track-x/README.md` |
| **Variant** | End users and regulators | What is hidden, what is trusted, who is responsible for keys and proofs | `docs/tracks/track-x/variant-n/` |

A route is a Track only if it passes two tests ([ADR-0007](adr/0007-track-definition.md)):

- **Not substitutable**: its defining property cannot be delivered inside an existing Track by adding a payload type, replacing a circuit, or adding a client-side convention.
- **Externally visible**: it changes a premise that integrators, users or regulators must know in advance.

What fails either test is a Variant (it changes the contract or the circuits) or a feature (no contract change). Tracks A and B differ in what integrators see: whether there is a public ledger, and what `balanceOf` / `transfer` mean. Variants under the same Track behave identically to integrators and differ only in their privacy guarantees and cryptographic core. Variants are self-contained and independent of one another (ADR-0002).

## Current family

```
Track A  Dual ledger: public ledger (standard ERC-20) + confidential ledger
  └─ A.1  twisted ElGamal encrypted accounts + Groth16, account = public key   ← mainline, prototype running
Family tool  generic Wrapper (10-wrapper): issues wTOKEN for ledger-less tokens to reach DeFi   ← deployed (PEPWrapper)
Family tool  Regulatory Committee (11): threshold regulator key, membership, policies, audit    ← in design (per project)
Track B  Pure confidential: no public ledger
  └─ B.1  A.1's confidential ledger without the public ledger, public mint / burn   ← prototype on BSC testnet (0.2.0)
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

- Adding a Track: only for a route that is actually going to be pursued; letters are not allocated in advance. It requires a family-level ADR stating how the route passes the two tests of ADR-0007 and what each family tool has to do to support it.
- Adding a Variant: create a new directory under an existing Track with its own design, specification and evaluation table; no family-level ADR needed.
- Changes to the family conventions affect every Track and must go through an ADR with a migration note.
- Only the mainline Variant has an implementation (ADR-0002, item 5).
