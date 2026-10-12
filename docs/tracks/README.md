English | [中文](README.zh-cn.md)

# Tracks

The protocol family is organized by **Track / Variant**:

- **Track**: a route that cannot be delivered inside another Track by changing a payload type, a circuit or a client-side convention, and that changes what integrators, users or regulators must assume ([ADR-0007](../adr/0007-track-definition.md)). Tracks A and B differ in the interface contract and ledger topology seen by integrators (wallets, DEXes, explorers). All Variants under the same Track behave identically to integrators.
- **Variant**: a concrete mechanism implementation under a Track, each self-contained and independent of the others. Each Variant has its own version number `a.b.c`.

| Track | Mechanism | Variant | Status |
| --- | --- | --- | --- |
| [A](track-a/README.md) | Dual ledger: public ledger + confidential ledger | [A.1](track-a/variant-1/README.md) ElGamal encrypted accounts + SNARK | **Mainline, in design** |
| [B](track-b/README.md) | Pure confidential: no public ledger | [B.1](track-b/variant-1/README.md) A.1's confidential ledger without the public ledger | Prototype (0.2.0, BSC testnet) |

Discipline: only the mainline Variant has an implementation. Other Tracks / Variants are allowed only a one-page design sketch until the mainline runs end to end and produces gas figures.
