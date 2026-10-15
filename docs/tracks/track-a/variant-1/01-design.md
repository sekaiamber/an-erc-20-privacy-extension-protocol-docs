English | [中文](01-design.zh-cn.md)

# A.1 Detailed Design: the core

Version: `0.8.0`. Status: `Draft`. Date: 2026-10-15

> 0.8.0 (**designed, not implemented**; 0.7.0 is what runs on BSC testnet): follows [ADR-0014](../../../adr/0014-eighteen-decimals.md). Every amount is below `2¹²⁸`: a single amount, a balance, a public amount; the cap is `2¹²⁸ − 1` (§1, I2). The token's decimals are chosen at deployment, from 0 to 18, 18 by default. The transfer and unshield circuits widen their range checks to 128 bits (§5.1, §5.2), so they get new proving keys and verifiers; the fold circuit does not change. Unshield takes 8 public inputs instead of 7. The window table for `x·G` grows to 32 segments: the 0.7.0 table plus a second data contract (§4.1). There is no discrete-logarithm fallback for reading amounts (§8). `casata()` = `A:1:0.8.0`. The list of changes is 04-modules §9.3.

> 0.7.0 (**implemented and deployed on BSC testnet 2026-10-15**; on-chain runs in 03-deployments): follows [ADR-0013](../../../adr/0013-mintable.md) and [A1-0007](../../../adr/a1-0007-exit-kind-binding.md). The core gains the initial issuance, made once in the constructor by the rule of `mint` (04-modules §3), and the `0x81` burn, which moves out of the former role-issuance module; that module is renamed Mintable and keeps only `mint` and `0x82`. The unshield proof binds `r = uint160(keccak256("Casata A.1 exit", kind, to))` instead of `to` for the exits to a non-zero recipient: `kind = 1` for `0x04`, `kind = 2` for `wrapperBurn`; the burn keeps 0 (§5.2). All eight subsets of the modules are tokens. No circuit changes, so the proving keys and verifiers stay the same; a 0.6.0 exit proof does not verify on a 0.7.0 token. `casata()` = `A:1:0.7.0`. The list of changes is 04-modules §9.2.

> 0.6.0 (**implemented and deployed on BSC testnet 2026-10-13**; on-chain runs of both tokens in 03-deployments): follows [ADR-0010](../../../adr/0010-erc20-surface-tradeoffs.md) and [ADR-0011](../../../adr/0011-project-name-casata.md). The fold becomes a function of its own, `fold(id, payload)` (§4.6). `prepare` / `cancel` are removed (§3.4). Issuance is `mint(to, amount)` with the payload rule, type `0x82` for a confidential id, replacing `mintConfidential` (04-modules §4.2). `approve` reverts on a token without the public ledger. `pep()` becomes `casata()` and the key-derivation domain becomes `"Casata"`, so keys differ from the ones of 0.5.0. No circuit changes and no change to the payload layouts of `0x01`, `0x04`, `0x80` and `0x81`. `casata()` = `A:1:0.6.0`.

> 0.5.0 (**implemented and deployed on BSC testnet 2026-10-13**; on-chain runs of both tokens in 03-deployments): **restructured into a core and modules** ([ADR-0008](../../../adr/0008-modules.md), [04-modules](04-modules.md)). This document is the core; sections that belong to a module are marked. No circuit, payload layout or measured figure changes. `pep()` = `A:1:0.5.0` for both compositions.

> 0.4.0: **Crypto core switched to plain ElGamal** (ADR-0006 §3, A1-0002 revision): `pk = s·H`; a ciphertext is one shared `D = r·H` plus one `C_X = v·G + r·pk_X` per party; memo pads are derived from each party's shared secret `r·pk_X` (= `s_X·D`); the ECDH point `E` and scalar `e` are gone. Purpose: regulator-side decryption and memo opening become "share × public point", i.e. threshold-splittable (11-regulatory-committee). Side effects: transfer circuit 35,137 → 29,719 constraints, public inputs 15 → 14, payload 710 → 646 bytes, proving ≈ 2.1 s → 1.3 s, `0x01` gas 715k → 706k. `pep()` = `A:1:0.4.0`.
> 0.3.1: **Security fix F14** — the public recipient `to` of `0x04` is packed into the proof (`w2 = amount | signBits<<48 | to<<64`); before, a relayer or front-runner could rewrite `to` and take the whole unshield. Circuit 16,622 → 17,358 constraints, still 7 public inputs. `pep()` = `A:1:0.3.1`.
> 0.3.0: Added the A.1-private type `0x80` pure fold (proves only knowledge of the private key, no amounts involved, §4.6 / §5.3), which fully resolves finding F1 of the security self-review; accounts gain `lastReceivedAtBlock` (same slot as `nonce`), and the client event window tightens to `[foldedAtBlock, lastReceivedAtBlock]`. `pep()` = `A:1:0.3.0`.
> 0.2.5: Accounts gain `foldedAtBlock` (block number of the owner's last spend, packed into the same slot as `nonce`, zero extra gas), which gives the client an exact event window for rebuilding pending (§4.3). `pep()` = `A:1:0.2.5`.
> 0.2.4: Implemented the family descriptor `pep()` = `A:1:0.2.4` (07 §10); ERC-165 keeps only the `IPEP` id.
> 0.2.3: Revised per the first-round security self-review ([02-security-review.md](02-security-review.md)): `cancel` callable only by the registrant, registrations keyed uniformly by handle, `ConfidentialTransferPrepared` event, explicit amount upper bound, regulator key must be the active key, `decryptable` upper bound.
> 0.2.2: `pending` changed to monotonic accumulation + `folded` record, avoiding cold writes on receipt; steady-state gas measured.
> 0.2.1: Written back from prototype measurements (public-input packing replaces SHA-256, shielded tokens escrowed at the contract address, gas measured).
> Main changes in 0.2 relative to 0.1: confidential accounts decoupled from Ethereum addresses, public keys not on chain, registry and shield / unshield functions removed, payload type byte defines the transfer type, proof-as-authorization, `applyPending` removed (replaced by lazy fold on spend). All gas figures are estimates.

## Core and modules

Since 0.5.0 A.1 is a **core** plus optional **modules** ([ADR-0008](../../../adr/0008-modules.md)). This document specifies the core. It also keeps the flows of the public-ledger module, in the sections marked below, so that section numbers cited by the security review and the deployment records stay valid. The modules themselves, the supply accounting across them and the compositions are specified in [04-modules.md](04-modules.md).

| Sections | Belong to |
| --- | --- |
| §1, §2.1, §2.2 (accounts, regulator keys), §2.3 I2–I5, §2.4, §3 (`0x01`, `fold`), §4.2, §4.3, §4.6, §5, §8 | Core |
| The initial issuance, `0x81`, `Burned` | Core from 0.7.0 (04-modules §3, §4.0); role issuance up to 0.6.0 |
| §2.2 (`shieldedSupply`, the ERC-20 ledger), §2.3 I1, §3 (payload-less calls, `0x03`, `0x04`), §4.1, §4.4, §4.5, `LedgerCrossing` in §6 | Public-ledger module |
| `0x82`, `mint`, `Minted` | Mintable module (04-modules §4.2), named role issuance up to 0.6.0. The initial issuance emits `Minted` too |
| `wrapperMint`, `wrapperBurn` | Wrapper port (04-modules §4.3) |

The core alone is a privacy-only ledger: without the public-ledger module `balanceOf` is 0 for every address, and a payload-less `transfer` and `approve` revert.

## 0. Design Principles

1. **The core is a privacy-only ledger; everything public is a module.** With the public-ledger module, the public ledger is exactly OpenZeppelin ERC20 and no failure in the confidential logic can affect it.
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
| Public key | `pk = s·H` | One fixed-base scalar multiplication `s·H == pk` inside the circuit; DKG aggregation is a point sum (0.4) |
| Account id | `id = address(uint160(Poseidon(pk.x, pk.y)))` | 20 bytes, fits into `to` / `from`; computed only inside the circuit |
| Ciphertext | `Enc_pk(v; r) = (C, D)`, `C = v·G + r·pk`, `D = r·H` | Decryption `C − s·D = v·G` (plain ElGamal, 0.4) |
| Homomorphism | `(C₁,D₁) + (C₂,D₂)` ↔ plaintext addition | Under the same `pk` |
| Multi-recipient | One shared `D = r·H`, one `C_X = v·G + r·pk_X` per party | The same amount encrypted to the payer, the payee and the regulator; each party's shared secret `r·pk_X = s_X·D` doubles as its memo key |
| Proof system | Groth16 (circom + snarkjs) for the prototype; PLONK-family to be evaluated for production | |
| Hash / memo | Poseidon; memos encrypted with a Poseidon keystream derived from `r·pk_X` (no ECDH point since 0.4) | |
| Public-input packing | Scalars packed into 3 words (`from|nonce`, `to|chainId`, `contract|regKeyId|signBits`); points expose only x, with y as a private input bound by "on curve + parity bit" | Public inputs 25 → 15 (14 since 0.4), verification gas 386k → 316k. The SHA-256 compression scheme was rejected: ~400k constraints in circuit |
| Amount width | Every amount `v < 2¹²⁸`: per transfer and public amounts | [ADR-0014](../../../adr/0014-eighteen-decimals.md). Up to 0.7.0, `v < 2⁴⁸` ([A1-0005](../../../adr/a1-0005-numeric-parameters.md)) |
| Balance width | `b < 2¹²⁸` | Guaranteed by the `totalSupply` cap. Up to 0.7.0, `b < 2⁶⁴` |
| decimals | Chosen at deployment, 0 to 18, 18 by default | No circuit depends on it (ADR-0014). Up to 0.7.0, 6 |

## 2. Accounts and State

### 2.1 Confidential Account = Public Key

A confidential account has no Ethereum address and no registration step. An account is simply a Baby Jubjub key, referred to on chain by the low 160 bits of `id = Poseidon(pk)`.

- **Derivation**: `s = keccak256(sign_EIP712({name:"Casata", chainId, contract}, {purpose:"A.1 key", index}))  mod l`. The same wallet can derive multiple accounts using different values of `index`.
- **Publication**: the account holder hands `pk` (64 bytes) to the payer off chain; `id` can be computed from `pk`. There is nowhere on chain where `pk` can be looked up.
- **Creation**: the first transfer sent to `id` creates the storage slot. There is no "account opening".
- **Association with a wallet**: appears only where a public address meets an id: `0x03` / `0x04` with the public-ledger module, a wrap or unwrap through the Wrapper port, and a mint to an id. Each is a public edge between a wallet and an id.

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
uint256 public shieldedSupply;            // the confidential supply; exposed under this name by the public-ledger module (04-modules §3)

struct RegulatorKey { Point pk; uint64 activatedAt; }
RegulatorKey[] public regulatorKeys;      // append-only; index = keyId
uint32 public activeRegulatorKeyId;
```

Public-ledger module: OpenZeppelin `ERC20` as is, keyed by Ethereum address. The two ledgers share the same key space (20 bytes) but with different meanings; the protocol does not distinguish them, see principle 7.

### 2.3 Global Invariants

| No. | Statement |
| --- | --- |
| I1 | (Public-ledger module) Shielded tokens are escrowed at the contract's own address: `balanceOf(address(this)) == shieldedSupply`, hence `totalSupply() == Σ public balances` (including the contract address) holds naturally for any indexer |
| I2 | `issuedSupply() ≤ 2¹²⁸ − 1` (in the smallest unit; `issuedSupply()` equals `totalSupply()` unless the Wrapper port is present, 04-modules §3). Guarantees every confidential balance is `< 2¹²⁸`, so range proofs cannot be broken by accumulation overflow. Up to 0.7.0 the bound was `2⁶⁴ − 1` |
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
function transferFrom(address from, address to, uint256 x) external returns (bool);
    // payer = from. from is a public account: standard allowance; from is a confidential id: proof authorization (payload 0x01 / 0x04)
function fold(address id, bytes calldata payload) external;
    // §4.6. Moves no value, so it is not a transfer; the payload is an ordinary argument
function mint(address to, uint256 x) external;
    // Mintable module (role issuance up to 0.6.0), minter role. No payload: public mint to to; payload 0x82: into to's confidential ledger
```

There is no `register`, `shield`, `unshield` or `applyPending`, and since 0.6.0 no `prepare` or `cancel`. The payload-less forms and `0x03` / `0x04` exist only with the public-ledger module; without it they revert, and so does `approve` (04-modules §5).

### 3.2 payload

The extra data follows immediately after the ABI-encoded arguments: `transfer` and `mint` read from `msg.data[68:]`, `transferFrom` reads from `msg.data[100:]`. Solidity's ABI decoder ignores trailing bytes; this is the same property ERC-2771 relies on. `fold` is A.1's own function and takes its payload as an argument (07 §1).

```
byte 0      type
byte 1      flags
byte 2..    sections (determined by type and flags, fixed order)
```

**type**

| type | Name | `from` | `to` | `x` | Proof | Confidential supply | Part |
| --- | --- | --- | --- | --- | --- | --- | --- |
| (no payload) | Public transfer | Public account | Public account | Plaintext amount | No | — | Public ledger |
| `0x01` | Confidential transfer | Confidential id | Confidential id | Handle | Yes | — | Core |
| `0x02` | Stealth confidential transfer | Confidential id | One-time id | Handle | Yes | — | Core (reserved) |
| `0x03` | Public → confidential | Public account | Confidential id | Plaintext amount | No | `+x` | Public ledger |
| `0x04` | Confidential → public | Confidential id | Public account | Plaintext amount | Yes | `−x` | Public ledger |
| `0x80` | Pure fold (A.1-private) | Confidential id (the `id` argument of `fold`) | — | — | Yes (private-key knowledge only) | 0 | Core |
| `0x81` | Burn (A.1-private) | Confidential id | `0x0` | Plaintext amount | Yes (the `0x04` proof) | `−x` | Core (role issuance up to 0.6.0) |
| `0x82` | Issuance to an id (A.1-private) | — (the minter role calls `mint`; also the initial issuance) | Confidential id | Plaintext amount | No | `+x` | Mintable (role issuance up to 0.6.0); the initial issuance is core |

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
| `C_sender` | 64 | `v·G + r·pk_sender` |
| `C_recv` | 64 | `v·G + r·pk_recv` |
| `C_reg` | 64 | `v·G + r·pk_reg` |
| `D` | 64 | `r·H`, shared by the three parties |
| `memo_recv` | 64 | `Enc(Poseidon(r·pk_recv); v ‖ r)` |
| `memo_reg` | 64 | `Enc(Poseidon(r·pk_reg); v ‖ r)` |
| `regKeyId` | 4 | Index of the regulator public key used |
| `proof` | 256 | Groth16 |
| `decryptable` | 2 + n | Length prefix + ciphertext, present when flags.bit1 is set |

About 900 bytes. `0x04` drops `D_recv`, `D_reg`, `E` and the two memos; `0x03` and `0x82` have only type and flags.

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

`from == to` is allowed. `msg.sender` is not checked for `0x01` / `0x04`.

### 3.4 Fallback: `prepare` / `cancel` (removed in 0.6.0)

Up to 0.5.0 a caller that could not assemble calldata could register an operation with `prepare` and have a bare `transferFrom` execute it later. [ADR-0010](../../../adr/0010-erc20-surface-tradeoffs.md) withdrew this path: the dApp never used it, and it accounted for four findings and two denial-of-service entries of the security review. 0.6.0 removes `prepare`, `cancel`, `preparedOf`, the stored registrations and their events. The section number is kept because the security review cites it.

## 4. Execution Flows

### 4.1 `0x03` Public → Confidential (public-ledger module)

```
_update(from, address(this), x)      // standard ERC-20 checks; escrow at the contract address, emits Transfer(from, this, x)
shieldedSupply  += x
C = x·G                               // fixed-base window tables: 4 bits × 32 segments, G8Table for segments 0..11 (as in 0.7.0) and G8TableHigh for 12..31, 512 precomputed points, at most 32 point additions; zero segments are skipped
_accounts[to].pending += (C, 0)       // degenerate ciphertext with r = 0: the amount is public anyway
emit Transfer(from, to, x)
emit LedgerCrossing(from, to, 0x03, x)
```

No `pk` is needed; `to` may be any id that has never had any activity.

### 4.2 `0x01` Confidential → Confidential

```
acc = _accounts[from]
pre = flags.includePending ? acc.available + acc.pending : acc.available
verify(proof, H(chainId, this, from, to, acc.nonce, pk_reg, pre, D, C_sender, C_recv, C_reg, memo_recv, memo_reg))
acc.available = acc.available + (acc.pending − acc.folded) − (C_amt, D_sender)   // lazy fold, see §4.3
acc.folded    = acc.pending
acc.nonce    += 1
if flags.bit1: acc.decryptable = payload.decryptable
_accounts[to].pending += (C_amt, D_recv)
emit Transfer(from, to, handle)
emit ConfidentialTransfer(from, to, handle, regKeyId, D, C_recv, C_reg, memo_recv, memo_reg)
```

### 4.3 Lazy Fold and `includePending`

The sole purpose of `pending` is to let incoming payments from others not interrupt the owner's in-flight proof. Folding is no longer a separate operation; it **happens automatically after every spend**: the contract adds the effective pending `pending − folded` into `available` and then sets `folded = pending`. Both `pending` and `folded` only increase and are never cleared: clearing would make every subsequent receipt write the storage slots from zero (4 slots × 22.1k); by recording the folded value instead, receipts become non-zero → non-zero writes, saving about 70k per receipt. The cost is one extra cold write of `folded` on each account's first spend (about 90k, one-time). The owner already knows every incoming amount via memos and `LedgerCrossing` events, and can update the local balance and `decryptable` on their own.

**The window for rebuilding the pending plaintext is bounded**: receipts before the fold have already been merged into `available` (whose plaintext can be read directly from `decryptable`), so only the `ConfidentialTransfer` / `LedgerCrossing` events with the owner's own `id` as `to` since the owner's last spend are needed. On every spend the contract records `foldedAtBlock = block.number` (in the same storage slot as `nonce`, which must be written anyway, so zero extra gas), and the client obtains the exact window `[foldedAtBlock, lastReceivedAtBlock]` with a single `eth_call` (from 0.3.0 the contract records `lastReceivedAtBlock` on every receipt, same slot as `nonce`; no receipt can exist past the upper bound). The client decrypts memos one by one from newest to oldest, computing a suffix sum, and can stop early once it matches `pending − folded`; when `pending − folded` is the identity, nothing needs to be scanned. The historical depth within the window depends on how long the account has gone without spending; see 03-deployments for public RPC log-retention limits.

By default the proof binds only `available` (which only the owner can modify, so it never becomes invalid). When the owner needs to use funds still in `pending` (typically: a new account with `available` at zero), they set `includePending` and the proof binds `available + pending`; in that case, if a new receipt arrives between proof generation and inclusion on chain, the proof becomes invalid and must be regenerated. This is the user's choice; the protocol does no extra handling.

In both cases the contract's state-update formula is identical; the only difference is `pre` in the public inputs.

### 4.4 `0x04` Confidential → Public (public-ledger module)

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

### 4.5 The Four Combinations at a Glance (with the public-ledger module)

| Payer → Payee | Call | payload | Proof | Amount public |
| --- | --- | --- | --- | --- |
| Public → public | `transfer(to, x)` / `transferFrom(from, to, x)` | None | No | Yes |
| Public → confidential | Same as above + `0x03` | 2 bytes | No | Yes |
| Confidential → confidential | `transferFrom(id, id, handle)` + `0x01` | ~840 bytes | Yes | No |
| Confidential → public | `transferFrom(id, addr, x)` + `0x04` | ~450 bytes | Yes | Yes |
| Fold (no transfer) | `fold(id, payload)`, payload type `0x80` | ~260 bytes | Yes | — |

### 4.6 `0x80` Pure Fold

Originally, folding happened only as part of a spend (§4.3). `0x80` lets the owner perform the same state update without transferring:

```
verify(proof, H(chainId, this, id, acc.nonce))            // proves only possession of id's private key
acc.available += acc.pending − acc.folded ; acc.folded = acc.pending
acc.nonce += 1 ; acc.foldedAtBlock = block.number
if flags.decryptable: acc.decryptable = payload.decryptable
emit Folded(id, acc.nonce)
```

Call form: `fold(id, payload)`. The payload is `[type = 0x80, flags, proof, decryptable?]`, the same bytes as before; the `includePending` bit is reserved here (a fold inherently includes pending). Anyone may send the call: the proof is the authorization. There is no handle, because nothing is put in an amount slot, and `fold` emits no `Transfer`.

Up to 0.5.0 the fold was called as `transferFrom(id, id, handle)` with the payload appended. It moves no value, so ADR-0010 (item 5) took it off the transfer verb.

Uses:

1. **Persisting knowledge on chain.** While the receipt events are still within the RPC retention period, the owner decrypts the memos one by one and, at fold time, writes the encrypted plaintext of `available + pending` into `decryptable`; thereafter, no matter how long the account stays idle, reading depends only on the window `[foldedAtBlock, lastReceivedAtBlock]`. For accounts that "receive often, spend rarely", this is the only way to keep the window from growing without bound.
2. **Fully resolving new-account lockout (security self-review F1).** The proof binds no amount and no value of `pending`, so an attacker sending funds between proof generation and inclusion on chain cannot invalidate it; after folding, the owner spends in the default mode (binding only `available`).

Cost: one transaction of about 250k gas (the first fold costs about 450k due to cold writes of `available` / `folded`).

## 5. Circuits

### 5.1 `0x01`

**Public inputs** (packed into 14 words per §1 before going on chain; the logical list follows): `chainId, contract, from, to, nonce, pk_reg, pre.C, pre.D, D, C_sender, C_recv, C_reg, memo_recv, memo_reg`.

**Private inputs**: `s, pk_sender, pk_recv, b, v, r, e`.

| # | Statement | Notes |
| --- | --- | --- |
| 1 | `pk_sender == s·H` | Knows the payer account's private key |
| 2 | `Poseidon(pk_sender) → from` | Payer account id is correct, `pk_sender` stays off chain |
| 3 | `Poseidon(pk_recv) → to` | Payee account id is correct, `pk_recv` stays off chain |
| 4 | `pre.C − s·pre.D == b·G` | The balance ciphertext encrypts `b` |
| 5 | `0 ≤ b < 2¹²⁸` | Up to 0.7.0, `2⁶⁴` |
| 6 | `0 ≤ v < 2¹²⁸` | Up to 0.7.0, `2⁴⁸` |
| 7 | `0 ≤ b − v < 2¹²⁸` | Sufficient balance. Up to 0.7.0, `2⁶⁴` |
| 8 | `D == r·H` | Shared by the three parties |
| 9 | `C_sender == v·G + r·pk_sender`, `C_recv == v·G + r·pk_recv`, `C_reg == v·G + r·pk_reg` | Same value for all three parties |
| 10 | `memo_recv == Enc(Poseidon(r·pk_recv); v ‖ r)`, `memo_reg == Enc(Poseidon(r·pk_reg); v ‖ r)` | The pads reuse the `r·pk_X` already computed in 9: no extra scalar multiplication |
| 11 | (removed in 0.4: formerly `E == e·H`) | |
| 12 | Packing: after range-checking each scalar, the `w0, w1, w2` equations hold; every point `(xs[i], ys[i])` is on the curve and `ys[i] mod 2 == signBits[i]` | y is uniquely determined by x and the parity bit |

Measured constraint count: **29,719 non-linear constraints** up to 0.7.0 (35,137 in 0.3.x; 30,356 for the unpacked version); with the 128-bit range checks of 0.8.0, 32,087 (ADR-0014). The public inputs do not change: no amount is public. Proving takes about 1.3~1.5 s in a Node environment (0.7.0).

### 5.2 Unshield circuit: `0x04`, `0x81`, `wrapperBurn`

This circuit is the public-amount exit behind `_debitPublic` (04-modules §2); `0x04`, the `0x81` burn and `wrapperBurn` all use it, with `to` as the public recipient, the zero address or the recipient of the wrapped token. Drops 3, the last two items of 9, 10 and 11; 7 public inputs: `w0 = from | nonce<<160`, `w1 = contract | chainId<<160`, `w2 = amount | signBits<<48 | to<<64` (`to` = public recipient, bound since 0.3.1, see security review F14), `xs[4]`. Measured 17,358 constraints at 0.3.1, 18,895 at 0.7.0.

From 0.8.0 the amount is up to 128 bits, and `amount | signBits<<48 | to<<64` would need 292 bits, more than a field element. The recipient value moves to a word of its own: 8 public inputs, `w0 = from | nonce<<160`, `w1 = contract | chainId<<160`, `w2 = amount | signBits<<128`, `w3 = r` (160 bits), `xs[4]`. The range check of `b`, `v` and `b − v` is 128 bits. Measured as built (widened and repacked): 21,263 constraints.

From 0.7.0 the value in the place of `to` is `r` ([A1-0007](../../../adr/a1-0007-exit-kind-binding.md)), assembled by the contract: `r = 0` for the `0x81` burn, and `r = uint160(uint256(keccak256(abi.encodePacked("Casata A.1 exit", kind, to))))` for `0x04` (`kind = 1`) and `wrapperBurn` (`kind = 2`). The circuit range-checks it to 160 bits as before and gives it no meaning, so the circuit, the keys and the verifiers are unchanged. The client computes the same `r` when it proves. Events and call arguments keep the plain `to`.

### 5.3 `0x80`

2 public inputs: `w0 = from | nonce<<160`, `w1 = contract | chainId<<160`. Private: `from, nonce, chainId, contractAddr, s, pk`. Constraints: unpacking + range checks, `s·pk = H`, `low160(Poseidon(pk)) = from`. Measured **4,027 constraints**, proving about 0.3 s.

## 6. Events

| Event | Fields | Purpose |
| --- | --- | --- |
| `Transfer` | `(from, to, x)` | Standard; the top bit of `x` distinguishes handles from amounts |
| `ConfidentialTransfer` | `(from, to, handle, regKeyId, D, C_recv, C_reg, memo_recv, memo_reg)` | Payee scanning, regulator decryption (`C_sender` is not emitted: the payer knows it) |
| `LedgerCrossing` | `(from, to, type, amount)` | Public-ledger module: `0x03` / `0x04`; indexers maintain `shieldedSupply` |
| `Minted` / `Burned` | `(id, amount)` | A public amount credited to, or debited from, an id: `Minted` for the initial issuance (core) and `mint` (Mintable), `Burned` for `0x81` (core from 0.7.0) |
| `WrapperMinted` / `WrapperBurned` | `(id, amount)` / `(id, to, amount)` | Wrapper port: the same for an unwrap and a wrap |
| `Folded` | `(id, nonce)` | `fold`; `nonce` is the new value after the fold |
| `RegulatorKeyRotated` | `(keyId, pk)` | |

The payee filters `ConfidentialTransfer` and `LedgerCrossing` by `to == own id`.

## 7. Views

```solidity
function balanceOf(address) external view returns (uint256);            // public-ledger module; 0 for every address without it
function confidentialAccountOf(address id) external view
    returns (Ciphertext available, Ciphertext pending, uint64 nonce, uint64 foldedAtBlock, uint64 lastReceivedAtBlock, bytes memory decryptable);
function shieldedSupply() external view returns (uint256);              // public-ledger module
function regulatorKey(uint32 id) external view returns (Point memory);
function supportsInterface(bytes4) external view returns (bool);         // ICasata and the module interface ids
function casataModules() external view returns (Module[] memory);       // module probe (07 §13.3); pepModules() in 0.5.0
```

## 8. Client Flows

**Payer**: holds `pk_recv` off chain → reads own `available` (and `pending` if needed), `nonce`, `foldedAtBlock`, `decryptable` → recovers `b` → chooses `v, r, e` → ciphertexts and memos → proof → assembles the payload → submits `transferFrom` directly or through a relayer.

**Payee**: listens for `ConfidentialTransfer(to = id)` → `k = s⁻¹·E` → decrypts the memo to get `(v, r)` → checks `C_amt == v·G + r·H` → local balance += v. Listens for `LedgerCrossing(to = id, 0x03)` → local balance += amount. No on-chain action is required.

**Regulator**: iterates over `ConfidentialTransfer`, decrypts `memo_reg` by `regKeyId`, verifies the commitment; combined with the public-amount events (`LedgerCrossing`, `Minted`, `Burned`, `WrapperMinted`, `WrapperBurned`), reconstructs the balance of any id at any point in time. No discrete logarithms, no cooperation from anyone, read-only. The mapping between ids and wallets can only be inferred from the `0x03` / `0x04` edges.

**Memo fallback**: up to 0.7.0, if the implementation had a bug, the payee could still solve a 48-bit discrete logarithm on `C_amt − s·D_recv = v·G` (a 2²⁴ table). From 0.8.0 amounts are up to 128 bits, beyond any discrete logarithm, so there is no fallback: the memo is the only way to read an amount, and the circuit enforces it (ADR-0014).

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
| Bare `transferFrom` after `prepare` (first time; removed in 0.6.0) | 360k | Excludes `prepare` itself | 0.27 | 0.0135 |
| Groth16 `verifyProof` (14 inputs, 0.4) | ~312k | Includes 21k base and calldata; 316k with 15 inputs, 386k with 25 inputs unpacked | | |
| Proof generation (Node, M-series) | 1.3~1.5 s (0.4) | 29,719 constraints (0.3.x: 2.1~2.5 s, 35,137) | | |

### 9.3 Breakdown (`0x01`, steady state)

| Component | Gas |
| --- | --- |
| Base + calldata (payload ~646 bytes) | ~33k |
| Groth16 verification (14 public inputs) | ~288k |
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

Since 0.5.0 the scope is stated per part: the core is everything in this document not marked as a module, and the modules are in [04-modules](04-modules.md). 0.6.0 takes `prepare` / `cancel` out of the scope.

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
- [x] Whether the `Transfer` event is also emitted for `0x01`: yes. Every operation that moves value emits it, with the handle in the amount slot (ADR-0010, items 2 and 3).
