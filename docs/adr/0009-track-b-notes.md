English | [中文](0009-track-b-notes.zh-cn.md)

# 0009 Open Track B: the note model

- Status: Accepted (design only; implementation waits for the contract restructuring of [ADR-0008](0008-modules.md))
- Date: 2026-10-13
- Scope: Family (opens a Track under item 4 of [ADR-0007](0007-track-definition.md); updates the Transition of ADR-0008)

## Context

- ADR-0007 assessed the note model as a Track candidate. On 2026-10-12 the owner decided to pursue it.
- ADR-0008 withdrew the former Track B (a token without a public ledger is a composition of A.1) and released the letter B.
- Item 5 of ADR-0002 allows only a one-page sketch outside the mainline "until the mainline runs end to end and produces gas data". That condition is met: A.1 runs on BSC testnet with measured gas ([A.1 deployments](../tracks/track-a/variant-1/03-deployments.md)). A full design for a second Track is therefore allowed.

## Decision

1. **Track B is the note model.** Value is held in notes: commitments in an append-only tree, spent by publishing nullifiers. There are no accounts on chain. The trust base is the same as Track A's: user-held keys, client-side proofs, no external network. Documents: [tracks/track-b](../tracks/track-b/README.md).

2. **It passes both tests of ADR-0007.**

   **T1, not substitutable.** In Track A every operation names the account slots it reads and writes; that is what the state model is. No payload type, circuit, client-side convention or module removes it. The note model delivers four things that follow from having no slots:

   | Property | In Track A |
   | --- | --- |
   | No payer or payee identifier on chain | Every transfer names two ids |
   | Receipts of the same owner cannot be linked | The one-time receiving id (the `0x02` feature) gives this for receipts only |
   | Merging funds reveals nothing | Funds on separate ids can only be merged by transfers between them, in the open |
   | An incoming payment cannot interfere with a spend | Needs `pending` and fold |

   **T2, externally visible.**

   | Party | Premise that changes |
   | --- | --- |
   | Integrators | `from` and `to` carry no information; no event names a party; no per-account view |
   | Users | The wallet keeps the notes and must process every transaction of the token to find them |
   | Regulators | Reconstruction is by owner key; a view covers a whole block range |

3. **The first Variant is B.1**: Poseidon commitments and nullifiers, one join-split circuit with two inputs and two outputs, Groth16. Design: [B.1 01-design](../tracks/track-b/variant-1/01-design.md). It supports the role-issuance module and the Wrapper port, and not the public-ledger module.

4. **Integrator contract of Track B.** `from` and `to` of a note transfer are the token's own address. `balanceOf` returns `totalSupply()` for that address and 0 elsewhere. Value entering and leaving is shown as `Transfer` from and to the zero address. [07 §3 and §7](../07-family-conventions.md) gain a clause for this.

5. **What each family tool does.**

   | Tool | Work |
   | --- | --- |
   | Wrapper | None in the contract. `IPEPWrappable` is used as it is: `recipient` carries a note-creating payload and `from` is the zero address |
   | Regulator view | A new decoder: from regulator memos to a table of notes, summed by owner key |
   | Regulatory Committee | None in the contract. The client learns Track B's event and builds the list of `D` points from it. A request has no account filter |
   | Module probe | None. Track B reports modules like any token |
   | dApp | A new page for `B:1`, with a note store and a scanner in the browser |

6. **Regulation is enforced at creation and at spending.** Every note is created by a proven transaction whose regulator memo names its owner and amount, including minted notes. This is why minting needs a proof although its amount is public (ADR-0004, items 1 and 5).

7. **The letter B is taken now; deployment waits.**

   - The documents of the former B.1 moved to `docs/tracks/track-a/variant-1-privacy-only/`.
   - The deployed contract `ConfidentialERC20B1` still reports `B:1:0.2.0`, and the dApp routes `B:1` to its page. A note-model token MUST NOT be deployed until that contract has been redeployed under `A:1:…` by the restructuring of ADR-0008.
   - The contract name `ConfidentialERC20B1` is in use until then. The note-model contract is named at implementation.

8. **Order of work.**

   1. Restructure the contracts and the dApp as ADR-0008 describes.
   2. Measure the on-chain Poseidon tree. It is the largest and least certain cost of B.1.
   3. The circuit, then the contract, then the client.

## Accepted costs

These are estimates from the B.1 design, not measurements.

| Cost | Estimate |
| --- | --- |
| Gas per transaction | About 1.2M, against 467k measured for an A.1 transfer. More than half is the on-chain tree |
| Proving | 2 to 4 s in Node, against 1.3 to 1.5 s |
| Wallet synchronisation | Every wallet processes every transaction of the token |
| Regulator views | A whole block range; tracing backwards is targeted, tracing forwards is not |
| Submitter | The address that submits a transaction is visible. A relayer is out of scope |

## Alternatives

- **File the note model as a Variant of Track A.** Rejected: it has a different state model, and all three outside parties see a different system.
- **Stay in Track A and add one-time receiving ids.** Rejected as a substitute: it unlinks receipts but not spends, and merging stays public. It remains a possible feature of A.1.
- **Call it Track C and leave B empty.** Rejected: the project is unreleased, the former meaning of B is fully retired by ADR-0008, and its documents carry a note pointing to the new place.
- **A shared shielded pool for arbitrary ERC-20 tokens.** Rejected: the project is about the token itself. A token of this Track with a custody-issuance module would cover that use later.
- **Mint without a proof.** Rejected: the regulator would not know the owner of a minted note until it is spent.

## Consequences

- Positive: the family has a route in which payer, payee and the transfer graph are hidden, with the same regulator guarantee as A.1.
- Positive: the Wrapper and the committee contract are reused unchanged, which is evidence that their interfaces were not tied to the account model.
- Negative: a second Track doubles the work on the regulator view and the dApp.
- Negative: the name "B.1" means two things until the restructuring is done. Documents mark the old meaning wherever it remains.
- The dApp links its legacy `B.1` page to documents at the old path; those links must move to `tracks/track-a/variant-1-privacy-only/`.
- The Transition section of ADR-0008 is updated: the letter B is no longer free.
