English | [中文](0005-family-wrapper.zh-cn.md)

# 0005 A family-level Wrapper as a tool, not a replacement for Track A

- Status: Accepted
- Date: 2026-09-27
- Scope: family

## Context

Track B tokens have no public ledger and therefore cannot enter any DeFi protocol. The owner asked for a generic mechanism that maps such tokens (and any future non-ERC-20-shaped Variant) onto a public ERC-20, with control inverted: the mechanism defines the interface and tokens opt in, so it is written once for the whole family.

Two facts shaped the decision. A contract cannot hold a confidential account (no key, no proofs), so wrapping must be burn-and-mint, not custody. And any public face reintroduces the public aggregate: `wTOKEN.totalSupply()` plus the underlying's `totalSupply()` reveal how supply is split — the same information Track A exposes.

## Decision

1. Add [10-wrapper](../10-wrapper.md): interface `IPEPWrappable` (`wrapperMint`, `wrapperBurn`, `wrapper`) implemented by tokens, and one `PEPWrapper` contract per chain that issues a minimal `WrappedERC20` per underlying.
2. The wrapper is a **family tool**. Track A keeps its built-in `0x03` / `0x04`; it does not register with the wrapper. Track B Variants document their `IPEPWrappable` implementation in their own design (B.1 §13).
3. The burn proof used for `wrapperBurn` must bind the public recipient and amount (security review F14). Variants may reuse an existing circuit that already does (B.1 reuses A.1's unshield circuit).
4. The public aggregate exposed by wrapping is accepted; it is the same exposure as Track A and is the price of DeFi access. Tokens that need the aggregate hidden simply never wrap.

## Alternatives

- Replace Track A's built-in crossing with the wrapper: rejected — DeFi would see a second address per asset, every Track A token would gain an external privileged minter, and the already-verified A.1 crossing path would be discarded for no privacy gain.
- Per-token wrapper contracts: allowed (same bytecode, own deployment) for tokens that want isolation; the shared instance remains the default.
- Custody model (wrapper holds confidential tokens): impossible, see Context.

## Consequences

- One more family document (10) and, once implemented, two small contracts in `contracts/contracts/family/`.
- Track B tokens gain DeFi access at the cost of the public aggregate and of trusting the wrapper's `wrapperMint`.
- A shared contract is a shared blast radius: the wrapper must stay minimal, admin-less and non-upgradeable.
