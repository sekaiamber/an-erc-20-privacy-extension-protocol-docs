English | [中文](01-design.zh-cn.md)

# A.1 Detailed Design

Version: `0.3.1-draft`. Status: `Draft`. Date: 2026-09-27

> 0.3.1: **Security fix F14** — the public recipient `to` of `0x04` is packed into the proof (`w2 = amount | signBits<<48 | to<<64`); before, a relayer or front-runner could rewrite `to` and take the whole unshield. Circuit 16,622 → 17,358 constraints, still 7 public inputs. `pep()` = `A:1:0.3.1`.
> 0.3.0: Added the A.1-private type `0x80` pure fold (proves only knowledge of the private key, no amounts involved, §4.6 / §5.3), which fully resolves finding F1 of the security self-review; accounts gain `lastReceivedAtBlock` (same slot as `nonce`), and the client event window tightens to `[foldedAtBlock, lastReceivedAtBlock]`. `pep()` = `A:1:0.3.0`.
> 0.2.5: Accounts gain `foldedAtBlock` (block number of the owner's last spend, packed into the same slot as `nonce`, zero extra gas), which gives the client an exact event window for rebuilding pending (§4.3). `pep()` = `A:1:0.2.5`.
> 0.2.4: Implemented the family descriptor `pep()` = `A:1:0.2.4` (07 §10); ERC-165 keeps only the `IPEP` id.
> 0.2.3: Revised per the first-round security self-review ([02-security-review.md](02-security-review.md)): `cancel` callable only by the registrant, registrations keyed uniformly by handle, `ConfidentialTransferPrepared` event, explicit amount upper bound, regulator key must be the active key, `decryptable` upper bound.
> 0.2.2: `pending` changed to monotonic accumulation + `folded` record, avoiding cold writes on receipt; steady-state gas measured.
> 0.2.1: Written back from prototype measurements (public-input packing replaces SHA-256, shielded tokens escrowed at the contract address, gas measured).
> Main changes in 0.2 relative to 0.1: confidential accounts decoupled from Ethereum addresses, public keys not on chain, registry and shield / unshield functions removed, payload type byte defines the transfer type, proof-as-authorization, `applyPending` removed (replaced by lazy fold on spend). All gas figures are estimates.

## 0. Design Principles

1. **Zero changes to the public ledger**: it is exactly OpenZeppelin ERC20; no failure in the confidential logic can affect it.
2. **The chain touches neither plaintext nor public keys**: the contract only verifies proofs and performs ciphertext addition. A confidential account's public key never appears on chain.
3. **Each ciphertext has exactly one writer**: `available` is modified only by the owner's own proof; `pending` is written only by others and is folded on the owner's next spend. Proofs bind the state as seen by the writer, so concurrency cannot invalidate a proof.
4. **Proof-as-authorization**: the authorization to spend a confidential balance is a zero-knowledge proof of "knowing the private key", not `msg.sender`. Anyone may submit the transaction on the owner's behalf.
5. **Regulation is enforced cryptographically**: if the regulator ciphertext is missing or inconsistent with the amount, the proof fails.
6. **The recipient does not solve discrete logarithms**: every transfer carries plaintext hints (memos) encrypted to the recipient and the regulator, and the circuit proves the memos are correct.
7. **The protocol only guarantees that on-chain state is always correct, not that user intent is always satisfied**: the interpretation of `to` is determined entirely by the payload type; sending with the wrong type or to the wrong address is the sender's responsibility, and the protocol provides no fallback.

## 1. Cryptographic Parameters

| Item | Value | Notes |
| --- | --- | --- |
| Curve | Baby Jubjub | Embedded curve over the BN254 scalar field, native inside the circuit |
| Generators | `G` (amount), `H` (randomness / public key) | Discrete-log relation unknown |
| Private key | `s ∈ Z_l` | Derived from a wallet EIP-712 signature hash, see §2.1 |
| Public key | `pk = s⁻¹·H` | Verifying the private key inside the circuit takes a single scalar multiplication `s·pk == H` |
| Account id | `id = address(uint160(Poseidon(pk.x, pk.y)))` | 20 bytes, fits into `to` / `from`; computed only inside the circuit |
| Ciphertext | `Enc_pk(v; r) = (C, D)`, `C = v·G + r·H`, `D = r·pk` | Decryption `C − s·D = v·G` |
| Homomorphism | `(C₁,D₁) + (C₂,D₂)` ↔ plaintext addition | Under the same `pk` |
| Multi-recipient | One `C`, multiple handles `D_X = r·pk_X` | The same amount encrypted to the payer, the payee and the regulator |
| Proof system | Groth16 (circom + snarkjs) for the prototype; PLONK-family to be evaluated for production | |
| Hash / memo | Poseidon; memos encrypted with a Poseidon keystream | |
| Public-input packing | Scalars packed into 3 words (`from|nonce`, `to|chainId`, `contract|regKeyId|signBits`); points expose only x, with y as a private input bound by "on curve + parity bit" | Public inputs 25 → 15, verification gas 386k → 316k. The SHA-256 compression scheme was rejected: ~400k constraints in circuit |
| Amount width | Per transfer `v < 2⁴⁸` | |
| Balance width | `b < 2⁶⁴` | Guaranteed by the `totalSupply` cap |
| decimals | 6 | |

## 2. Accounts and State

### 2.1 Confidential Account = Public Key

A confidential account has no Ethereum address and no registration step. An account is simply a Baby Jubjub key, referred to on chain by the low 160 bits of `id = Poseidon(pk)`.

- **Derivation**: `s = keccak256(sign_EIP712({name:"PEP", chainId, contract}, {purpose:"A.1 key", index}))  mod l`. The same wallet can derive multiple accounts using different values of `index`.
- **Publication**: the account holder hands `pk` (64 bytes) to the payer off chain; `id` can be computed from `pk`. There is nowhere on chain where `pk` can be looked up.
- **Creation**: the first transfer sent to `id` creates the storage slot. There is no "account opening".
- **Association with a wallet**: appears only when moving between the public ledger and the confidential ledger (`0x03` / `0x04`), as a public edge `wallet → id` or `id → wallet`.

### 2.2 Storage

```solidity
struct Point { uint256 x; uint256 y; }          // affine coordinates; the zero-valued struct is treated as the identity (0, 1)
struct Ciphertext { Point C; Point D; }

struct ConfidentialAccount {
    Ciphertext available;     // available balance, modified only by the owner's proof
    Ciphertext pending;       // accumulated pending, only increases, never cleared, written by others
    Ciphertext folded;        // value of pending at the last spend; effective pending = pending − folded
    uint64     nonce;         // +1 on every change of available
    uint64     foldedAtBlock; // block number of the owner's last spend / fold; same slot as nonce
    uint64     lastReceivedAtBlock; // block number of the most recent receipt, written by others; same slot. A.1 only; variants that hide the recipient must not keep it (A1-0006)
    bytes      decryptable;   // owner's self-encrypted copy of the balance plaintext, not interpreted by the contract, optional
}

mapping(address => ConfidentialAccount) internal _accounts;   // key = id
mapping(address => mapping(uint256 => Prepared)) internal _prepared;   // fallback, see §3.4
uint256 public shieldedSupply;

struct RegulatorKey { Point pk; uint64 activatedAt; }
RegulatorKey[] public regulatorKeys;      // append-only; index = keyId
uint32 public activeRegulatorKeyId;
```

Public ledger: OpenZeppelin `ERC20` as is, keyed by Ethereum address. The two ledgers share the same key space (20 bytes) but with different meanings; the protocol does not distinguish them, see principle 7.

### 2.3 Global Invariants

| No. | Statement |
| --- | --- |
| I1 | Shielded tokens are escrowed at the contract's own address: `balanceOf(address(this)) == shieldedSupply`, hence `totalSupply() == Σ public balances` (including the contract address) holds naturally for any indexer |
| I2 | `totalSupply() ≤ 2⁶⁴ − 1` (in the smallest unit). Guarantees every confidential balance is `< 2⁶⁴`, so range proofs cannot be broken by accumulation overflow |
| I3 | For every `id`: `available + pending` decrypts to the true confidential balance |
| I4 | `nonce` is strictly increasing |
| I5 | `pending` only increases, and only by range-proven non-negative amounts or public amounts |

### 2.4 Regulator Key

- Rotated by the `REGULATOR_ADMIN` role; old keys are retained permanently (needed for historical ciphertexts).
- Thresholdization (t-of-n DKG) is a deployment choice; the protocol sees only a single public key.
- Regulatory capability is **read-only**: no freeze, seizure or forced-transfer interface.

## 3. ERC-20 Surface

### 3.1 Functions

```solidity
function transfer(address to, uint256 x) external returns (bool);
    // payer = msg.sender's public account. No payload: public transfer; payload 0x03: into to's confidential ledger
function transferFrom(address from, uint256 to, uint256 x) external returns (bool);
    // payer = from. from is a public account: standard allowance; from is a confidential id: proof authorization (payload 0x01 / 0x04)
function prepare(bytes calldata payload) external;          // fallback: verify and register first
function cancel(address from, uint256 handle) external;      // revoke an unexecuted registration, callable only by the registrant
```

There is no `register`, `shield`, `unshield` or `applyPending`.

### 3.2 payload

The extra data follows immediately after the ABI-encoded arguments: `transfer` reads from `msg.data[68:]`, `transferFrom` reads from `msg.data[100:]`. Solidity's ABI decoder ignores trailing bytes; this is the same property ERC-2771 relies on.

```
byte 0      type
byte 1      flags
byte 2..    sections (determined by type and flags, fixed order)
```

**type**

| type | Name | `from` | `to` | `x` | Proof | shieldedSupply |
| --- | --- | --- | --- | --- | --- | --- |
| (no payload) | Public transfer | Public account | Public account | Plaintext amount | No | — |
| `0x01` | Confidential transfer | Confidential id | Confidential id | Handle | Yes | — |
| `0x02` | Stealth confidential transfer | Confidential id | One-time id | Handle | Yes | — |
| `0x03` | Public → confidential | Public account | Confidential id | Plaintext amount | No | `+x` |
| `0x04` | Confidential → public | Confidential id | Public account | Plaintext amount | Yes | `−x` |
| `0x80` | Pure fold (A.1-private) | Confidential id | Same id | Handle | Yes (private-key knowledge only) | 0 |

`0x02` only reserves its number in 0.2, see §11.

**flags**

| bit | Meaning |
| --- | --- |
| 0 | `includePending`: the proof binds `available + pending` instead of only `available`, see §4.3 |
| 1 | Carries a `decryptable` section |
| 2–7 | Reserved, must be 0 |

**sections (`0x01`)**

| Section | Size | Notes |
| --- | --- | --- |
| `C_amt` | 64 | `v·G + r·H` |
| `D_sender` | 64 | `r·pk_sender` |
| `D_recv` | 64 | `r·pk_recv` |
| `D_reg` | 64 | `r·pk_reg` |
| `E` | 64 | Ephemeral public key `e·H` |
| `memo_recv` | 64 | `Enc(Poseidon(e·pk_recv); v ‖ r)` |
| `memo_reg` | 64 | `Enc(Poseidon(e·pk_reg); v ‖ r)` |
| `regKeyId` | 4 | Index of the regulator public key used |
| `proof` | 256 | Groth16 |
| `decryptable` | 2 + n | Length prefix + ciphertext, present when flags.bit1 is set |

About 900 bytes. `0x04` drops `D_recv`, `D_reg`, `E` and the two memos; `0x03` has only type and flags.

**Handle**: `handle = keccak256(payload) | (1 << 255)`. The top bit set to 1 lets indexers distinguish handles from public amounts; public amounts are bounded by I2 and far smaller than `2²⁵⁵`.

### 3.3 Consistency Checks (any failure reverts)

| # | Check | Applies to |
| --- | --- | --- |
| 1 | `type` is valid, reserved bits of `flags` are 0, section lengths are consistent with type / flags | All |
| 2 | `handle == keccak256(payload) \| (1 << 255)` | `0x01` `0x02` |
| 3 | Top bit of `x`: must be 1 for `0x01` `0x02`; must be 0 for public-amount types | All |
| 4 | `to != address(0)` | All |
| 5 | `regKeyId == activeRegulatorKeyId` | `0x01` |
| 6 | Proof verifies; public inputs are assembled by the contract per §4, never trusting from the payload any value the contract is supposed to supply | `0x01` `0x04` |
| 7 | When `from` is a public account, allowance is sufficient (standard ERC-20) | `transferFrom` without payload / `0x03` |
| 8 | `_prepared[from][handle]` exists and the `nonce` recorded at registration matches the current one | Fallback execution |

`from == to` is allowed. `msg.sender` is not checked for `0x01` / `0x04`.

### 3.4 Fallback: `prepare` / `cancel`

For callers that cannot assemble calldata (native wallet UIs, contracts unaware of this protocol):

1. `prepare(from, to, x, payload)`: fully validates per §3.3 and §4, then stores `{type, to, preparedBy, nonce, delta ciphertext}` into `_prepared[from][handle]`. Both types are keyed by handle (for `0x04` the handle is derived from the payload inside the contract). A `0x01` registration emits `ConfidentialTransferPrepared`; the payee must wait for `PreparedExecuted` before treating the funds as received.
2. Afterwards, a `transferFrom(from, to, handle)` from any source (without extra data) reads the registration, checks that `nonce` has not changed, performs the state update of §4 and deletes the registration.
3. `cancel(from, handle)`: callable only by `preparedBy`. The payload is already public in the `prepare` transaction and cannot serve as authorization.

If `nonce` has changed, execution fails and reverts; there is no automatic retry.

## 4. Execution Flows

### 4.1 `0x03` Public → Confidential

```
_update(from, address(this), x)      // standard ERC-20 checks; escrow at the contract address, emits Transfer(from, this, x)
shieldedSupply  += x
C = x·G                               // fixed-base window table: 4 bits × 12 segments, 192 precomputed points in bytecode, about 12 point additions
_accounts[to].pending += (C, 0)       // degenerate ciphertext with r = 0: the amount is public anyway
emit Transfer(from, to, x)
emit LedgerCrossing(from, to, 0x03, x)
```

No `pk` is needed; `to` may be any id that has never had any activity.

### 4.2 `0x01` Confidential → Confidential

```
acc = _accounts[from]
pre = flags.includePending ? acc.available + acc.pending : acc.available
verify(proof, H(chainId, this, from, to, acc.nonce, pk_reg, pre, C_amt, D_sender, D_recv, D_reg, E, memo_recv, memo_reg))
acc.available = acc.available + (acc.pending − acc.folded) − (C_amt, D_sender)   // lazy fold, see §4.3
acc.folded    = acc.pending
acc.nonce    += 1
if flags.bit1: acc.decryptable = payload.decryptable
_accounts[to].pending += (C_amt, D_recv)
emit Transfer(from, to, handle)
emit ConfidentialTransfer(from, to, handle, regKeyId, C_amt, D_recv, D_reg, E, memo_recv, memo_reg)
```

### 4.3 Lazy Fold and `includePending`

The sole purpose of `pending` is to let incoming payments from others not interrupt the owner's in-flight proof. Folding is no longer a separate operation; it **happens automatically after every spend**: the contract adds the effective pending `pending − folded` into `available` and then sets `folded = pending`. Both `pending` and `folded` only increase and are never cleared: clearing would make every subsequent receipt write the storage slots from zero (4 slots × 22.1k); by recording the folded value instead, receipts become non-zero → non-zero writes, saving about 70k per receipt. The cost is one extra cold write of `folded` on each account's first spend (about 90k, one-time). The owner already knows every incoming amount via memos and `LedgerCrossing` events, and can update the local balance and `decryptable` on their own.

**The window for rebuilding the pending plaintext is bounded**: receipts before the fold have already been merged into `available` (whose plaintext can be read directly from `decryptable`), so only the `ConfidentialTransfer` / `LedgerCrossing` events with the owner's own `id` as `to` since the owner's last spend are needed. On every spend the contract records `foldedAtBlock = block.number` (in the same storage slot as `nonce`, which must be written anyway, so zero extra gas), and the client obtains the exact window `[foldedAtBlock, lastReceivedAtBlock]` with a single `eth_call` (from 0.3.0 the contract records `lastReceivedAtBlock` on every receipt, same slot as `nonce`; no receipt can exist past the upper bound). The client decrypts memos one by one from newest to oldest, computing a suffix sum, and can stop early once it matches `pending − folded`; when `pending − folded` is the identity, nothing needs to be scanned. The historical depth within the window depends on how long the account has gone without spending; see 03-deployments for public RPC log-retention limits.

By default the proof binds only `available` (which only the owner can modify, so it never becomes invalid). When the owner needs to use funds still in `pending` (typically: a new account with `available` at zero), they set `includePending` and the proof binds `available + pending`; in that case, if a new receipt arrives between proof generation and inclusion on chain, the proof becomes invalid and must be regenerated. This is the user's choice; the protocol does no extra handling.

In both cases the contract's state-update formula is identical; the only difference is `pre` in the public inputs.

### 4.4 `0x04` Confidential → Public

```
acc = _accounts[from]
pre = flags.includePending ? acc.available + acc.pending : acc.available
verify(proof, H(chainId, this, from, to, acc.nonce, pre, C_amt, D_sender, x))   // to bound since 0.3.1 (F14)
acc.available = acc.available + (acc.pending − acc.folded) − (C_amt, D_sender)
acc.folded    = acc.pending
acc.nonce    += 1
shieldedSupply -= x
_update(address(this), to, x)        // emits Transfer(this, to, x)
emit LedgerCrossing(from, to, 0x04, x)
```

### 4.5 The Four Combinations at a Glance

| Payer → Payee | Call | payload | Proof | Amount public |
| --- | --- | --- | --- | --- |
| Public → public | `transfer(to, x)` / `transferFrom(from, to, x)` | None | No | Yes |
| Public → confidential | Same as above + `0x03` | 2 bytes | No | Yes |
| Confidential → confidential | `transferFrom(id, id, handle)` + `0x01` | ~900 bytes | Yes | No |
| Confidential → public | `transferFrom(id, addr, x)` + `0x04` | ~450 bytes | Yes | Yes |
| Fold (no transfer) | `transferFrom(id, id, handle)` + `0x80` | ~260 bytes | Yes | — |

### 4.6 `0x80` Pure Fold

Originally, folding happened only as part of a spend (§4.3). `0x80` lets the owner perform the same state update without transferring:

```
verify(proof, H(chainId, this, from, acc.nonce))          // proves only possession of from's private key
acc.available += acc.pending − acc.folded ; acc.folded = acc.pending
acc.nonce += 1 ; acc.foldedAtBlock = block.number
if flags.decryptable: acc.decryptable = payload.decryptable
emit Folded(from, handle, acc.nonce)
```

Call form: `transferFrom(id, id, handle)` + payload (`to` must equal `from`, `handle = keccak(payload) | 2²⁵⁵`). The payload contains only `[type, flags, proof, decryptable?]`; the `includePending` bit is reserved here (a fold inherently includes pending). `prepare` is not supported.

Uses:

1. **Persisting knowledge on chain.** While the receipt events are still within the RPC retention period, the owner decrypts the memos one by one and, at fold time, writes the encrypted plaintext of `available + pending` into `decryptable`; thereafter, no matter how long the account stays idle, reading depends only on the window `[foldedAtBlock, lastReceivedAtBlock]`. For accounts that "receive often, spend rarely", this is the only way to keep the window from growing without bound.
2. **Fully resolving new-account lockout (security self-review F1).** The proof binds no amount and no value of `pending`, so an attacker sending funds between proof generation and inclusion on chain cannot invalidate it; after folding, the owner spends in the default mode (binding only `available`).

Cost: one transaction of about 250k gas (the first fold costs about 450k due to cold writes of `available` / `folded`).

## 5. Circuits

### 5.1 `0x01`

**Public inputs** (packed into 15 words per §1 before going on chain; the logical list follows): `chainId, contract, from, to, nonce, pk_reg, pre.C, pre.D, C_amt, D_sender, D_recv, D_reg, E, memo_recv, memo_reg`.

**Private inputs**: `s, pk_sender, pk_recv, b, v, r, e`.

| # | Statement | Notes |
| --- | --- | --- |
| 1 | `s·pk_sender == H` | Knows the payer account's private key |
| 2 | `Poseidon(pk_sender) → from` | Payer account id is correct, `pk_sender` stays off chain |
| 3 | `Poseidon(pk_recv) → to` | Payee account id is correct, `pk_recv` stays off chain |
| 4 | `pre.C − s·pre.D == b·G` | The balance ciphertext encrypts `b` |
| 5 | `0 ≤ b < 2⁶⁴` | |
| 6 | `0 ≤ v < 2⁴⁸` | |
| 7 | `0 ≤ b − v < 2⁶⁴` | Sufficient balance |
| 8 | `C_amt == v·G + r·H` | |
| 9 | `D_sender == r·pk_sender`, `D_recv == r·pk_recv`, `D_reg == r·pk_reg` | Same value for all three parties |
| 10 | `E == e·H` | |
| 11 | `memo_recv == Enc(Poseidon(e·pk_recv); v ‖ r)`, `memo_reg == Enc(Poseidon(e·pk_reg); v ‖ r)` | Hints are correct |
| 12 | Packing: after range-checking each scalar, the `w0, w1, w2` equations hold; every point `(xs[i], ys[i])` is on the curve and `ys[i] mod 2 == signBits[i]` | y is uniquely determined by x and the parity bit |

Measured constraint count: **35,137 non-linear constraints** (30,356 for the unpacked version). Proving takes 2.3~2.5 s in a Node environment.

### 5.2 `0x04`

Drops 3, the last two items of 9, 10 and 11; 7 public inputs: `w0 = from | nonce<<160`, `w1 = contract | chainId<<160`, `w2 = amount | signBits<<48 | to<<64` (`to` = public recipient, bound since 0.3.1, see security review F14), `xs[4]`. Measured 17,358 constraints.

### 5.3 `0x80`

2 public inputs: `w0 = from | nonce<<160`, `w1 = contract | chainId<<160`. Private: `from, nonce, chainId, contractAddr, s, pk`. Constraints: unpacking + range checks, `s·pk = H`, `low160(Poseidon(pk)) = from`. Measured **4,027 constraints**, proving about 0.3 s.

## 6. Events

| Event | Fields | Purpose |
| --- | --- | --- |
| `Transfer` | `(from, to, x)` | Standard; the top bit of `x` distinguishes handles from amounts |
| `ConfidentialTransfer` | `(from, to, handle, regKeyId, C_amt, D_recv, D_reg, E, memo_recv, memo_reg)` | Payee scanning, regulator decryption |
| `LedgerCrossing` | `(from, to, type, amount)` | `0x03` / `0x04`; indexers maintain `shieldedSupply` |
| `Folded` | `(id, handle, nonce)` | `0x80`; `nonce` is the new value after the fold |
| `Prepared` / `Cancelled` | `(from, handle)` | Fallback |
| `RegulatorKeyRotated` | `(keyId, pk)` | |

The payee filters `ConfidentialTransfer` and `LedgerCrossing` by `to == own id`.

## 7. Views

```solidity
function balanceOf(address) external view returns (uint256);            // public ledger
function confidentialAccountOf(address id) external view
    returns (Ciphertext available, Ciphertext pending, uint64 nonce, uint64 foldedAtBlock, uint64 lastReceivedAtBlock, bytes memory decryptable);
function shieldedSupply() external view returns (uint256);
function regulatorKey(uint32 id) external view returns (Point memory);
function supportsInterface(bytes4) external view returns (bool);         // family / Track A / A.1
```

## 8. Client Flows

**Payer**: holds `pk_recv` off chain → reads own `available` (and `pending` if needed), `nonce`, `foldedAtBlock`, `decryptable` → recovers `b` → chooses `v, r, e` → ciphertexts and memos → proof → assembles the payload → submits `transferFrom` directly or through a relayer.

**Payee**: listens for `ConfidentialTransfer(to = id)` → `k = s⁻¹·E` → decrypts the memo to get `(v, r)` → checks `C_amt == v·G + r·H` → local balance += v. Listens for `LedgerCrossing(to = id, 0x03)` → local balance += amount. No on-chain action is required.

**Regulator**: iterates over `ConfidentialTransfer`, decrypts `memo_reg` by `regKeyId`, verifies the commitment; combined with `LedgerCrossing`, reconstructs the balance of any id at any point in time. No discrete logarithms, no cooperation from anyone, read-only. The mapping between ids and wallets can only be inferred from the `0x03` / `0x04` edges.

**Memo fallback**: enforced by the circuit, so in theory it cannot be wrong; if the implementation has a bug, the payee can still solve a 48-bit discrete logarithm on `C_amt − s·D_recv = v·G` (a 2²⁴ table).

## 9. Gas (prototype measurements, 2026-09-24)

Environment: Hardhat 3 / solc 0.8.34 viaIR / Groth16 (snarkjs) / after public-input packing. Figures come from `contracts/test/track-a/variant-1/`.

### 9.1 Unit Price Assumptions

| Chain | gas price | Token price | USD per gas |
| --- | --- | --- | --- |
| ETH | 0.3 gwei | $2,500 | 7.5 × 10⁻⁷ |
| BSC | 0.05 gwei | $750 | 3.75 × 10⁻⁸ |

### 9.2 Measurements

| Operation | Measured gas | Notes | ETH ($) | BSC ($) |
| --- | --- | --- | --- | --- |
| Public transfer (reference) | ~50k | | 0.038 | 0.0019 |
| `0x03` public → confidential (payee's first receipt) | **198k** | Includes the payee's pending cold write (4 slots); fixed-base window table `amount·G` worst case 77k | 0.15 | 0.0074 |
| `0x01` confidential → confidential, **steady state** (both sides' storage warm) | **467k** | Target ≤ 500k achieved | 0.35 | 0.018 |
| `0x01` confidential → confidential, account's first spend | 709k | One-time: cold writes of available and folded, 4 slots each | 0.53 | 0.027 |
| `0x04` confidential → public, account's first spend | 583k | Same as above | 0.44 | 0.022 |
| Bare `transferFrom` after `prepare` (first time) | 360k | Excludes `prepare` itself | 0.27 | 0.0135 |
| Groth16 `verifyProof` (15 inputs) | 316k | Includes 21k base and calldata; 386k with 25 inputs unpacked | | |
| Proof generation (Node, M-series) | 2.3~2.5 s | 35,137 constraints | | |

### 9.3 Breakdown (`0x01`, steady state)

| Component | Gas |
| --- | --- |
| Base + calldata (payload ~710 bytes) | ~35k |
| Groth16 verification (15 public inputs) | ~290k |
| Baby Jubjub point additions ×8 (effective pending 2, fold 2, debit 2, credit 2) | ~65k |
| Storage: payer's available, folded, nonce; payee's pending, all warm writes | ~70k |
| Events | ~7k |

### 9.4 Known Optimization Opportunities

| Optimization | Estimated saving | Status |
| --- | --- | --- |
| Point addition in projective coordinates, batched inversion | ~20k | backlog |
| Replace Groth16 with a PLONK-family system | **Adds** ~100k, in exchange for eliminating the per-circuit trusted setup | to be evaluated |

### 9.5 Target

**`0x01` steady state ≤ 500k, achieved (467k).** (The original target of 350k was based on the assumption that SHA-256 compression would work out, and no longer applies.)

## 10. Scope (0.2)

**Included**: public ledger, the four `transfer` / `transferFrom` types (excluding `0x02`), `prepare` / `cancel`, regulator key registration and rotation, events and views, ERC-165, public-input packing.

## 11. Backlog

| Item | Notes |
| --- | --- |
| `0x02` stealth | The payer derives a one-time `pk` and `id` from the payee's meta-address; since accounts are already decoupled from addresses, no on-chain support is needed |
| Custodial confidential allowance | A third party spends a confidential balance on the owner's behalf **without holding the private key**; proof-as-authorization covers only the case of holding the private key |
| Key rotation | The owner re-encrypts `available` to a new `pk` (i.e. a new id); requires a dedicated circuit |
| Compliance policy hook | Pluggable `Policy` contract performing admission checks on `0x03` / `0x04` |
| Point compression | Reduce calldata |
| ERC-2771 | Coexistence of the extra data with the forwarder suffix |
| Multi-output transfer | One proof for multiple payees |

## 12. Open Questions

- [ ] Groth16 trusted setup: the prototype uses a public ptau + self-built phase 2; whether production switches to PLONK / UltraHonk.
- [ ] Whether `decryptable` lives on chain or purely off chain (rebuilt by replaying memos and events).
- [ ] Recommended scheme for regulator key thresholdization (DKG).
- [ ] Deployment target: L2 first or L1 first.
- [ ] Whether the `Transfer` event is also emitted for `0x01` (currently: yes, distinguished by the handle's top bit), or only `ConfidentialTransfer`.
