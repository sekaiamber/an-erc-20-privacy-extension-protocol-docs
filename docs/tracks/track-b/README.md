English | [中文](README.zh-cn.md)

# Track B: notes

Status: `Draft`. Opened by [ADR-0009](../../adr/0009-track-b-notes.md) on 2026-10-13. The contracts and the circuit of B.1 are implemented and tested locally. Nothing is deployed, and there is no client yet.

> Until 2026-10-12 the name "Track B" meant a token without a public ledger. That is now a composition of A.1 ([ADR-0008](../../adr/0008-modules.md)); its documents are in [track-a/variant-1-privacy-only](../track-a/variant-1-privacy-only/README.md). The deployed contract that reports `B:1:0.2.0` belongs to it, not to this Track.

## Definition

| | Track A, encrypted accounts | Track B, notes |
| --- | --- | --- |
| **State model** | One ciphertext balance per account id | Notes: a tree of commitments and a set of nullifiers. No accounts |
| **Trust base** | User-held keys, client-side proofs, no external network | The same |

The two Tracks share the trust base and differ in the state model.

## What each outside party must know

| Party | What changes against Track A |
| --- | --- |
| **Integrators** | `from` and `to` carry no information. No event names a payer or a payee. There is no per-account view, not even of a ciphertext |
| **Users** | The wallet keeps the notes. It finds them by processing every transaction of the token, and a new device rescans from the deployment block. The receiving code is a key that never appears on chain |
| **Regulators** | The unit of reconstruction is the owner key, not an id. A view covers every transaction in a block range and cannot be narrowed to one key in advance |

## Integrator contract (honoured by every B.x)

Family conventions §1–§12 apply, narrowed as follows.

| ERC-20 surface | Track B behaviour |
| --- | --- |
| `transferFrom(from, to, x)` with a note-transfer payload | `from` and `to` MUST be the token's own address; `x` is the handle. Authorised by the proof; `msg.sender` is not checked |
| Burn with a public amount | `transferFrom(token, 0x0, amount)` with a Variant-defined payload; the change returns as a note |
| `Transfer` events | A note transfer emits `Transfer(token, token, handle)`. Value entering (mint, unwrap) emits `Transfer(0x0, token, amount)`; value leaving (burn, wrap) emits `Transfer(token, 0x0, amount)` |
| `balanceOf(a)` | `totalSupply()` for the token's own address, 0 for every other address, unless the public-ledger module is present |
| `transfer` / `transferFrom` without payload | Revert `NoPublicLedger()`, unless the public-ledger module is present |
| Dedicated event | Each Variant defines one event that carries nullifiers, commitments and memos, with no indexed user field |
| Regulator interface | Conventions §9 unchanged; "account" there reads "owner key" |

All value sits at the token's own address, so sums of `balanceOf` equal `totalSupply()`.

## Modules

A Track B token is a Variant plus modules, like any token of the family ([07 §13](../../07-family-conventions.md)). Each version of each Variant declares which modules it supports.

## Family tools

| Tool | What it does for Track B |
| --- | --- |
| Wrapper ([10](../../10-wrapper.md)) | Used unchanged. `recipient` carries a note-creating payload; `from` is the zero address |
| Regulator view | Needs a decoder that builds a table of notes and sums them by owner key |
| Regulatory Committee ([11](../../11-regulatory-committee.md)) | The contract is unchanged. The cryptography is the same: one `D` per transaction. A request has no account filter and always covers its whole block range |

## Variants

| Variant | Core | Payer / recipient | Amount | Regulator | Status |
| --- | --- | --- | --- | --- | --- |
| [B.1](variant-1/README.md) | Poseidon commitments and nullifiers, one join-split circuit (two in, two out), Groth16 | Hidden | Hidden | Memo in every transaction, enforced in the circuit | 0.1.0-draft; contracts and circuit implemented locally |
