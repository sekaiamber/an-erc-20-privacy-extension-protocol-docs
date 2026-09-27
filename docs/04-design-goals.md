English | [中文](04-design-goals.zh-cn.md)

# 04 Design Goals

Status: `Draft`

This document lists the properties the protocol should satisfy and explicitly records the places where trade-offs are required. Every goal here should have a corresponding mechanism, or an explicit reason for abandoning it, in the later specifications.

## Functional Goals

| ID | Goal | Description |
| --- | --- | --- |
| G1 | ERC-20 compatible | In public mode the token fully follows EIP-20; existing infrastructure needs zero changes |
| G2 | Bidirectional conversion | Users can move a public balance into the private state (shield) and back to the public state (unshield) |
| G3 | In-private transfers | In the private state, users can transfer between each other without first converting back to the public state |
| G4 | Verifiable supply conservation | Public total + private pool total = `totalSupply()`, verifiable by anyone |
| G5 | Permissionless | Any address can use the privacy features, without approval from an operator |

## Privacy Goals

| ID | Goal | Dimension covered |
| --- | --- | --- |
| P1 | The amount of an in-private transfer is invisible | Amount privacy |
| P2 | The receiver of an in-private transfer is invisible (levels: hidden / pseudonymous / public) | Identity privacy |
| P3 | The sender of an in-private transfer is invisible (levels: hidden / pseudonymous / public) | Identity privacy |
| P4 | Multiple in-private transfers of the same user are unlinkable | Linkability |
| P5 | The amount and address of shield / unshield are public, but unlinkable to in-private activity | Linkability |

The degree to which P1 to P4 are achieved depends on the technical route of the Variant; not all routes can satisfy them simultaneously. Each Variant self-assesses against the evaluation table in Section 12 of [07 Family Conventions](07-family-conventions.md). "Pseudonymous" means the payer and payee appear as a stable confidential id: the real identity cannot be derived from it, but multiple transactions of the same id can be linked (the current state of A.1).

## Security Goals

| ID | Goal |
| --- | --- |
| S1 | Private balance cannot be minted out of thin air (soundness) |
| S2 | No double spending (nullifier uniqueness or an equivalent mechanism) |
| S3 | Other users' private balances cannot be stolen |
| S4 | A failure of the privacy features does not affect normal use of the token in public mode |
| S5 | No role is introduced that can unilaterally freeze or confiscate user assets |

## Engineering Goals

| ID | Goal |
| --- | --- |
| E1 | Deployable on mainstream EVM chains, without relying on special opcodes beyond precompiles |
| E2 | The gas cost of a private transfer is within an acceptable range (target value to be determined after research) |
| E3 | Proof generation can be completed on ordinary consumer devices or in a browser |
| E4 | The contract upgrade strategy is explicit (or the contract is explicitly non-upgradeable) |

## Optional Compliance

The protocol itself does not enforce compliance, but should reserve interfaces for the following capabilities, to be enabled at the discretion of the token issuer or the user:

- Viewing key: a user can disclose their own private transaction history to a third party.
- Association set proof: a user can prove that the source of their funds belongs (or does not belong) to some set.

These two capabilities must not weaken the privacy of users who do not enable them.

## Explicit Non-goals

- Do not hide the existence of shield / unshield operations themselves.
- Do not hide the token contract address (i.e. "which token the user is using" is public).
- Do not solve the linkage problem caused by gas payment; that problem is left to the account abstraction / relayer layer, and this protocol only guarantees compatibility with it.

## Main Trade-offs

| Trade-off | One end | The other end |
| --- | --- | --- |
| Privacy strength vs gas | Full ZK proofs, high gas | Partial privacy, low gas |
| Compatibility vs privacy | Keep the account model, identities public | Note model, full privacy but departs from the standard interface |
| Trustlessness vs functionality | Pure ZK, no extra assumptions | FHE threshold network, rich functionality but with trust assumptions |
| Compliance vs censorship resistance | Built-in compliance hooks | Completely uncensorable |

The final choices for these trade-offs will be recorded through ADRs.
