English | [中文](README.zh-cn.md)

# Tracks

The family is organized by **Track / Variant / module** ([ADR-0008](../adr/0008-modules.md)):

- **Track**: a state model and a trust base. A route is a Track only if it cannot be delivered inside another Track by changing a payload type, a circuit, a client-side convention or a module, and it changes what integrators, users or regulators must assume ([ADR-0007](../adr/0007-track-definition.md)).
- **Variant**: one set of circuits under a Track, that is, a cryptographic core and what it hides. Variants are independent of one another. Each has its own version number `a.b.c`. A Variant number is the order of opening inside its Track; numbers do not correspond across Tracks.
- **Module**: a contract-level option on a Variant that leaves the circuits unchanged, such as the public ledger or the Wrapper port. Modules are registered once for the family in [07 §13](../07-family-conventions.md). A token is a Variant plus a set of modules, and reports them through the probe.

| Track | State model | Variant | Status |
| --- | --- | --- | --- |
| [A](track-a/README.md) | Encrypted accounts: one homomorphic-ciphertext balance per account | [A.1](track-a/variant-1/README.md) ElGamal on Baby Jubjub + Groth16 | **Mainline**; 0.6.0 specified; 0.5.0, two compositions on BSC testnet |
| [B](track-b/README.md) | Notes: a tree of commitments and a set of nullifiers, no accounts | [B.1](track-b/variant-1/README.md) Poseidon notes, one join-split circuit, Groth16 | Deployed on BSC testnet, 0.1.0 ([ADR-0009](../adr/0009-track-b-notes.md)) |

Both Tracks have the same trust base: user-held keys, client-side proofs, no external network.

## Modules declared by each Variant version

| Module | A.1 0.6.0 (design) | B.1 0.2.0 (design) |
| --- | --- | --- |
| Public ledger | Yes | No |
| Role issuance | Yes | Yes |
| Wrapper port | Yes | Yes |

The list is part of the version. A module registered later is not supported by these versions; supporting it takes a new version of the Variant (07 §13.2). Both versions are implemented and deployed on BSC testnet.

## Deployed compositions

| Composition | Public ledger | Role issuance | Wrapper port | Contract and descriptor | Documents |
| --- | --- | --- | --- | --- | --- |
| A.1 with the public ledger | Yes | Yes, into the public ledger | No | `A1LedgerToken`, `A:1:0.5.0` | [track-a/variant-1](track-a/variant-1/README.md) |
| A.1 privacy-only | No | Yes, into confidential accounts | Yes | `A1PrivateToken`, `A:1:0.5.0` | [track-a/variant-1](track-a/variant-1/README.md) |
| B.1 | No | Yes, into notes | Yes | `B1NoteToken`, `B:1:0.1.0` | [track-b/variant-1](track-b/variant-1/README.md) |

Addresses are in the [A.1 deployment record](track-a/variant-1/03-deployments.md) and the [B.1 deployment record](track-b/variant-1/02-deployments.md). The two A.1 tokens report the same descriptor and are told apart by `pepModules()`, which is `casataModules()` from A.1 0.6.0.

The second composition was opened as "Track B / B.1" and shipped under that name, with the descriptor `B:1:0.2.0`, until 2026-10-13. Its records from that time are in [track-a/variant-1-privacy-only](track-a/variant-1-privacy-only/README.md). It is not the Track B of the table above.

Discipline (ADR-0002, item 5): outside the mainline only a one-page sketch was allowed until the mainline ran end to end with gas figures. That condition has been met since A.1 0.4.0 (ADR-0009, Context).
