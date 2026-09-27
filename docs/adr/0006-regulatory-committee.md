English | [中文](0006-regulatory-committee.zh-cn.md)

# 0006 Regulator as a threshold committee contract; memo keys from r·H

- Status: Proposed
- Date: 2026-09-27
- Scope: family (tool); protocol amendment for A.1 v0.4 / B.1 v0.2

## Context

The regulator is currently one private key. The owner asked for a contract that custodies the regulatory decryption capability, with dynamic membership and pluggable approval policies (majority; designated vote plus extra votes where the designated party alone cannot decrypt), deployable per project like a second family tool. A contract cannot hold a secret, so the only sound realisation is a threshold key whose shares live with members and whose membership, policy and audit trail live on chain.

## Decision

1. Add [11-regulatory-committee](../11-regulatory-committee.md): `IRegulatorCommittee` (group key, epoch, members, policy, request / approve / combined) with DKG, resharing that keeps `pk_reg` fixed, and Chaum–Pedersen-verified partial decryptions. First implementations: Shamir majority and the two-level "designated + extra" structure. Deployed per project / team; several coexist.
2. Tokens are unchanged: the committee holds a token's `REGULATOR_ADMIN_ROLE` and its `groupKey()` is the active `pk_reg` (family conventions §9).
3. **Protocol amendment**: derive memo pads from `r·H` and drop `E` / `e`; switch the key convention to `pk = s·H`. Both changes are needed so that regulator-side decryption is a scalar multiplication (threshold-splittable) and DKG aggregation is a point sum. Scheduled as A.1 v0.4 and B.1 v0.2 (new transfer circuit, redeploy).
4. The policy structure and the secret-sharing structure must match; a policy contract is only valid together with the sharing it was deployed with.

## Alternatives

- Keep one key and put it in a multisig-controlled vault (MPC custody service): moves the trust to the custodian and gives no on-chain audit of viewing; rejected.
- Encrypt to *every* member (n ciphertexts per transfer): any single member can decrypt, no threshold; payload grows with n; rejected.
- Threshold FHE / re-encryption networks: heavier machinery for the same result; out of scope.

## Consequences

- Positive: no single point of compromise for regulatory access; membership changes without key rotation; every view is an on-chain record; policies are swappable.
- Negative: two more family contracts and a DKG / resharing client; one more circuit revision for A.1 (though it shrinks the circuit: −1 scalar multiplication, −2 public inputs, −64 payload bytes).
- The single-key mode remains valid (a committee of one) and is what the dapp's regulator view supports first.
