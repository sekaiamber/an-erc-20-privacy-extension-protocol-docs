English | [中文](03-security-review.zh-cn.md)

# B.1 security self-review (round 1)

Date: 2026-09-27. Scope: `ConfidentialERC20B1`, `B1Payload`, `PEPWrapper`, `WrappedERC20`, the B.1 use of A.1's circuits. Everything B.1 copies from A.1 (account model, ciphertexts, lazy fold, proof binding, F1–F14) is covered by the [A.1 review](../../track-a/variant-1/02-security-review.md) and is not repeated here.

## Findings

| # | Severity | Where | Finding | Resolution |
| --- | --- | --- | --- | --- |
| B1-F1 | **Medium** | `mint`, wrapper | **Supply cap ignored wrapped-out tokens.** The cap check used `totalSupply` (confidential part only). Sequence: mint to the cap, wrap half, mint again up to the cap; now issued supply exceeds 2⁶⁴ − 1 and every `unwrap` reverts on the cap check — wrapped holders can never come back until the confidential side shrinks. Liveness, not theft. | **Fixed (0.1.1)**: `wrappedOut` tracks `wrapperBurn − wrapperMint`; `issuedSupply() = totalSupply + wrappedOut`; the MINTER's cap check is on the issued supply. Unwrap never changes the issued supply, so it can never hit the cap. |
| B1-F2 | **Medium** | `wrapperMint` | **The wrapper was an unbounded minter.** Whoever controls `wrapper()` could credit any amount to any id. A compromised or buggy wrapper is a family-wide risk (10-wrapper §5). | **Fixed (0.1.1)**: `wrapperMint` reverts `ExceedsWrappedOut` when `amount > wrappedOut`. A wrapper can only bring back what it took out; its worst case is mis-crediting the outstanding wrapped supply of that token, never inflation. Test: an EOA acting as wrapper. |
| B1-F3 | Low | `PEPWrapper.unwrap` | `unwrap` created the wrapped token for a never-wrapped underlying before failing on the burn; anyone could pay to litter the wrapper with empty `wTOKEN` contracts. | **Fixed (0.1.1)**: `unwrap` requires an existing wrapped token (`NothingWrapped`). |
| B1-F4 | Low | events | `wrapperMint` / `wrapperBurn` emitted `Minted` / `Burned`, indistinguishable from issuance and destruction for indexers. | **Fixed (0.1.1)**: `WrapperMinted` / `WrapperBurned`; `Minted` is issuance only; `Transfer` to / from the zero address is emitted in all four cases (what ERC-20 indexers expect). |
| B1-F5 | Info | `wrap` relay | Anyone may relay a wrap payload. A relayer submitting the same payload with a different `to` is rejected (`to` is in the proof: A.1 F14 fix, reused circuit). Submitting it with the same `to` is harmless (the relayer pays gas). | Accepted; regression test. |
| B1-F6 | Info | `wrap` vs direct `0x81` | A payload built for the wrapper (`to` = wTOKEN recipient) cannot be spent on the direct path (which requires `to == 0`) and vice versa: the same field decides both. | No action; tests cover both directions. |
| B1-F7 | Info | `PEPWrapper` | Reentrancy from a malicious "token": the wrapper holds no funds and touches only that token's own `wTOKEN`; a hostile underlying can inflate its own wrapped token, never another's. Each `wTOKEN` is bound to one underlying at creation. | Accepted: blast radius is per token. |
| B1-F8 | Info | trust | `wrapper()` is set once and may be any address, including an EOA. Registering the wrong wrapper is the admin's responsibility; after B1-F2 the damage is bounded by `wrappedOut`. | Documented (10-wrapper W3). |
| B1-F9 | Info | griefing | `unwrap` (like A.1's shield) lets anyone drop receipts into any id; the fresh-account lock (A.1 F1) is closed by `0x80` fold, which B.1 has. | No action. |
| B1-F10 | Info | ERC-20 surface | `approve` emits `Approval` without effect; `transfer` always reverts; `balanceOf` is 0. Wallets that pre-flight `transfer` with `eth_call` will see a revert — the intended Track B signal (B-3). | Accepted. |

## Not covered by tests

- The 2⁶⁴ − 1 cap boundary itself (reaching it needs > 65 k mints); the arithmetic is one line and is exercised by the `issuedSupply` / `wrappedOut` accessors.

## Trust assumptions (in addition to A.1's)

- The registered wrapper is honest or, if not, bounded by `wrappedOut` (B1-F2).
- The MINTER role is the issuer; issuance amounts are public by design (Track B decision B-2).
