English | [中文](11-regulatory-committee.zh-cn.md)

# 11 Family tool: the Regulatory Committee

Status: `Prototype` (2026-09-29; designed 2026-09-27). Contracts, client, tests and a live BSC testnet run exist; see §9. Decision record: [ADR-0006](adr/0006-regulatory-committee.md). Companion to [10-wrapper](10-wrapper.md): a second family tool, but deployed **per project or per team**, with a policy of that team's choosing.

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
| **Key custody** | `groupKey()` (= the token's `pk_reg`), epochs, each member's committee key per epoch, Feldman commitments and encrypted shares as `Dealt` events | Shares, recovered on demand from chain data plus the member's wallet (never stored) |
| **Membership** | groups (threshold + members) per epoch, proposals and votes, dealing / acknowledgement / complaint state | Dealing and share verification |
| **Access policy** | an AND over groups: a view needs `threshold(g)` members of every group | — |
| **Requests & audit** | `request`, `approve`, `ViewReady`; every step is an event, and the block of every dealing, approval and request is stored | Partial decryptions (encrypted to the requester), their verification, combination and the decrypted table |
| **Token governance** | `bindToken`: rotates a token's regulator key to `groupKey()` using the `REGULATOR_ADMIN_ROLE` the token admin granted | — |

Tokens do not change: they keep `regulatorKey(keyId)` / `activeRegulatorKeyId` / `rotateRegulatorKey` exactly as in conventions §9; the committee is simply an address holding the admin role whose `groupKey()` becomes the active key.

## 4. Protocols

Notation: `H` is the key generator (`pk = s·H`, plain ElGamal, §7). The secret is `s = Σ_g s_g`; group `g` holds a Shamir sharing of `s_g` with threshold `t_g`. Member indices are 1-based positions in their group. Every member has a **committee key** `(x, X = x·H)`, derived from an EIP-712 signature of the member's wallet over the domain `(PEP, 1, chainId, committee)` with purpose `"Regulator committee key"`, and registered with `registerKey(X)`.

**Share delivery.** A dealer samples `k`, posts `K = k·H`, and for recipient `j` posts `enc_j = f(j) + Poseidon(Poseidon(k·X_j), j) mod p`. Recipient `j` computes the same pad from `x_j·K`. Shares therefore live on chain, encrypted; a member re-derives its key from the wallet and recovers its share whenever needed.

### 4.1 Genesis: distributed key generation (DKG)

The constructor fixes the genesis groups. Epoch 1 waits until every member has registered a key (`Registering`), then snapshots the keys and opens dealing.

1. Every member `d` of group `g` samples a polynomial `f_d` of degree `t_g − 1`, posts the Feldman commitments `f_d(k)·H` and the encrypted shares for its group (`deal`). The contract adds `f_d(0)·H` into the group part `pk_g`.
2. Once every group is fully dealt, every member recovers `x_j = Σ_d f_d(j)` and checks each sub-share against its dealer's commitments (`f_d(j)·H = Σ_k j^k·C_d[k]`), and that every commitment lies in the prime-order subgroup. It then `ack`s, or `complain`s, which fails the epoch; `restart()` retries the same configuration under a new epoch number.
3. The last acknowledgement activates the epoch: `groupKey = Σ_g pk_g`, checked on chain to be a non-identity point of the prime-order subgroup. Nobody ever holds `s`.

### 4.2 Membership change: resharing with an unchanged key

1. An active member `propose`s new groups (the number of groups is fixed per committee; every proposed member must already have registered a key). Members `vote`; the proposal passes when **every current group reaches its threshold of votes**, the same rule as viewing. The new epoch opens immediately.
2. In each group the first `t_g` members of the current epoch deal: dealer `d` shares its current share with a fresh polynomial `f_d` of the new group's degree, `f_d(0) = x_d`.
3. New member `j` recovers `x'_j = Σ_d λ_d · f_d(j)` with Lagrange coefficients `λ_d` over the dealers' old indices, verifies every sub-share, and verifies that each dealer's constant-term commitment equals that dealer's old public share `x_d·H` (computable from the previous epoch's commitments). The last acknowledgement activates the epoch.

`groupKey()` does not change, so no token rotates its key and every historical ciphertext remains readable by the new committee. Requests opened in the old epoch stop accepting approvals.

**Limit of proactive security.** Because shares are recoverable from chain data and the wallet, a removed member can still rebuild its old-epoch share. Any `t_g` members of an old epoch (for every group) can therefore still decrypt together off chain. Resharing removes a member from the *audited* process, not from what an old quorum can do by colluding. When a leak is suspected, rotate instead: new committee (new DKG) and `bindToken` on every token; past ciphertexts stay readable only under the old key.

### 4.3 View request → approvals → combination

```
request(token, fromBlock, toBlock, account, purpose)   // any active member; purpose is emitted in clear
approve(requestId, K, blob)                             // members of the request's epoch, while it is current
ViewReady(requestId)                                    // once every group has t_g approvals
```

**Scope.** Every `ConfidentialTransfer` and `ConfidentialTransferPrepared` event of `token` in `[fromBlock, toBlock]` whose `regKeyId` maps to `groupKey()`, optionally only those where `account` is sender or recipient, ordered by `(block, logIndex)`. Each member derives this list `D_1 … D_m` from chain data; nobody can slip in a point that is not a real transfer.

**Partials.** Member `i` computes `P_ij = x_i·D_j` and one batch Chaum–Pedersen proof that `log_H X_i = log_{D_j} P_ij` for all `j`: random weights `ρ_j = Poseidon(seed, j)` aggregate `D* = Σ ρ_j D_j`, `P* = Σ ρ_j P_j`, and a single DLEQ proof `(c, z)` covers them. The Fiat–Shamir seed binds `(chainId, committee, requestId, X_i, D_1..m, P_1..m)`, so a proof cannot be replayed into another request. `X_i` is the member's public share, computed by anyone from the epoch's commitments.

**Partials are never posted in clear.** If `t_g` plaintext partials of every group were public, anyone could combine `s·D_j` and read the amounts. Each member masks `[P_1 … P_m, c, z]` word by word with pads derived from `k·X_requester` and posts `K = k·H` with the masked words. Only the requester can open them.

**Combination (requester, off chain).** Open every approval, verify its proof against the member's public share, and keep `t_g` verified approvals per group. Then `s·D_j = Σ_g Σ_{i∈S_g} λ_i·P_ij`. Each memo opens with the pads from `s·D_j`, and every amount is checked with `C_reg − s·D_j = v·G`.

Offline, any quorum can do all of this without the contract. The on-chain flow is the audited path for an honest committee, not a technical barrier.

## 5. Policies as access structures

The access structure is an **AND of thresholds**, and the sharing is built to match it, so approvals that satisfy the policy are exactly the approvals that can decrypt.

| Policy | Groups | Why it holds |
| --- | --- | --- |
| Majority (`t` of `n`) | one group, threshold `t` | plain Shamir |
| Designated + extra; designated alone cannot decrypt | group A = {designated}, threshold 1; group B = the others, threshold `t` | `s = s_A + s_B`: the designated member holds `s_A` and needs `t` members of B for `s_B`; B without A lacks `s_A` |
| Departments (each must agree) | one group per department | every department contributes its part |

OR-structures ("either the compliance team or the court") and weighted votes need linear secret sharing and are not implemented. Several committees with different structures coexist; a token binds to one at a time through its active `keyId`.

## 6. Interface

`IRegulatorCommittee` / `RegulatorCommittee` in `contracts/contracts/family/`:

```solidity
// lifecycle
constructor(string name, GroupConfig[] genesis);                 // GroupConfig = (uint32 threshold, address[] members)
function registerKey(Point pk) external;
function deal(uint64 epoch, Point[] commitments, Point K, uint256[] enc) external;
function ack(uint64 epoch) external;
function complain(uint64 epoch, address dealer, uint8 reason) external;
function restart() external;
function propose(GroupConfig[] groups) external returns (uint256 proposalId);
function vote(uint256 proposalId) external;
// tokens and viewing
function bindToken(address token) external;
function request(address token, uint64 fromBlock, uint64 toBlock, address account, bytes purpose) external returns (uint256);
function approve(uint256 requestId, Point K, uint256[] blob) external;
// views
function groupKey() external view returns (Point memory);
function currentEpoch() / latestEpoch() / groupCount() / isMember(address);
function epochInfo(uint64) / groupOf(uint64, uint256) / slotOf(uint64, address) / memberKey(address) / memberKeyAt(uint64, address);
function dealtAt(uint64, address) / hasAcked(uint64, address) / proposal(uint256) / hasVoted(uint256, address);
function viewRequest(uint256) / approvedAt(uint256, address) / requestCount() / proposalCount();
// events: MemberKeyRegistered, EpochCreated, GroupConfigured, DealingStarted, Dealt, Acked, Complained,
//         EpochActivated, EpochFailed, Proposed, Voted, TokenBound, ViewRequested, ViewApproved, ViewReady
```

`dealtAt`, `approvedAt` and `ViewRequest.requestedAt` store the block of each event, so a client fetches it with a one-block `eth_getLogs` instead of a range scan. The client (`test/family/lib/committee.ts`, copied to the dapp as `lib/family/committee.ts`) implements dealing, share recovery and verification, partials and proofs, masking and combination.

**Interface levels (ERC-165).** Tokens do not depend on any of this: they only hold a regulator public key and a role allowed to rotate it. The levels exist so the dapp can recognise a key holder.

| Level | Interface (ERC-165 id) | Declares | What the dapp does |
| --- | --- | --- | --- |
| 1 | `IRegulatorKeyHolder` (`0x96ca07c9`) | `name()`, `groupKey()` | Names the holder, matches its key against a token's keys, decrypts through the offline job (§8) |
| 2 | `IRegulatorCommittee` (`0x5d0a3fce`, extends level 1) | the whole protocol above, plus the off-chain formats of §4 | Drives it fully: administration, requests, approvals, combination |

A team with its own design (another sharing scheme, an MPC custodian, a multisig) can declare level 1 and use the offline job; implementing level 2 gets the full screens. Declaring nothing still works through the offline job.


## 7. Protocol amendment required: plain ElGamal, memo keys from `r·pk_X` (shipped as A.1 0.4.0)

A.1's memo uses an extra ECDH point `E = e·H` and derives the pad from `e·pk = s⁻¹·E`. Opening it needs `s⁻¹·E` — a *division* by the shared secret, which does not split across shares. Fix (A.1 v0.4, B.1 v0.2):

- **Careful**: "`pk = s·H`" and "pads from `r·H`" cannot both hold — under plain ElGamal `D = r·H` is a public point. The right combination: the ciphertext becomes one shared `D = r·H` plus one `C_X = v·G + r·pk_X` per party; each party's shared secret is **`r·pk_X`** (the sender knows `r`; party X computes `s_X·D`, threshold-friendly), and each memo pad is derived from that party's own `r·pk_X`;
- delete `E`, `e`, and the `E`-related constraints and public inputs: −1 scalar multiplication (251 bits) in the transfer circuit, −2 public inputs (15 → 13), −64 bytes of payload;
- the key convention becomes `pk = s·H` (plain ElGamal) so that DKG aggregation is a point sum; decryption stays `C_X − s·D`. The twisted form's benefit (a shared commitment) buys nothing under Groth16.

Both memos carry the same plaintext `(v, r)` under different pads (each party's own `r·pk_X`); `r` is fresh per transfer, so the pads are one-time.

## 8. Regulator UI

Decryption only ever needs `s·D` for each regulated transfer, and every value is self-checking: the memo opened with it must reproduce the regulator ciphertext (`C_reg − s·D = v·G`). So the dapp does not need to understand or trust how a regulator holds its key. It asks where `s·D` comes from.

**Family tools → Regulator view** (`/tools/regulator`):

1. **Token.** Pick an A.1 or B.1 token; the page lists every regulator key it has had and labels those it recognises.
2. **Source of `s·D`:**

| Source | For | How |
| --- | --- | --- |
| Secret | a key kept as a file or in a vault | paste `s_reg`; computed locally |
| Wallet | a regulator whose only credential is one wallet | `s = keccak256(EIP-712 signature) mod L`, domain `(PEP, 1, chainId)`, purpose `"Regulator key"`, an `index`; not bound to a token, so the key exists before the token and can serve several |
| Committee | a level-2 contract (the family template or a compatible one) | request, approvals, combination (§4.3); a level-1 contract is sent to the offline job |
| Offline job | anything else: a custom contract, an MPC custodian, a multisig, an air-gapped machine | export a job, the holder computes `s·D` its own way, import the result |

3. **Results.** One table of decrypted transfers and one of net change per confidential id (confidential transfers plus public shield / unshield, mint / burn and wrap / unwrap amounts). A scope covering the token's whole life gives balances. One scan is capped by the same RPC budget as the token pages.

**Offline job format.** The job (`pep-regulator-job/1`) lists the scope's items in order, each with `D`, `C_reg` and the regulator memo, plus the regulator keys and the public flows; `jobId` is the keccak256 of its canonical JSON, so an edited job is rejected. The result (`pep-regulator-result/1`) is `{ jobId, sD: [[x, y], …] }`, one point per item in the same order, decimal strings. A threshold system combines its own partials before answering. A wrong point shows up as a failed row.

**Setting the key at deployment.** The A.1 and B.1 deploy forms take the regulator public key from any of: a generated or pasted secret, the wallet derivation above, a pasted public key, or a key holder's `groupKey()`.

**Family tools → Committee admin** (`/tools/committee`) runs a level-2 committee: deployment (presets for majority and designated + extra), member keys, dealing / verification / acknowledgement / complaints / restart, membership votes, and granting and binding a token.

## 9. Measured cost (BSC testnet, 2026-09-29)

Committee of four: designated member (1 of 1) and a 2-of-3 group; one membership change. Committee `0xa1ca936E528fD907866a6939dcBCD877074b5d51`, test token CTT `0xd2D3Ebe235302D98C3321F084C937c0Fb08F4cb0` (the live A.1 / B.1 tokens keep their regulator keys).

| Step | Gas |
| --- | --- |
| Deploy | 3,620,075 |
| `registerKey` (the last genesis key also snapshots keys and opens dealing) | 73,773–79,223 (last 290,810) |
| `deal` (threshold 2, three recipients) | 113,801–165,280 |
| `ack` (the last genesis ack also checks the group key's subgroup) | 58,084–75,184 (last 2,263,815) |
| `bindToken` (the token checks the new key's subgroup) | 2,275,294 |
| `request` | 146,473 |
| `approve` (one transfer in scope) | 83,112–96,135 |
| `propose` / `vote` (last vote opens the new epoch) | 348,030 / 66,520 (last 744,104) |
| Full run, including a real 0x01 transfer | 12,641,431 |

Reproduce with `npx hardhat run scripts/family/committee-e2e-bsc.ts --network bscTestnet` in `contracts/`, then check the dapp's read path with `scripts/check-regulator.mts` in `dapp/`.

## 10. Open points

- **Liveness.** Genesis needs every member to deal, and every epoch needs every new member to acknowledge; one absent member stalls it. A timeout that drops non-responders is not implemented.
- **Complaint griefing.** Any member of a dealing epoch can fail it. Complaints are not adjudicated on chain; a dispute resolution that reveals the disputed share would settle who cheated.
- **Rogue-key bias in DKG.** The last dealer sees the others' commitments before dealing and can bias `groupKey`. Accepted for a regulator key; commit-then-reveal fixes it if needed.
- **Third-party audit of partials.** Partials are encrypted to the requester, so only the requester can check them. Revealing `k·X_requester` for a disputed approval would let anyone verify it.
- **Membership of the committee in `MINTER_ROLE`**: no. Issuance and oversight stay separate.
