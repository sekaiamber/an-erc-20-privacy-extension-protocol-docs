English | [中文](01-design.zh-cn.md)

# B.1 design (0.1.0-draft)

Status: `Draft`. Nothing here is implemented. Constraint counts, proving times and gas figures in this document are estimates, not measurements.

Track: [B, notes](../README.md). Opened by [ADR-0009](../../../adr/0009-track-b-notes.md).

## 0. What B.1 is

B.1 is the first Variant of the note model. Value is held in **notes**. A note is created by adding its commitment to a Merkle tree on chain and is spent by publishing its nullifier. There are no accounts, no ids and no balances on chain.

It reuses A.1's toolbox where it can: Baby Jubjub, Poseidon, Groth16, keys derived from a wallet signature, memos encrypted under a shared `D = r·H`, and the regulator key interface.

| | A.1 | B.1 |
| --- | --- | --- |
| Where value lives | One ciphertext balance per account id | Notes: commitments in a tree |
| Recipient on chain | The stable id `Poseidon(pk)` | Nothing |
| Sender on chain | The stable id | Nothing (the submitting address is visible, see §12) |
| Receiving twice | Two transfers to the same id | Two unrelated commitments |
| Incoming transfer while spending | Needs `pending` and fold | Does not interfere: a proof refers to a tree root |
| Circuits | transfer, unshield, fold | One: join-split |
| Wallet finds its money by | Reading its own account slot and its own events | Trial-decrypting every transaction of the token |
| Regulator view | Per account, from events filtered by id | All transactions in a block range |

## 1. Design principles

1. **The chain stores commitments and nullifiers, nothing else about users.** No public key, no id, no per-user slot.
2. **One circuit.** Transfer, mint, burn and the Wrapper crossings are the same statement with different public amounts.
3. **Every transaction looks the same.** Two nullifiers and two commitments are always published, whatever the real number of inputs and outputs.
4. **Proof-as-authorization.** A spend is authorised by a proof of knowing the owner's key. Anyone may submit the transaction.
5. **Regulation is enforced in the circuit.** A transaction whose regulator memo does not name its real inputs and the real owners and amounts of its outputs cannot be proven.
6. **A proof does not go stale.** It refers to a tree root, and every past root stays valid.

## 2. Cryptographic parameters

| Item | Value | Notes |
| --- | --- | --- |
| Curve, generators | Baby Jubjub; `H` for keys and randomness | As A.1. `G` is not needed: there are no homomorphic ciphertexts |
| Hash | Poseidon | Every use carries a distinct domain tag |
| Proof system | Groth16 (circom + snarkjs) | As A.1 |
| Private key | `s ∈ Z_l`, derived per family conventions §8 with purpose `"B.1 key"` | The same wallet derives several keys with `index` |
| Public key | `pk = s·H` | Never on chain |
| Note | `(v, pk, ρ)`: amount, owner key, random field element | Kept by the owner's wallet |
| Commitment | `cm = Poseidon(v, pk.x, pk.y, ρ)` | The only thing stored about a note |
| Nullifier | `nf = Poseidon(s, ρ, leafIndex)` | Computable only by the owner; one per tree position |
| Tree | Incremental binary Merkle tree, Poseidon, depth 32 | Append-only. 2³² leaves; a transaction appends two |
| Roots | Every root the tree has ever had is accepted | §3.3 |
| Amount width | `v < 2⁶⁴` for notes and public amounts | Guaranteed by the supply cap `2⁶⁴ − 1` |
| decimals | 6 | As A.1 |

## 3. Notes

### 3.1 Receiving code

The receiving code is the public key `pk`, 64 bytes, handed to payers off chain. It is stable and reusable, because it never appears on chain: each payment to it produces a commitment under a fresh `ρ`, and two commitments to the same key cannot be linked by anyone but the owner and the regulator.

There is no registration and no account opening.

### 3.2 Commitment and nullifier

- The commitment hides the amount and the owner. `ρ` makes it different every time.
- The nullifier includes the leaf index. If a payer creates two notes with the same `(v, pk, ρ)`, they sit at different positions and have different nullifiers, so both can be spent.
- Without `s` nobody can compute a note's nullifier, so nobody can tell which commitment a published nullifier refers to.

### 3.3 Tree and roots

- A transaction appends its two commitments as one pair: one hash for the pair, then 31 hashes up to the root.
- The contract records every root in `mapping(uint256 => bool)`. A proof is valid against any of them. A note that was in the tree under an old root is still in it, and the nullifier set stops double spending, so an old root is sound.
- Wallets use the latest root. An old root tells observers that the spent notes are older than it.

## 4. The join-split statement

One transaction spends up to two notes of the same owner and creates two notes.

```
v_in1 + v_in2 + v_pub_in  ==  v_out1 + v_out2 + v_pub_out
```

**Public inputs** (logical list; scalars are packed into words and points expose `x` plus a sign bit, as in A.1): `root, nf[2], cm[2], v_pub_in, v_pub_out, to, chainId, contract, regKeyId, pk_reg, D, memo_recv[2][3], memo_reg[5]`. About 21 field elements after packing.

**Private inputs**: `s`; for each input `(v, ρ, leafIndex, path)`; for each output `(v, pk, ρ, ref)`; `r`.

| # | Statement | Notes |
| --- | --- | --- |
| 1 | `pk_in == s·H` | One key owns both inputs |
| 2 | For each input: `cm_in = Poseidon(v, pk_in, ρ)` is at `leafIndex` under `root`, **or** `v == 0` | An input with `v == 0` is a dummy and skips the membership check |
| 3 | For each input: `nf == Poseidon(s, ρ, leafIndex)` | Dummies use a random `ρ`, so their nullifiers look like any other |
| 4 | For each output: `cm == Poseidon(v, pk, ρ)` and `pk` is on the curve | A key outside the prime-order subgroup yields a note nobody can spend; that is the payer's loss, as with any wrong receiving code |
| 5 | Every `v`, `v_pub_in`, `v_pub_out` is below `2⁶⁴` | |
| 6 | The balance equation above | |
| 7 | `D == r·H` | Shared by the two recipients and the regulator |
| 8 | For each output `j`: `memo_recv[j] == Enc(r·pk_j; v_j ‖ ρ_j ‖ ref_j)` | `ref` is a free field chosen by the payer, §6.1 |
| 9 | `memo_reg == Enc(r·pk_reg; inputs ‖ outputs)` | §6.2. For a real input the leaf index in the memo equals the one used in 2; for a dummy it is the "none" marker |
| 10 | Packing of `to`, `chainId`, `contract`, `regKeyId` and the sign bits | Binds the proof to this token, this chain and, for an exit, the public recipient |

Estimated size: 45,000 to 55,000 constraints, against 29,719 for A.1's transfer. The two Merkle paths account for most of the difference.

## 5. ERC-20 surface

Family conventions §1–§5 apply: the standard selectors, a trailing payload, a handle in the amount slot. Track B narrows them as described in the [Track document](../README.md).

| Call | Payload type | Public amounts | Meaning |
| --- | --- | --- | --- |
| `transferFrom(token, token, handle)` | `0x01` | none | Transfer between notes |
| `transferFrom(token, 0x0, amount)` | `0x81` | `v_pub_out = amount`, `to = 0x0` | Burn |
| `mint(amount, payload)` | n/a | `v_pub_in = amount` | Role issuance; `MINTER_ROLE` only |
| `wrapperBurn(0x0, to, amount, payload)` | n/a | `v_pub_out = amount`, `to` bound | Wrapper port: exit to the wrapped token |
| `wrapperMint(recipient, amount)` | n/a | `v_pub_in = amount` | Wrapper port: `recipient` is the whole payload |
| `transfer(to, x)` without payload | n/a | n/a | Reverts `NoPublicLedger()` |
| `balanceOf(a)` | n/a | n/a | `totalSupply()` for the token's own address, 0 otherwise |
| `approve`, `allowance` | n/a | n/a | Kept for interface completeness; they authorise nothing |

- `token` stands for the token's own address. `from` and `to` carry no information in a note transfer, so they are fixed to it. The standard event then reads as a movement inside the pool and does not look like a mint or a burn.
- Replay is stopped by the nullifiers: a payload can be executed once.
- `prepare` / `cancel` (conventions §6) are not part of 0.1.

### 5.1 Modules

| Module | B.1 0.1.0 |
| --- | --- |
| Role issuance | Supported: `mint` and the `0x81` burn |
| Wrapper port | Supported: `IPEPWrappable`, limit `wrappedOut` |
| Public ledger | Not supported. It could be added later on the same `v_pub_in` / `v_pub_out` |

This is the declared list of B.1 0.1.0 (07 §13.2). Supporting another module, the public ledger included, takes a new B.1 version.

### 5.2 Supply

`totalSupply()` is what the pool holds: minted, minus burned, minus what is currently out through the Wrapper. `issuedSupply() = totalSupply() + wrappedOut`, and the cap `2⁶⁴ − 1` applies to it. This is the accounting of the privacy-only composition of A.1.

## 6. Memos

Both memos use a Poseidon keystream derived from the shared secret `r·pk_X`, with the output index and the word index as domain tags.

### 6.1 Recipient memo

Three words per output: `v`, `ρ`, `ref`.

- The recipient computes `s·D`, opens the memo, recomputes the commitment and compares it with the one on chain. A match means the note is theirs.
- `ref` is a payment reference, for example an order number. The recipient cannot see who paid, so a merchant needs it to match a payment to an order. The circuit encrypts it and puts no constraint on its value.

### 6.2 Regulator memo

Five words: the two input leaf indices (or "none"), and for each output the owner key and the amount.

From these the regulator rebuilds a table of all notes: owner, amount, the transaction that created it and the transaction that spent it. The balance of a key at any time is the sum of its unspent notes. No one's cooperation is needed (ADR-0004, item 5).

- **Backwards is targeted.** A decrypted transaction names its inputs by leaf index, and the transaction that created a given leaf is public. Tracing where funds came from needs only those transactions.
- **Forwards is not.** Which later transaction spent a note is hidden, so tracing where funds went, or computing a balance, needs every transaction in the range.

## 7. Flows

### 7.1 Mint

The minter knows the recipient's receiving code. It builds a join-split with two dummy inputs, `v_pub_in = amount`, one output to the recipient and one zero-value output, and calls `mint(amount, payload)`.

A proof is required although the amount is public, because the regulator must learn the owner of the new note at the moment it is created.

### 7.2 Transfer

The payer's wallet picks one or two of its notes, creates the payee's note and a change note for itself, proves, and anyone submits `transferFrom(token, token, handle)` with the payload. The contract checks the root, checks that both nullifiers are new, verifies the proof, records the nullifiers, appends the pair and records the new root.

### 7.3 Burn

As a transfer, with `v_pub_out = amount` and `to = 0x0`. Change returns as a note.

### 7.4 Wrap and unwrap

- **Wrap** (notes to wrapped ERC-20): `PEPWrapper.wrap(token, 0x0, to, amount, payload)`. The proof binds `to` and `amount`. `wrappedOut` increases.
- **Unwrap** (wrapped ERC-20 to notes): `PEPWrapper.unwrap(token, recipient, amount)`, where `recipient` is a join-split payload with `v_pub_in = amount`. The token checks `amount ≤ wrappedOut`.

The Wrapper contract is used unchanged.

### 7.5 Things that cannot go wrong the way they do in A.1

- **Two transactions at once.** Each refers to a root that remains valid. Neither invalidates the other, so there is no `pending` and no fold.
- **A note spent twice.** The second transaction finds its nullifier already recorded and reverts.

## 8. Events and views

| Event | Fields | When |
| --- | --- | --- |
| `Transfer` | `(token, token, handle)`; `(0x0, token, amount)`; `(token, 0x0, amount)` | Note transfer; mint and unwrap; burn and wrap |
| `NoteTransfer` | first leaf index, new root, `nf[2]`, `cm[2]`, `regKeyId`, `D`, the two recipient memos, the regulator memo, `v_pub_in`, `v_pub_out`, `to` | Every operation |
| `Minted`, `Burned` | `amount` | Mint, burn |
| `RegulatorKeyRotated` | As A.1 | Rotation |

`NoteTransfer` has no indexed field that identifies a user. That is the point, and it is also why wallets cannot filter (§9).

Views: `root()`, `isKnownRoot(root)`, `isSpent(nf)`, `leafCount()`, `totalSupply()`, `issuedSupply()`, `wrappedOut()`, the regulator key views of conventions §9, `pep()` returning `B:1:<version>`, and the module probe.

## 9. Client

- **Scanning.** The wallet reads every `NoteTransfer` of the token in order. For each one it does one scalar multiplication `s·D` and tries both recipient memos. It cannot ask a node for "my" events.
- **Tree.** The same pass gives it every commitment, from which it keeps the tree frontier and the paths of its own notes. Asking a server for the path of one leaf would reveal which note is being spent.
- **Nullifiers.** The wallet computes the nullifiers of its notes and marks a note spent when its nullifier appears.
- **New device.** The key is derived again from the wallet signature and the token is scanned from its deployment block.
- **Merging.** A wallet that holds many small notes merges them two at a time. Spending `N` notes takes `N − 1` transactions.

## 10. Scenarios

Alice pays, Bob is a merchant, Carol and Dave are other customers.

| Step | What the user does | What the chain shows |
| --- | --- | --- |
| Opening | Bob signs once in his wallet and gets a receiving code | Nothing |
| Issuance | The issuer mints 100 to Alice | A mint of 100, two new commitments. Not to whom |
| Payment | Alice pays Bob 30 with reference "order 17" | Two nullifiers, two commitments, memos. Not who, not to whom, not how much |
| Receipt | Bob's wallet scans, finds a note of 30 and reads "order 17" | Nothing new |
| More receipts | Carol pays 50, Dave pays 20 | Two more transactions of the same shape. Not that the payee is the same |
| Merge and pay | Bob merges 30 and 50, then pays a supplier 90 from 80 and 20 | Two ordinary transactions, not linked to each other or to the receipts |
| Exit | Bob wraps 10 to his public address | An exit of 10 to that address. Not from which receipts |
| Regulator | The committee approves a view of a block range | Nothing new; the requester obtains owners, amounts and links for that range |

## 11. Privacy evaluation (family conventions §12)

| Goal | Achieved | Notes |
| --- | --- | --- |
| P1 Amount hiding | Full for transfers | Mint, burn, wrap and unwrap amounts are public |
| P2 Recipient | Hidden | No recipient identifier on chain |
| P3 Sender | Hidden on the ledger | The address that submits and pays gas is visible (§12) |
| P4 Transaction linkability | Unlinkable on the ledger | Residual links: the submitting address, timing, use of an old root |
| P5 Ledger-crossing linkability | Unlinkable except by amount and timing | Minting 100 and exiting 100 soon after links the two |
| S1 No inflation | Satisfied | Balance equation with range checks |
| S2 No double spend | Satisfied | Nullifier set |
| S3 No theft | Satisfied | Spending needs `s` |
| S4 Public mode unaffected | Not applicable | No public ledger at the token's address |
| S5 No freezing role | Satisfied | No freeze, seizure or forced-transfer interface |

## 12. Costs and limits

**Gas for one transaction (estimate).** Every operation costs about the same, because all of them verify the same proof and append a pair.

| Component | Estimate | Basis |
| --- | --- | --- |
| Base and calldata, about 1.1 KB of payload | 45k | |
| Groth16 verification, about 21 public inputs | 335k | A.1 measures 288k with 14 inputs |
| 32 Poseidon hashes on chain | 670k | Assumes 21k per hash; **not measured in this project** |
| Tree storage | 100k | |
| Two nullifiers and one root, new slots | 66k | |
| Events | 15k | |
| **Total** | **about 1.2M** | A.1 steady-state transfer: 467k measured |

The on-chain tree is the largest item and the least certain. Measuring it comes first in the prototype.

**Other limits.**

| Limit | Explanation |
| --- | --- |
| Proving time | Estimated 2 to 4 s in Node, against 1.3 to 1.5 s for A.1 |
| The submitter is visible | Alice submitting her own payment shows that her address made a private transaction at that moment. Hiding it needs a relayer and a fee mechanism, outside 0.1 |
| Scanning grows with the token, not with the user | Every wallet processes every transaction. A busy token will need an indexing service |
| Regulator views cannot be narrowed to one key | §6.2 |
| Two inputs per transaction | Fragmented balances need merging first |
| Crossings are public | Amounts and public addresses of mint, burn, wrap and unwrap are visible |

## 13. Scope of 0.1

In: the join-split circuit, role issuance, the Wrapper port, the regulator memo, the events and views above, and a client that scans, keeps notes and proves in the browser.

Not in: the public-ledger module, `prepare` / `cancel`, a relayer, a separate viewing key, batched tree insertion, more than two inputs.

## 14. Open decisions

Each has a default, which this document uses.

| # | Decision | Default | Why it might change |
| --- | --- | --- | --- |
| D1 | Tree depth | 32 | Each level costs about 21k gas. Depth 24 holds 8 million transactions and saves about 170k |
| D2 | Which roots are accepted | All past roots | A window of recent roots saves about 17k gas per transaction but lets proofs expire |
| D3 | Number of circuits | One for everything | A smaller circuit for mint would make issuance cheaper to prove |
| D4 | `from` / `to` and `balanceOf` | The token's own address; `balanceOf(token) = totalSupply()` | The privacy-only composition of A.1 returns 0 everywhere |
| D5 | Payment reference | One field per output | Could be left to applications |
| D6 | Mint needs a proof | Yes | Without it the regulator would not know the owner of a minted note until it is spent |
| D7 | Where the tree is updated | On chain, in the transaction | Batched insertion under a separate proof would remove most of the gas, at the price of notes that are spendable only after the batch and of someone who posts batches |
