English | [中文](0007-track-definition.zh-cn.md)

# 0007 What makes a Track: not substitutable and externally visible

- Status: Accepted
- Date: 2026-10-12
- Scope: Family (amends item 1 of [ADR-0002](0002-track-variant-structure.md))

## Context

ADR-0002 divides Tracks "by the interface contract and ledger topology as seen by integrators". In practice only the ledger-topology half was used: Track A has a public ledger, Track B does not.

Two things showed that this is too narrow.

- The public-ledger axis is the easiest one to substitute. B.1 is A.1's confidential ledger without the public ledger, and the family Wrapper ([ADR-0005](0005-family-wrapper.md)) gives a Track B token a public ERC-20 face. The differences that cannot be bridged lie elsewhere: the state model (accounts or notes) and the trust base (user-held keys with client-side proofs, or an external computation network).
- Routes that change far more than the ledger topology had no clear home. [03 Landscape](../03-landscape.md) filed the note model as "a Variant under A or B" and FHE as "A.x or Track C".

A looser wording ("a route whose stance is clearly different") was considered when a one-time receiving address scheme was proposed as Track C. It cannot be checked: every new idea looks clearly different to its author.

## Decision

1. **A route is a Track only if it passes both tests.**

   | Test | Question | If it fails |
   | --- | --- | --- |
   | **T1 Not substitutable** | Can its defining property be delivered inside an existing Track by adding a payload type, replacing a circuit, or adding a client-side convention? If yes, it fails. | Variant or feature |
   | **T2 Externally visible** | Does it change a premise that at least one outside party must know in advance? | Variant |

   The outside parties of T2 are:

   - **Integrators**: the interface and the ledger semantics.
   - **Users**: who must be trusted and what must stay online.
   - **Regulators**: how accounts and flows are reconstructed.

2. **What fails is a Variant or a feature.** A Variant is a new mechanism under an existing Track (it changes the contract or the circuits). A feature needs no contract change; it is a payload type or a client-side convention recorded in [07 Family conventions](../07-family-conventions.md) or in the Variant's design.

3. **Tracks A and B keep their definitions.** They remain different integrator contracts (dual ledger, pure confidential) and are not reopened.

4. **Letters are not allocated in advance.** A Track is opened only when a route is actually going to be pursued. Opening one requires a family-level ADR that states how the route passes T1 and T2, and what each family tool (Wrapper, regulator view, Regulatory Committee) has to do to support it.

5. **Item 5 of ADR-0002 stands.** Outside the mainline, a Track or Variant is allowed a one-page design sketch only.

### Candidates assessed with the two tests

This table records today's assessment. It opens no Track.

| Route | T1 Not substitutable | T2 Externally visible | Result |
| --- | --- | --- | --- |
| One-time receiving id on the encrypted-account ledger | No. By design analysis the payer derives a one-time key and uses the ordinary `0x01`, because the public key never goes on-chain (A1-0001). Not yet prototyped. | No | Feature (the reserved `0x02` slot) |
| Public amounts with one-time addresses (ERC-5564 style) | No. It works on the public ledger of any ERC-20 without the token's cooperation. | No | Not a Track |
| Note model (commitment tree and nullifiers) | Yes. Hiding the transfer graph and merging balances cannot be obtained in the account model by changing a circuit. | Yes. Addressing, wallet synchronisation and regulator reconstruction all change. | Track candidate |
| FHE (ciphertexts computed by an external network) | Yes | Yes. Users trust and depend on a threshold network; the interface differs. | Track candidate |

## Alternatives

- **Keep ADR-0002's wording.** Rejected: it weights the most substitutable axis and leaves the note model filed as a Variant although integrators, users and regulators would all see a different system.
- **"A route whose stance is clearly different and cannot be substituted", without tests.** Rejected: "clearly different" cannot be checked. The "cannot be substituted" half is kept as T1.
- **Name Tracks as cells of a matrix** (public ledger or not × accounts or notes × client proofs or external network). Rejected: the combinations multiply and most cells will never be pursued.

## Consequences

- Positive: whether something is a Track, a Variant or a feature can be argued from two questions; the note model and FHE have a defined place; features no longer inflate the number of Tracks.
- Negative: every Track multiplies the work on family tools. The regulator view scans `ConfidentialTransfer` events, for example, so a note-model Track needs its own reconstruction path.
- A Track is no longer a notion for integrators only; the Track row in [06 Family architecture](../06-family-architecture.md) is widened accordingly.
- The mapping table in [03 Landscape](../03-landscape.md) changes for the note model, FHE and stealth addresses.
- The `pep()` descriptor format `"<track>:<variant>:<version>"` is unchanged.
