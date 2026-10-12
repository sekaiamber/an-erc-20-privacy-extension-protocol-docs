English | [中文](README.zh-cn.md)

# Tracks

The protocol family is organized by **Track / Variant / module** ([ADR-0008](../adr/0008-modules.md)):

- **Track**: a state model and a trust base. A route is a Track only if it cannot be delivered inside another Track by changing a payload type, a circuit, a client-side convention or a module, and it changes what integrators, users or regulators must assume ([ADR-0007](../adr/0007-track-definition.md)).
- **Variant**: one set of circuits under a Track, that is, a cryptographic core and what it hides. Variants are independent of one another. Each has its own version number `a.b.c`. A Variant number is the order of opening inside its Track; numbers do not correspond across Tracks.
- **Module**: a contract-level option on a Variant that leaves the circuits unchanged, such as the public ledger or the Wrapper port. Modules are registered once for the family in [07 §13](../07-family-conventions.md). A token is a Variant plus a set of modules, and reports them through the probe.

| Track | State model and trust base | Variant | Status |
| --- | --- | --- | --- |
| [A](track-a/README.md) | Encrypted accounts: one homomorphic-ciphertext balance per account, user-held keys, client-side proofs | [A.1](track-a/variant-1/README.md) ElGamal on Baby Jubjub + Groth16 | **Mainline**; two compositions on BSC testnet |

Compositions of A.1 that are deployed:

| Composition | Public ledger | Role issuance | Wrapper port | Contract and descriptor today | Documents |
| --- | --- | --- | --- | --- | --- |
| With the public ledger | Yes | Yes, into the public ledger | No | `ConfidentialERC20A1`, `A:1:0.4.0` | [track-a/variant-1](track-a/variant-1/README.md) |
| Privacy-only | No | Yes, into confidential accounts | Yes | `ConfidentialERC20B1`, `B:1:0.2.0` | [track-b/variant-1](track-b/variant-1/README.md) |

The second composition was opened as "Track B / B.1". It keeps that name in the contracts, the dApp and its document directory until the contracts are restructured (ADR-0008, Transition). The letter B is assigned to no route.

Discipline: only the mainline Variant has an implementation. Other Tracks / Variants are allowed only a one-page design sketch until the mainline runs end to end and produces gas figures.
