English | [中文](02-security-review.zh-cn.md)

# A.1 Security Self-Review (Round One)

Date: 2026-09-25. Subject: `contracts` repository at `21ebe6b` (circuits, contracts, client library). Method: item-by-item check against the consistency checks in design document §3.3 and the circuit constraints in §5, manual review plus targeted regression tests.

> This is an author self-review, not an independent audit. The purpose is to clear and record the problems the author can see before advancing the prototype to `Review` status.

## Conclusions

- **No path to forge proofs, double-spend, or mint out of thin air was found.** The circuit's public-input unpacking is unique (every field has a range check), and every point used on-chain is bound by equality constraints to the values computed inside the circuit.
- **One medium-severity availability attack (new-account lockout) was found**; a root fix requires adding a new operation, which is not yet implemented.
- **6 low-severity issues are fixed** with regression tests attached.
- Several trust assumptions and accepted risks are recorded.

## Findings

| # | Severity | Location | Issue | Handling |
| --- | --- | --- | --- | --- |
| F1 | **Medium** | Contract §4.3 | **New-account lockout (griefing)**: the first spend from an account whose `available` is zero must bind `pending` via `includePending`; an attacker who shields 1 minimum unit to that id every block can make the victim's proof expire before it lands on-chain, forever. | **Fixed (0.3.0)**: A.1 private type `0x80` pure fold, a circuit that only proves "knowledge of the `from` private key" (measured 4,027 constraints, 2 public inputs), executing `available += pending − folded; folded = pending`. The fold does not depend on the value of `pending`, so incoming payments cannot interrupt it; after folding, spend in default mode (binding only `available`). Regression test: after proof generation the attacker first sends 1 unit, and the fold still succeeds. |
| F2 | Low | `cancel` | The original implementation authorized cancellation by "holding the original payload", but the payload is public in the `prepare` transaction, so anyone could cancel any registration. | **Fixed**: record `preparedBy`; only that address may cancel. `cancel(from, handle)` no longer takes the payload. |
| F3 | Low | `prepare` | `0x04` registrations were keyed by the public amount, so two pending unshields of the same amount conflicted with each other. | **Fixed**: both types are keyed by handle, and bare execution is unified as `transferFrom(from, to, handle)`; duplicate registration reverts with `AlreadyPrepared`. |
| F4 | Low | Events | `ConfidentialTransfer` was emitted at `prepare` time; if the registration was later cancelled, the recipient's scan would wrongly believe it had received funds. | **Fixed**: registration emits `ConfidentialTransferPrepared`, execution emits `PreparedExecuted`; `ConfidentialTransfer` is emitted only on actual execution. |
| F5 | Low | `0x03` / `0x04` | For amounts ≥ 2⁴⁸, rejection relied indirectly on the window table `require` or proof failure, with unclear error messages; the `0x04` packing `amount \| signBits<<48` had overlapping bit fields when the amount was out of range. | **Fixed**: explicit `AmountTooLarge`. Note: **the per-transaction cap of 2⁴⁸ also applies to shield**; large amounts must be split. |
| F6 | Low | `regKeyId` | Any historical regulator public key was allowed; if a key was rotated because of a leak, a payer could still encrypt the regulator copy to it. | **Fixed**: must equal `activeRegulatorKeyId`. Cost: proofs in flight at the moment of rotation are invalidated and must be redone. Registrations that have been `prepare`d remain executable after rotation (verified at registration time). |
| F7 | Low | payload | The `decryptable` segment had a length cap of 65535 bytes, which could be used to create oversized storage writes (the sender pays the fee, but it pollutes state). | **Fixed**: cap of 1024 bytes. |
| F8 | Low | Client | Random scalars used 32 bytes `mod L`, with modular bias of about 2⁻⁵. | **Fixed**: 64 bytes. |
| F9 | Info | Contract | A relayer's transaction can be front-run by a mempool observer submitting the same payload: the effect is identical, only the original relayer loses gas. | Accepted. |
| F10 | Info | Contract | When direct execution and a `prepare` registration coexist, whichever executes first wins; the other party's registration becomes permanently invalid because the nonce has expired (`cancel` can reclaim the storage). | Accepted, documented. |
| F11 | Info | Circuit | The range check on `s` is 251 bits rather than `< L`, so `s` and `s + L` alias. | No security impact (both correspond to the same public key and the same decryption), accepted. |
| F12 | Info | Circuit | The id takes the low 160 bits of Poseidon: an attacker can produce two colliding keys of their own with 2⁸⁰ work; a second preimage of someone else's id is still 2¹⁶⁰. | No impact, accepted. |
| F13 | Info | Client | The memo key stream is a one-time pad: reusing the same `e` for the same recipient leaks `v` and `r`. | The client generates a fresh `e` for every transfer; the spec states "`e` must not be reused". |

## Item-by-Item Check Record

### Circuit

| Check | Result |
| --- | --- |
| Pack/unpack uniqueness: `w0 = from + nonce·2¹⁶⁰`, `w1 = to + chainId·2¹⁶⁰`, `w2 = contract + regKeyId·2¹⁶⁰ + Σ sign·2¹⁹²⁺ⁱ`, with fields range-checked at 160 / 64 / 64 / 160 / 32 / 1 bits respectively, no overlapping bit fields | ✅ |
| Point binding: public x + private y, `BabyCheck` on-curve + `Num2Bits_strict(y)[0] == sign`; the two y values for the same x necessarily have different parity (p is odd; when y = 0, −y = 0 is the same point) | ✅ |
| Sufficient balance: `b < 2⁶⁴` (`Num2Bits` inside `MulG(64)`), `v < 2⁴⁸`, `Num2Bits(64)(b − v)`; when `v > b`, `b − v ≡ p − (v − b) > 2⁶⁴` necessarily fails | ✅ |
| Three-party equality: `Camt = v·G + r·H`, `D_X = r·pk_X` are all equality constraints, no free variables | ✅ |
| memo correctness: `kR = e·pk_recv`, `kG = e·pk_reg` computed inside the circuit and equated to the public memo | ✅ |
| `pk_recv` binding: `Poseidon(pk_recv) → to`; `to` is passed in by the contract | ✅ |
| Identity handling: `EscalarMulAny` outputs the identity for the point with x = 0; `BabyAdd` is complete addition | ✅ |
| Subgroup: on-chain only checks on-curve; but every stored point is bound by equality constraints to the form `v·G + r·H` / `r·pk`, so as long as the user's key is in the subgroup, stored points are in the subgroup. A user who derives a key outside the subgroup harms only themselves | ✅ (recorded) |

### Contract

| Check | Result |
| --- | --- |
| Reentrancy: no external calls to untrusted contracts; verifier contracts are `view` and immutable; OZ v5 ERC20 has no transfer hooks | ✅ |
| Invariant I1: shielded tokens are held in custody at the contract address, `balanceOf(this) == shieldedSupply`, covered by tests | ✅ |
| I2 supply cap: `_update` checks `totalSupply ≤ 2⁶⁴ − 1` after minting | ✅ |
| nonce: +1 on every change to `available`; bound by both proofs and registrations | ✅ |
| `from == to`: debit goes to `available`, credit goes to `pending`, folded next time; semantics consistent | ✅ |
| `_preState` normalization: a stored zero point is mapped to (0,1) before being passed to the verifier contract | ✅ |
| Type dispatch: `transfer` accepts only no payload / `0x03`; `transferFrom` accepts no payload / `0x03` / `0x01` / `0x04`; everything else reverts | ✅ |
| All 8 consistency checks in §3.3 | ✅ (item 5 changed to "must be the active key") |
| Upgrades: no proxy, no upgrades; verifier and window-table addresses immutable | ✅ (recorded as a design choice) |

### Trust Assumptions (Recorded)

| Assumption | Description |
| --- | --- |
| Groth16 trusted setup | Currently a fake ceremony for local development, **must not be used for any deployment of value**; the production version will use a public ptau + self-run phase 2, or switch to a PLONK-style scheme |
| `REGULATOR_ADMIN` | Can rotate the regulator public key to a key under its own control and thereby read all subsequent amounts. This is the design premise "regulator = admin"; at deployment it should be an independent multisig |
| `MINTER_ROLE` | Can mint additional supply within the cap; same as an ordinary ERC-20 |
| Generator `H` | Derived via `hash-to-curve("PEP/A.1/H/v1")` with cofactor cleared; its discrete-log relation to `G` is unknown; the derivation script is reproducible in the repository |

## Next Steps

1. F1 / D1 are only recorded during the research phase (decided 2026-09-25); `0x80 fold` will be implemented in the version aimed at launch.
2. Round two: fuzz the interleaving of `prepare` / direct execution / `cancel`; fuzz `A1Payload` with malformed inputs.
3. Once the above is done, the A.1 design document enters `Review`.

## Appendix A: Denial-of-Service / Resource-Exhaustion Risk List (Recorded, Not Mitigated in the Research Phase)

What these risks have in common: **the attacker gets neither money nor plaintext, and can only make others spend more gas or temporarily fail to get things done**, and the attack must be paid for continuously. During the research phase they are only recorded; any version aimed at launch should re-evaluate each one. Price assumptions: ETH 0.3 gwei / $2,500, BSC 0.05 gwei / $750.

| # | Risk | What the attacker does | Attacker cost | Victim impact | Status / root-fix direction |
| --- | --- | --- | --- | --- | --- |
| D1 | **New-account lockout** (= self-review F1) | Shields 1 minimum unit to the target id every block so that its `includePending` proof expires before landing on-chain | ~200k gas per block (ETH $0.15, BSC $0.0075); one transaction can harass multiple ids at once | Each failed attempt burns ~300k gas; the first spend cannot go through for the duration of the attack | Recorded. Root fix: `0x80 fold` (proves only key knowledge, does not bind pending) |
| D2 | General `includePending` race | Same as D1, but targeting any account that chooses to bind pending | Same as above | Same as above; default mode (binding only available) is unaffected | Recorded. Users can switch to default mode |
| D3 | Registration invalidation | Before the victim's `prepare` registration executes, lands another transfer (direct execution) from the same account first; the nonce change permanently invalidates the registration | Requires holding some valid payload for that account (usually only the owner or their relayer has one) | Wastes the gas of one `prepare` (~400k) | Recorded. Essentially a coordination problem between the owner and their own relayer |
| D4 | Relayer front-running | Copies the relayer's payload from the mempool and submits it first | The gas of one full transaction | The original relayer's transaction fails and loses gas; on-chain effect is identical | Recorded. Relayers can use private transaction channels |
| D5 | Frequent regulator key rotation | `REGULATOR_ADMIN` rotates repeatedly, invalidating all in-flight `0x01` proofs (side effect of F6) | ~50k gas per rotation | All confidential transfers network-wide fail once at the moment of rotation | Recorded. Falls under the admin trust assumption; a minimum rotation interval could be added |
| D6 | Orphaned registration | A relayer disappears after `prepare`; the registration can only be cancelled by it | The relayer pays its own gas | The account owner cannot clean up that storage entry (no fee impact, just garbage) | Recorded. An "owner cleans up with a proof" path could be added |
| D7 | Cold-write shifting | The recipient always provides a brand-new id, making the payer bear the first-time pending cold write | None | Payer pays ~65k more gas per transfer | Recorded. A fee-allocation design matter, not a vulnerability |
| D8 | Event noise | Sends a large number of dust shields to the target id, generating `LedgerCrossing` events | ~200k gas each | The client scan processes a few more events; on-chain state does not bloat (homomorphic accumulation) | Recorded |
| D9 | Confidential dust | Someone holding the target `pk` sends a large number of small `0x01` transfers | ~470k gas each + proof | Same as D8; the memo is forced to be correct by the circuit and cannot be poisoned | Recorded |
| D10 | Wrong type sent | — (user's own mistake) | — | A public transfer sent to a confidential id: the tokens land in a public balance nobody controls | ADR-0003: the protocol provides no fallback; the frontend validates |

### Privacy-Related but Non-DoS Items Recorded

| # | Risk | Description |
| --- | --- | --- |
| P-a | The `includePending` flag is public | Leaks the metadata "this account is spending newly received funds" |
| P-b | The presence and size of the `decryptable` segment are public | Leaks whether the account is managed by an active client |
| P-c | The relayer knows the mapping between submitter IP and id | Network layer, a family-level non-goal |
| P-d | Transfers are linkable, id is a pseudonym | Family-level accepted risk (05 threat model) |
