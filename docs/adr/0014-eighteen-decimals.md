English | [中文](0014-eighteen-decimals.zh-cn.md)

# 0014 Eighteen decimals: amounts 128 bits wide from the next versions of A.1 and B.1, decimals chosen at deployment

- Status: Accepted (owner, 2026-10-15; to be implemented in A.1 0.8.0 and B.1 0.4.0)
- Date: 2026-10-15
- Scope: Family. Targets A.1 0.8.0 and B.1 0.4.0. Would replace the widths and decimals of [A1-0005](a1-0005-numeric-parameters.md) and of B.1 01-design §2, and amend [14](../14-gateway.md) §3

## Context

Both Variants have 6 decimals. The reason is the width of amounts, not `decimals()` itself: A.1 proves a single amount `< 2⁴⁸` and a balance `< 2⁶⁴`, and caps `totalSupply` at `2⁶⁴ − 1` so that homomorphic sums never leave the range the proof covers ([A1-0005](a1-0005-numeric-parameters.md)). B.1 proves notes and public amounts `< 2⁶⁴` (B.1 01-design §2). At 18 decimals those widths give a whole token about 18.4 coins, and an A.1 transfer about 0.00028.

Most ERC-20s have 18 decimals, and so does USDT on BSC. Today the gateway bridges the gap by a scale of 10¹² and loses what lies below 10⁻⁶ of a token (14 §3).

**Measured on 2026-10-15.** The three circuits whose statements carry amounts were copied, every amount check widened to 128 bits (A.1: `MulG(64)` and `MulG(48)` to `MulG(128)`, the `b − v` check to 128 bits; B.1: the range checks of input notes, output notes, `v_pub_in` and `v_pub_out` to 128 bits), and compiled with circom 2.2.2:

| Circuit | Now | 128 bits | Change |
| --- | --- | --- | --- |
| A.1 transfer `0x01` | 29,719 | 32,087 | +2,368 (+8.0%) |
| A.1 unshield `0x04` | 18,895 | 21,263 | +2,368 (+12.5%) |
| A.1 fold `0x80` | carries no amount | unchanged | 0 |
| B.1 join-split | 55,343 | 55,727 | +384 (+0.7%) |

The cost is small because the bulk of A.1 is six 251-bit scalar multiplications by keys and randomness, and B.1 needs no curve arithmetic on amounts at all. All three stay below 2¹⁶ constraints, so the same powers of tau serve. These copies only count constraints: their packing of public inputs was left as it is and does not fit 128-bit amounts (below).

## Decision

1. From A.1 0.8.0 and B.1 0.4.0, every amount is below `2¹²⁸`: a single amount, a balance, a note, a public amount. `totalSupply` is capped at `2¹²⁸ − 1` smallest units, enforced by the contract, for the same reason as in A1-0005.
2. **Decimals are chosen at deployment**, from 0 to 18, 18 by default (owner, 2026-10-15). Once amounts are 128 bits, no circuit depends on the number of decimals: it only says where the point is shown. The constructor takes it and `decimals()` returns it. At 18 decimals the cap is about 3.4 × 10²⁰ tokens, and one amount can be as large as the cap.
3. **The gateway.** A gateway token is deployed with its underlying's decimals, so `scale` is 1 and no dust is lost. The gateway keeps `scale = 10^(d − token decimals)` for a token deployed with fewer decimals than the underlying, and still reverts for more. This replaces the open point on underlyings with fewer than 6 decimals (14 §9).
4. **A.1.**
   - The transfer and unshield circuits widen as measured. Fold does not change; its verifier can be reused.
   - Unshield packs `amount | signBits << 48 | to << 64` into one public input today. With a 128-bit amount that is 292 bits, more than a field element holds, so `to` moves to a public input of its own: 7 public inputs become 8.
   - Public amounts (shield, a mint to an id, `wrapperMint`) are turned into `v·G` on chain from a window table. At 4-bit windows a 128-bit table is 32 windows, 32 KiB, over the 24,576-byte limit for one contract, so the table is split into two data contracts. A public credit adds up to 32 points instead of 12.
   - The payee and the regulator read amounts from the memos the circuit enforces. The fallback of a 48-bit discrete logarithm is dropped: it cannot reach 128 bits.
5. **B.1.** The join-split widens as measured. `v_pub_in | v_pub_out << 64` becomes two public inputs. The regulator memo's word `v | sign(pk.y) << 64` moves the sign to bit 128.
6. Both are new circuits, so both get new proving and verifying keys. The Variant identifiers become `A:1:0.8.0` and `B:1:0.4.0`.

## Open points

- **Gas not yet measured:** the extra public input per verification (about 6,150 gas by the precompile prices of ecMul and ecAdd), the longer on-chain `v·G` for public amounts in A.1, and the time to prove in a browser, which should grow about with the constraints.

## Alternatives

- **Keep 6 decimals and scale in the gateway** (today). Works for wrapped assets; a token issued natively in the family still cannot have 18 decimals, and below 10⁻⁶ is lost at the gateway.
- **`decimals()` reports 18, amounts counted in units of 10¹² inside.** Every public amount would have to be a multiple of 10¹², and each token would carry the gateway's conversion. Rejected.
- **Fixed at 18 decimals.** Simpler to read, but a gateway in front of a 6-decimal underlying (USDT and USDC on Ethereum) would have to multiply by 10¹² and pay out only whole units of the underlying. Not chosen (owner, 2026-10-15).
- **The width of today's ranges in whole tokens** (a single amount `< 2⁸⁸`, a balance `< 2¹⁰⁴`). Fewer constraints than 128 bits, but two widths and caps that look arbitrary. The 128-bit circuits already cost little. Not chosen.

## Consequences

- Positive: tokens with the usual 18 decimals, or any other up to 18; a gateway token matches its underlying and loses no dust; one width for every amount.
- Negative: new circuits and keys for A.1 transfer and unshield and for B.1; one more public input on A.1 unshield and on B.1; a second data contract for the A.1 window table and more gas for public credits; the 48-bit fallback for reading A.1 amounts is gone.
- To be done: [07](../07-family-conventions.md) §11 says that a Variant fixes the widths and the cap and the token its decimals; the measurements above on chain; A.1 0.8.0 and B.1 0.4.0 in the documents first, then the circuits, the contracts, the dApp (amounts parsed at the token's decimals, a decimals field on the deploy pages) and a redeployment.
