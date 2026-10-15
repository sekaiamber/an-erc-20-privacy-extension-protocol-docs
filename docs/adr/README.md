English | [中文](README.zh-cn.md)

# Architecture Decision Records (ADR)

Records the important and hard-to-reverse technical decisions in the project. One file per ADR, numbered incrementally.

- Family level: `NNNN-short-title.md`
- Variant level: `a1-NNNN-short-title.md` (the prefix is the lowercase Variant number)

ADR-0001 to ADR-0010 were written before the project was named Casata ([0011](0011-project-name-casata.md)). They keep the names in use at the time: PEP, `pep()`, `IPEP*`, `PEPWrapper`.

## Family level

| No. | Title | Status |
| --- | --- | --- |
| [0001](0001-use-hardhat3-for-contracts.md) | Use Hardhat 3 as the contract development environment | Accepted |
| [0002](0002-track-variant-structure.md) | Organize the protocol family by Track / Variant | Accepted (amended by 0007 and 0008) |
| [0007](0007-track-definition.md) | What makes a Track: not substitutable and externally visible | Accepted (amended by 0008) |
| [0008](0008-modules.md) | Track, Variant and module: the public ledger is a module, not a Track | Accepted (implemented 2026-10-13; items 5 and 6 amended by 0013) |
| [0009](0009-track-b-notes.md) | Open Track B: the note model | Accepted (design only; precondition met) |
| [0003](0003-erc20-surface-conventions.md) | ERC-20 surface conventions: reuse standard selectors and trailing payload | Accepted (amended by 0010) |
| [0010](0010-erc20-surface-tradeoffs.md) | ERC-20 compatibility is decided item by item; transfer stays the shared verb | Accepted (implemented 2026-10-13) |
| [0006](0006-regulatory-committee.md) | Regulator as a threshold committee contract; crypto core switched to plain ElGamal | Accepted (§3 shipped; committee prototyped 2026-09-29) |
| [0005](0005-family-wrapper.md) | A family-level Wrapper as a tool, not a replacement for Track A | Accepted (terms updated by 0008) |
| [0004](0004-regulatory-access-principles.md) | Regulatory access principles | Accepted |
| [0011](0011-project-name-casata.md) | The project is named Casata; the acronym PEP is retired | Accepted (implemented 2026-10-13; repository rename pending) |
| [0012](0012-visual-identity.md) | Visual identity: the secret ledger, and a wax seal as the mark | Accepted (style only; the dApp follows later) |
| [0013](0013-mintable.md) | Mintable: issuance after deployment is a module; the initial supply and the burn belong to the core | Accepted (to be implemented in A.1 0.7.0, B.1 0.3.0) |
| [0014](0014-eighteen-decimals.md) | Eighteen decimals: amounts 128 bits wide from A.1 0.8.0 and B.1 0.4.0, decimals chosen at deployment | Proposed |

## A.1

| No. | Title | Status |
| --- | --- | --- |
| [A1-0001](a1-0001-account-is-public-key.md) | Confidential account = public key; public key never goes on-chain | Accepted |
| [A1-0002](a1-0002-crypto-core.md) | Crypto core: twisted ElGamal on Baby Jubjub + Groth16 | Accepted |
| [A1-0003](a1-0003-proof-as-authorization.md) | Proof-as-authorization; `transferFrom` is the confidential payment entry point | Accepted |
| [A1-0004](a1-0004-pending-lazy-fold.md) | available / pending split and lazy fold | Accepted |
| [A1-0005](a1-0005-numeric-parameters.md) | Numeric parameters: bit widths, decimals, supply cap | Accepted (0014 proposes to replace it from 0.8.0) |
| [A1-0006](a1-0006-fold-and-received-block.md) | Pure fold `0x80` and `lastReceivedAtBlock` (A.1 only) | Accepted |
| [A1-0007](a1-0007-exit-kind-binding.md) | The unshield proof binds which exit it is for, through the recipient value | Accepted (to be implemented in 0.7.0) |

## Template

```markdown
# NNNN Title

- Status: Proposed / Accepted / Deprecated / Superseded by NNNN
- Date: YYYY-MM-DD
- Scope: Family / A.1 / ...

## Context

Why this decision is needed and the constraints currently faced.

## Decision

What was decided.

## Alternatives

Options that were considered but not adopted, and why.

## Consequences

The positive and negative effects of this decision.
```
