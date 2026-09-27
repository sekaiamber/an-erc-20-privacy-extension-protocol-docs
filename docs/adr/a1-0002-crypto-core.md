English | [中文](a1-0002-crypto-core.zh-cn.md)

# A1-0002 Crypto core: twisted ElGamal on Baby Jubjub + Groth16

- Status: Accepted
- Date: 2026-09-24
- Scope: A.1

## Context

We need to hide balances and amounts under an account model, support regulator decryption, and verify on mainstream EVM chains at acceptable gas cost.

## Decision

1. **Encryption**: twisted ElGamal, `C = v·G + r·H`, `D_X = r·pk_X`, `pk = s⁻¹·H`. One commitment, multiple handles; the same amount is simultaneously encrypted to the payer, the payee, and the regulator.
2. **Curve**: Baby Jubjub, native inside the circuit; on-chain homomorphic addition uses point addition implemented in Solidity, and `x·G` uses a fixed-base windowed table.
3. **Proof**: Groth16 (circom + snarkjs) for the prototype; the production version will evaluate PLONK / UltraHonk to reuse a universal SRS.
4. **Public input packing**: scalars are packed into 3 words; points expose only the x coordinate, with y bound inside the circuit by "on the curve + parity bit"; the transfer circuit's public inputs went from 25 -> 15, and measured verification gas from 386k -> 316k. (The original plan of "SHA-256 compression inside the circuit down to 1 input" was rejected on 2026-09-24 during the prototype phase: it needs ~400k constraints and the proving time is unacceptable.)
5. **memo**: every transfer carries `(v, r)` encrypted with a Poseidon keystream to the payee and the regulator; the circuit enforces correctness, and nobody needs to solve a discrete logarithm.

## Alternatives

- Σ-protocol + Bulletproofs verified directly on BN254 G1: no trusted setup, but verification costs 2~4M gas, an order of magnitude higher.
- ElGamal on BN254 G1 + SNARK proof: curve operations are non-native inside the circuit, infeasible.
- Pedersen commitment + range proof: the payee must obtain the blinding factor off-chain; losing it means losing the coins.
- FHE: no user keys needed, but introduces threshold-network trust and a coprocessor dependency; assigned to A.3 / Track C.

## Consequences

- Positive: confidential transfer verification costs about 195k gas, total cost ~325k; proof generation takes seconds in the browser.
- Negative: Groth16 requires one trusted setup per circuit; the hand-written on-chain Baby Jubjub point addition needs an audit.
