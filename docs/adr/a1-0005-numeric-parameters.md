English | [中文](a1-0005-numeric-parameters.zh-cn.md)

# A1-0005 Numeric parameters: bit widths, decimals, supply cap

- Status: Accepted
- Date: 2026-09-24
- Scope: A.1

## Context

The bit width of the range proof determines circuit cost; if ElGamal requires solving a discrete logarithm, that limits the amount bit width; homomorphic accumulation may push a balance outside the interval covered by the range proof.

## Decision

| Parameter | Value |
| --- | --- |
| Single transfer amount | `v < 2⁴⁸` |
| Balance | `b < 2⁶⁴` |
| `totalSupply` cap | `2⁶⁴ − 1` smallest units, enforced by the contract |
| decimals | 6 |

- The supply cap guarantees that any account balance stays within the 64-bit range proof, so accumulation can never lock an account.
- The payee and the regulator obtain the plaintext via the circuit-enforced memo, without solving a discrete logarithm; the 48-bit discrete logarithm (2²⁴ table) serves only as a fallback in case of an implementation bug.

## Alternatives

- Single-segment 32-bit amount + table-lookup decryption: the per-transfer cap is only 4,294 (decimals 6), not enough.
- Split into low 16 / high 32 bits encrypted separately: one extra point per ciphertext; the memo approach is cheaper.

## Consequences

- Positive: per-transfer cap of about 280 million, total supply cap of about 1.8 × 10¹³, covering the vast majority of token scenarios.
- Negative: decimals cannot be 18; unsuitable for meme-style tokens with extremely large total supply.
