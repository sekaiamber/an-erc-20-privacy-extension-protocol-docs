English | [中文](11-regulatory-committee.zh-cn.md)

# 11 Family tool: the Regulatory Committee

Status: `Draft` (2026-09-27). Decision record: [ADR-0006](adr/0006-regulatory-committee.md). Companion to [10-wrapper](10-wrapper.md): a second family tool, but deployed **per project or per team**, with a policy of that team's choosing.

## 1. Problem

Today the regulator is a single Baby Jubjub key: whoever holds `s_reg` can decrypt every amount ever transferred under that key (A.1 §2.4, family conventions §9). That is the right primitive but the wrong operational shape: one secret in one place, no membership, no policy, no audit trail of who looked at what.

The owner's requirement: *a contract that acts as custodian of the regulator's decryption capability, can add and remove members at any time, and lets those members view under a policy — majority, or a designated vote plus extra votes where the designated party alone cannot decrypt; several such policies must be able to coexist.*

## 2. The one hard fact: a contract cannot keep a secret

Everything on chain is public, so no contract can hold `s_reg`. What a contract *can* hold is a key that **nobody owns whole**: a threshold key. The regulator secret is split into shares `s_1 … s_n`; the group public key `pk_reg` is what tokens see; decrypting needs `t` members to each contribute a *partial decryption*, combined without anyone ever learning `s`.

Our ciphertexts are already threshold-friendly. The amount of a confidential transfer is recovered as

```
v·G = C_amt − s·D_reg
```

and `s·D_reg = Σ λ_i · (s_i·D_reg)` over any `t` shares with Lagrange coefficients `λ_i`: each member multiplies a public point by their own share, the combination is point addition. No member ever needs `s`. (The memo path needs one protocol amendment, §7.)

## 3. Roles of the committee contract

| Role | On chain | Off chain |
| --- | --- | --- |
| **Key custody** | `groupKey()` (= the token's `pk_reg`), `epoch()`, Feldman commitments of the current sharing | Shares `s_i` in members' wallets (derived per member, never exported) |
| **Membership** | member set, weights / roles, threshold, policy contract, epoch history | Distributed key generation and resharing protocols among members |
| **Access policy** | which approvals suffice: a pluggable `IViewPolicy` | — |
| **Requests & audit** | `request(scope, purpose)`, `approve(requestId, partial)`, `combined(requestId)`; every step is an event | Combination of partials (free) and the actual decryption / balance reconstruction in the regulator UI |
| **Token governance** | holds the token's `REGULATOR_ADMIN_ROLE`: `rotateRegulatorKey` only through committee epochs | — |

Tokens do not change: they keep `regulatorKey(keyId)` / `activeRegulatorKeyId` / `rotateRegulatorKey` exactly as in conventions §9; the committee is simply the address that owns the admin role and whose `groupKey()` is registered as the active key.

## 4. Protocols

### 4.1 Distributed key generation (DKG)

Pedersen / Feldman DKG over the Baby Jubjub scalar field among the initial `n` members, threshold `t`:

1. Each member `i` samples a random polynomial `f_i` of degree `t − 1`, posts Feldman commitments `f_i(k)·H` for its coefficients on chain (`commit(epoch, i, C_i[])`), and sends `f_i(j)` to member `j` encrypted to `j`'s wallet key (off chain).
2. Each member verifies received shares against the commitments (one scalar multiplication per coefficient, client side) and posts `ack` / `complaint`.
3. After the acknowledgement window, `s_i = Σ_j f_j(i)` is member `i`'s share and `pk_reg = (Σ_i C_i[0])⁻¹`-style aggregation for our twisted key (`pk = s⁻¹·H`; see §7 for why we move to `pk = s·H` at the same time). The contract computes `groupKey()` from the posted commitments — no trusted dealer, no one ever sees `s`.

Gas: commitments are `t` points per member (one-time); on-chain verification of complaints is optional (a complaint can be settled by publishing the disputed share, which is only ever useful against a cheating dealer).

### 4.2 Adding or removing members: resharing

Any `t` current members run a resharing round: each re-splits their share `s_i` into a fresh degree-`t' − 1` polynomial for the new member set `n'`, posts commitments, and delivers sub-shares. New shares are Lagrange-weighted sums of sub-shares. **`pk_reg` is unchanged**, so:

- no token has to rotate its key, and every historical ciphertext stays decryptable by the new committee;
- removed members' old shares become useless only if the *sharing* changed — which it did (a new polynomial). Proactive security for free.

Rotating `pk_reg` (a new DKG + `rotateRegulatorKey` on each token) is reserved for the case where a share is believed leaked and the team wants past ciphertexts to remain openable only by the old committee.

### 4.3 View request → approvals → combination

```
request(token, scope, purposeHash)                 // scope: an id, a tx list, or a block range
approve(requestId, epoch, partial[])               // member i posts s_i·D for each D in scope (or a hash of them)
combine(requestId) -> (s·D)[]                      // anyone, once policy(requestId) is satisfied; on or off chain
```

Partials are verified with a **Chaum–Pedersen proof** that `partial = s_i·D` for the member's committed public share `s_i·H` (two scalar multiplications per partial on chain, or off chain with the proof stored by hash). Combination is `Σ λ_i·partial_i`. Everything is logged: who asked, for what, who approved, when — the audit trail regulators themselves are usually required to keep.

Cost model: on-chain verification is ≈ 2 × 8k gas (point adds via the A.1 library) plus ≈ 2 scalar multiplications (≈ 550k each with the generic `mul`; ≈ 80k with a fixed-base table per member) per partial. For bulk viewing the partials and proofs go off chain and only their hash is anchored; per-transfer verification on chain is for high-stakes requests.

## 5. Policies as access structures

The contract asks a pluggable `IViewPolicy.satisfied(requestId)`; the *cryptographic* structure must match the *policy* structure, otherwise approvals would not be enough (or too much) to decrypt.

| Policy | Access structure | Sharing |
| --- | --- | --- |
| Majority (`t` of `n`) | threshold | Shamir over the scalar field |
| Designated + extra; designated alone cannot decrypt | `s = a + b`; `a` held by the designated party, `b` shared `t`-of-`n` among the rest | two independent Shamir instances; combination adds the two recovered points |
| Weighted / departmental | general monotone structure | linear secret sharing (LSSS) or replicated shares; same `approve` / `combine` interface |

A team picks a policy at deployment (or upgrades by resharing into a new structure). Several committees with different policies coexist; a token binds to exactly one at a time via its active `keyId`.

## 6. Interface sketch

```solidity
interface IRegulatorCommittee {
    function groupKey() external view returns (BabyJubjub.Point memory);   // = the token's active pk_reg
    function epoch() external view returns (uint64);
    function isMember(address) external view returns (bool);
    function threshold() external view returns (uint32);                    // or policy-specific
    function policy() external view returns (address);                      // IViewPolicy

    function request(address token, bytes calldata scope, bytes32 purposeHash) external returns (uint256 requestId);
    function approve(uint256 requestId, bytes calldata partialsOrHash, bytes calldata proof) external;
    function combined(uint256 requestId) external view returns (bool ready);

    event MemberSetChanged(uint64 indexed epoch, address[] members, uint32 threshold);
    event ViewRequested(uint256 indexed requestId, address indexed token, address indexed by, bytes scope, bytes32 purposeHash);
    event ViewApproved(uint256 indexed requestId, address indexed member, uint64 epoch);
    event ViewReady(uint256 indexed requestId);
}
```

`RegulatorCommittee` (Shamir) and `RegulatorCommitteeDesignated` (two-level) are the first two implementations; both sit in `contracts/contracts/family/` beside the wrapper.

## 7. Protocol amendment required: memo keys from `r·H`

A.1's memo uses an extra ECDH point `E = e·H` and derives the pad from `e·pk = s⁻¹·E`. Opening it needs `s⁻¹·E` — a *division* by the shared secret, which does not split across shares. Fix (A.1 v0.4, B.1 v0.2):

- derive both memo pads from **`r·H`**: the sender knows `r`; the recipient computes `s_recv·D_recv = r·H`; the regulator computes `s_reg·D_reg = r·H` (threshold-friendly);
- delete `E`, `e`, and the `E`-related constraints and public inputs: −1 scalar multiplication (251 bits) in the transfer circuit, −2 public inputs (15 → 13), −64 bytes of payload;
- and switch the key convention to `pk = s·H` (plain ElGamal / standard Baby Jubjub keys) so that DKG aggregation is a point sum; decryption becomes `C − s·D` as today (the twisted form only moved where the inverse sits).

Both memos then carry the same plaintext `(v, r)` under pads derived from the same point; that is intended (both parties are meant to learn exactly this) and the pads are still one-time because `r` is fresh per transfer.

## 8. Regulator UI

The dapp's regulator view gets two modes: **single key** (paste `s_reg`, decrypt everything, today's design) and **committee** (a member signs in with their wallet, derives their share, and either posts partials for an open request or combines the posted partials into the decrypted table). Balance reconstruction per id is the same code in both modes.

## 9. Open points

- Whether on-chain Chaum–Pedersen verification is mandatory or optional per request (draft: optional, hash-anchored by default).
- Share derivation: from the member's wallet via EIP-712 like account keys (draft: yes, so a member never stores a file), with the DKG transcript rebuildable from chain + the member's wallet.
- Whether the committee may also hold `MINTER_ROLE` for Track B tokens (draft: no — issuance and oversight stay separate).
