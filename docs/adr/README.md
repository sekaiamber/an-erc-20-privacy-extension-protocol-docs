English | [中文](README.zh-cn.md)

# Architecture Decision Records (ADR)

Records the important and hard-to-reverse technical decisions in the project. One file per ADR, numbered incrementally.

- Family level: `NNNN-short-title.md`
- Variant level: `a1-NNNN-short-title.md` (the prefix is the lowercase Variant number)

## Family level

| No. | Title | Status |
| --- | --- | --- |
| [0001](0001-use-hardhat3-for-contracts.md) | Use Hardhat 3 as the contract development environment | Accepted |
| [0002](0002-track-variant-structure.md) | Organize the protocol family by Track / Variant | Accepted |
| [0003](0003-erc20-surface-conventions.md) | ERC-20 surface conventions: reuse standard selectors and trailing payload | Accepted |
| [0006](0006-regulatory-committee.md) | Regulator as a threshold committee contract; memo keys from r·H | Proposed |
| [0005](0005-family-wrapper.md) | A family-level Wrapper as a tool, not a replacement for Track A | Accepted |
| [0004](0004-regulatory-access-principles.md) | Regulatory access principles | Accepted |

## A.1

| No. | Title | Status |
| --- | --- | --- |
| [A1-0001](a1-0001-account-is-public-key.md) | Confidential account = public key; public key never goes on-chain | Accepted |
| [A1-0002](a1-0002-crypto-core.md) | Crypto core: twisted ElGamal on Baby Jubjub + Groth16 | Accepted |
| [A1-0003](a1-0003-proof-as-authorization.md) | Proof-as-authorization; `transferFrom` is the confidential payment entry point | Accepted |
| [A1-0004](a1-0004-pending-lazy-fold.md) | available / pending split and lazy fold | Accepted |
| [A1-0005](a1-0005-numeric-parameters.md) | Numeric parameters: bit widths, decimals, supply cap | Accepted |
| [A1-0006](a1-0006-fold-and-received-block.md) | Pure fold `0x80` and `lastReceivedAtBlock` (A.1 only) | Accepted |

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
