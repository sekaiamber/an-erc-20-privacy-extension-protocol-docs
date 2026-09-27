English | [中文](0004-regulatory-access-principles.zh-cn.md)

# 0004 Regulatory access principles

- Status: Accepted
- Date: 2026-09-24

## Context

One of the project goals is to "leave room for regulatory intervention": when a regulator intervenes, the real transfer amounts and holdings can be resolved. This capability must be defined without weakening the privacy of ordinary users and without introducing any role that can unilaterally dispose of assets.

## Decision

All Tracks / Variants comply with:

1. **Cryptographically enforced, not voluntary cooperation**: regulator readability is part of transaction validity. A transaction that lacks the regulator ciphertext, or whose regulator ciphertext is inconsistent with the actual amount, cannot pass verification.
2. **Read-only**: the regulator key can only decrypt; the protocol provides no freeze, seizure, or forced-transfer interface. If an issuer needs such capabilities, they are implemented through independent policy hooks and disclosed separately.
3. **Rotatable, history preserved**: the regulator public key can be rotated; old public keys are kept permanently, and every transaction records the key number used.
4. **Thresholding is a deployment choice**: the protocol sees only one regulator public key; whether that private key is t-of-n sharded is decided by the deployer.
5. **Reconstructable without anyone's cooperation**: the regulator can reconstruct the balance of any account at any point in time using only on-chain data and its own private key.

The concrete mechanisms (ciphertext format, decryption flow) are defined by each Variant.

## Alternatives

- Voluntary viewing-key disclosure (Zcash model): does not meet the goal of "always resolvable when a regulator intervenes"; a malicious actor can refuse to disclose.
- Built-in freeze authority: conflicts with the security goal of "not introducing any role that can unilaterally dispose of assets".

## Consequences

- Positive: the regulatory capability is verifiable and auditable, and ordinary users' privacy is unaffected.
- Negative: leaking the regulator private key equals network-wide amount transparency; this must be mitigated through thresholding and key management. This is an accepted risk.
