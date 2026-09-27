English | [中文](05-threat-model.zh-cn.md)

# 05 Threat Model

Status: `Draft`

## Attacker Types

| Attacker | Capabilities |
| --- | --- |
| On-chain observer | Reads all blocks, state, event logs and the mempool; can run arbitrary analysis |
| Counterparty | Is one party of a private transfer and holds the plaintext information of that transaction |
| Relayer / sequencer | Sees the origin of transaction submission (IP, time); can delay or reject transactions but cannot tamper with them |
| Malicious user | Attempts to construct invalid proofs, double spend, or steal assets |
| Token issuer | Controls the admin privileges of the token contract (if any); may attempt to freeze or track users |
| Threshold network members (if an FHE solution is adopted) | Hold partial decryption shares; collusion beyond the threshold enables decryption |

## Information to Protect

- Each user's balance in the private state.
- The amount, sender and receiver of in-private transfers.
- The link between multiple private operations of the same user.

## Information Explicitly Not Protected

- The fact that a user participates in the privacy features (shield / unshield is public).
- The amount and public address of shield / unshield.
- The time and block in which private operations occur.
- The total balance of the private pool.
- Network-layer metadata.

## Security Assumptions

- Consensus security and state correctness of the underlying EVM chain.
- Standard security assumptions of the cryptographic primitives used (hash functions, elliptic curves, proof systems).
- If a proof system with a trusted setup is adopted, at least one party in the setup ceremony is assumed to be honest.
- Users' private keys and viewing keys are not leaked.

## Typical Attack Scenarios

Each of the following scenarios should have a corresponding defense, or an explicit "accept this risk" statement, at both the specification and implementation stages:

1. **Timing correlation**: unshielding the same amount immediately after shielding lets an observer link the two operations.
2. **Amount fingerprinting**: using unusual, non-round amounts makes them traceable inside the pool.
3. **Anonymity set too small**: when there are very few users in the pool, any operation is easy to infer.
4. **Gas source linkage**: after unshielding to a new address, that address's gas is provided by the old address.
5. **Proof forgery**: exploiting a circuit vulnerability or a verifier contract bug to mint private balance.
6. **nullifier replay**: the same note is spent twice.
7. **Frontend / client leakage**: plaintext is sent to a remote service during proof generation.
8. **Admin privilege abuse**: upgrading the contract to introduce a backdoor.

The first four are mitigated mainly by usage guidance and ecosystem support; the last four are the direct responsibility of the protocol and its implementation.

## Family-level Accepted Risks

The following risks are explicitly accepted by design; individual Variants need not argue them again:

| Risk | Description | Mitigation |
| --- | --- | --- |
| Linkability of public ↔ confidential transfers | The address, amount and time of `0x03` / `0x04` are public; unshielding the same amount immediately after shielding is self-exposure | Usage guidance: keep funds on the confidential ledger as much as possible, unshield only the amount needed, round the amounts |
| Confidential id is a stable pseudonym | The payment history of the same id is linkable | `0x02` stealth changes the id on every receipt |
| Race on `includePending` | When the proof is bound to a state that includes pending, the proof becomes invalid if a new receipt arrives before it lands on chain | The user redoes the proof; the default binds only available and is unaffected |
| Sending the wrong payload type | A public transfer sent to a confidential id, etc. | The protocol does not backstop this; validated by the frontend (ADR-0003) |
| Regulator private key leakage | All amounts network-wide become transparent to whoever holds the leaked key | Thresholdization + rotation (ADR-0004) |
| Denial of service / resource-exhaustion attacks | The attacker can only make others spend more gas or temporarily fail to complete an action, and must keep paying to do so | Only recorded during the research phase; A.1's checklist is in Appendix A of [tracks/track-a/variant-1/02-security-review.md](tracks/track-a/variant-1/02-security-review.md) |
