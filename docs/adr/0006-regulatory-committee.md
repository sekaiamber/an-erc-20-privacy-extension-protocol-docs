English | [中文](0006-regulatory-committee.zh-cn.md)

# 0006 Regulator as a threshold committee contract; crypto core switched to plain ElGamal

- Status: Accepted (§3 shipped 2026-09-28; §1–§2 prototyped 2026-09-29, see "Implementation revision" below)
- Date: 2026-09-27
- Scope: family (tool); protocol amendment for A.1 v0.4 / B.1 v0.2

## Context

The regulator is currently one private key. The owner asked for a contract that custodies the regulatory decryption capability, with dynamic membership and pluggable approval policies (majority; designated vote plus extra votes where the designated party alone cannot decrypt), deployable per project like a second family tool. A contract cannot hold a secret, so the only sound realisation is a threshold key whose shares live with members and whose membership, policy and audit trail live on chain.

## Decision

1. Add [11-regulatory-committee](../11-regulatory-committee.md): `IRegulatorCommittee` (group key, epoch, members, policy, request / approve / combined) with DKG, resharing that keeps `pk_reg` fixed, and Chaum–Pedersen-verified partial decryptions. First implementations: Shamir majority and the two-level "designated + extra" structure. Deployed per project / team; several coexist.
2. Tokens are unchanged: the committee holds a token's `REGULATOR_ADMIN_ROLE` and its `groupKey()` is the active `pk_reg` (family conventions §9).
3. **Protocol amendment (shipped 2026-09-28 as A.1 0.4.0 / B.1 0.2.0)**: plain ElGamal — `pk = s·H`, one shared `D = r·H`, one `C_X = v·G + r·pk_X` per party; memo pads derived from each party's shared secret `r·pk_X` (= `s_X·D`); `E` / `e` removed. Purpose: regulator-side decryption and memo opening become scalar multiplications (threshold-splittable) and DKG aggregation a point sum. (The first draft said "pads from `r·H`", which is wrong: under plain ElGamal `r·H` is public.)
4. The policy structure and the secret-sharing structure must match; a policy contract is only valid together with the sharing it was deployed with.

### Implementation revision (2026-09-29, prototype)

- **Policy = AND over groups, no separate policy contract.** The secret is `s = Σ_g s_g`, each group an independent `t_g`-of-`n_g` Shamir sharing; viewing and membership votes both need every group's threshold. One `RegulatorCommittee` contract covers majority (one group) and designated + extra (a one-member group plus a t-of-n group), so item 4 holds by construction. OR-structures and weights need LSSS and are not implemented.
- **Partials are encrypted to the requester.** Plaintext partials on chain would let anyone combine `s·D`; instead each member masks `[P_1…P_m, c, z]` with pads from `k·X_requester`, and the chain holds only the masked event and a block anchor. The Chaum–Pedersen proof is a batch DLEQ, verified off chain by the requester.
- **Shares are never stored.** They live encrypted in `Dealt` events, and member keys are derived from an EIP-712 wallet signature, so they can always be recovered. Cost: a removed member can rebuild its old-epoch share, and an old-epoch quorum can still decrypt by colluding off chain; on a suspected leak, deploy a new committee and rebind the tokens.
- Share delivery, resharing (the first `t_g` old members deal; constant terms equal old public shares), complaint-fails + `restart`, measured gas and open points: [11 §4–§10](../11-regulatory-committee.md).

## Alternatives

- Keep one key and put it in a multisig-controlled vault (MPC custody service): moves the trust to the custodian and gives no on-chain audit of viewing; rejected.
- Encrypt to *every* member (n ciphertexts per transfer): any single member can decrypt, no threshold; payload grows with n; rejected.
- Threshold FHE / re-encryption networks: heavier machinery for the same result; out of scope.

## Consequences

- Positive: no single point of compromise for regulatory access; membership changes without key rotation; every view is an on-chain record; policies are swappable.
- Negative: two more family contracts and a DKG / resharing client; one more circuit revision for A.1 (though it shrinks the circuit: −1 scalar multiplication, −2 public inputs, −64 payload bytes).
- The single-key mode remains valid (a committee of one); the dapp's regulator view (`/tools/regulator`) supports both single-key and committee modes.
