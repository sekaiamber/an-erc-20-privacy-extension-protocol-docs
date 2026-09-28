English | [中文](01-design.zh-cn.md)

# B.1 design (0.1.0-draft)

Version: `0.2.0-draft`  Status: `Draft`  Date: 2026-09-28

> 0.2.0: follows A.1 0.4.0 to plain ElGamal (`pk = s·H`, shared `D`, one `C_X` per party, memo keys from `r·pk_X`, no `E`); circuits, payload layouts and event fields match A.1 0.4.0. `pep()` = `B:1:0.2.0`.
> 0.1.0: derived from A.1 0.3.1 by removing the public ledger. **Implemented and deployed on BSC testnet (2026-09-27)** together with the family Wrapper; measured gas in [02-deployments](02-deployments.md). Decisions B1-1..B1-5 settled as drafted.

## 0. Why B.1 exists

A dual-ledger token cannot hide how much of its supply is confidential: the public ledger is conserved and every crossing is a public balance change (Track A README, A.1 03-deployments). Some deployments (closed-loop settlement, loyalty points, regulated instruments) do not need DeFi composability and do want that aggregate hidden. B.1 answers that need with the smallest possible delta from A.1, so that everything verified on A.1 (circuits, security review, client library, regulator flow) carries over.

## 1. Relation to A.1

| | A.1 | B.1 |
| --- | --- | --- |
| Confidential account model | pk = s⁻¹·H, id = low160(Poseidon(pk)), pk never on chain | **identical** |
| Balance ciphertexts, available / pending / folded, nonce, foldedAtBlock, lastReceivedAtBlock, decryptable | as 0.3.0 | **identical** |
| `0x01` transfer circuit (15 packed public inputs), memos, regulator ciphertext | as 0.3.0 | **identical, same verifier contract may be reused on chain** |
| `0x80` fold circuit | as 0.3.0 | **identical** |
| `0x04` unshield circuit (7 public inputs, public amount) | releases custody to a public address | **reused unchanged as the burn proof** (`0x81`): the circuit only proves "I own ≥ amount and here is the debit ciphertext"; what the contract does with the amount is the contract's business |
| Public ledger (`OpenZeppelin ERC20` balances) | present | **removed** |
| `0x03` shield | public → confidential, anyone, no proof | **replaced by `mint(id, amount)`**, MINTER role, `totalSupply += amount` |
| `0x04` unshield | confidential → public address | **replaced by `0x81` burn**: `transferFrom(id, address(0), amount)`, `totalSupply −= amount` |
| `balanceOf` | public balance | **always 0** (Track decision B-1) |
| No-payload `transfer` / `transferFrom` | public ERC-20 transfer | **revert `NoPublicLedger()`** (B-3) |
| Custody address / `shieldedSupply()` | `balanceOf(this) == shieldedSupply()` | **gone**; nothing to reconcile |
| `prepare` / `cancel` | `0x01` and `0x04` | `0x01` and `0x81` |
| Regulator key, rotation, `regulatorKey()` views | as 0.3.0 | **identical** |
| `pep()` | `"A:1:0.3.0"` | `"B:1:0.1.0"` |

Everything marked identical is copied, not shared: Variants stay self-contained (ADR-0002). The Solidity source will be a copy of `ConfidentialERC20A1` with the public-ledger paths deleted, and the circuits are byte-for-byte the same files (the on-chain verifiers deployed for A.1 can be pointed at directly).

## 2. ERC-20 surface

```solidity
function totalSupply() external view returns (uint256);            // minted − burned, public
function balanceOf(address) external pure returns (uint256);       // always 0
function transfer(address to, uint256 x) external returns (bool);  // payload required, see §3
function transferFrom(address from, address to, uint256 x) external returns (bool);
function approve(address, uint256) external returns (bool);        // no-op semantics: records nothing useful
function allowance(address, address) external view returns (uint256); // always 0
function mint(address id, uint256 amount) external;                // MINTER_ROLE
function decimals() external pure returns (uint8);                 // 6
```

`transfer(to, x)` has no public sender, so B.1 gives it exactly one meaning: **with payload `0x01` it is rejected** (`0x01` needs `from` = confidential id, which `transfer` cannot carry) and without payload it reverts. In practice every B.1 operation goes through `transferFrom`. The selector is kept only so that the token still *is* an ERC-20 for ABI purposes.

## 3. Payload types

| type | Meaning | `from` | `to` | `x` | Proof | Supply |
| --- | --- | --- | --- | --- | --- | --- |
| `0x01` | confidential → confidential | confidential id | confidential id | handle | yes (A.1 transfer circuit) | 0 |
| `0x80` | fold | confidential id | same id | handle | yes (A.1 fold circuit) | 0 |
| `0x81` | **burn** (B.1-private) | confidential id | `address(0)` | public amount | yes (A.1 unshield circuit) | −x |
| `0x03`, `0x04` | Track A only | — | — | — | — | revert `TypeNotAllowedHere` |

Flags are the family's (`includePending`, `decryptable`). Handles are the family's (`keccak256(payload) | 2²⁵⁵`). Payload byte layouts of `0x01`, `0x80` and `0x81` are identical to A.1's `0x01`, `0x80` and `0x04` respectively.

## 4. State

```solidity
struct Account { Ciphertext available; Ciphertext pending; Ciphertext folded;
                 uint64 nonce; uint64 foldedAtBlock; uint64 lastReceivedAtBlock; bytes decryptable; }
mapping(address id => Account) _accounts;
mapping(address id => mapping(uint256 handle => Prepared)) _prepared;
uint256 totalSupply;                      // the only public aggregate
RegulatorKey[] _regulatorKeys; uint32 activeRegulatorKeyId;
```

Invariants (numbering continues A.1's):

| # | Invariant |
| --- | --- |
| I1 | Σ over all ids of plaintext(available + pending − folded) == `totalSupply` (only the regulator, or someone holding every key, can check it; the chain cannot) |
| I2 | `totalSupply ≤ 2⁶⁴ − 1`, every account balance < 2⁶⁴, every operation amount < 2⁴⁸ (A1-0005 unchanged) |
| I3–I5 | as A.1 (single writer per ciphertext, monotonic pending / folded, strictly increasing nonce) |

## 5. Flows

### 5.1 mint

```
require MINTER_ROLE; require id != 0; require amount < 2^48; require totalSupply + amount ≤ 2^64 − 1
totalSupply += amount
_accounts[id].pending += (amount·G, 0) ; lastReceivedAtBlock = block.number
emit Transfer(address(0), id, amount); emit Minted(id, amount)
```

Identical to A.1's shield minus the custody transfer (≈ −20k gas). The recipient learns the amount from the `Minted` event (public), exactly as from `LedgerCrossing` in A.1.

### 5.2 `0x01` confidential transfer, `0x80` fold

Byte-for-byte A.1 §4.2 / §4.3 / §4.6.

### 5.3 `0x81` burn

```
require to == address(0); require amount < 2^48
u = parseUnshield(payload)                          // same parser as A.1 0x04
verify(unshieldVerifier, pub = [from | nonce<<160, this | chainId<<160, amount | signBits<<48, xs[4]])
_applySpend(_accounts[from], (u.Camt, u.Dsender), u.decryptable, flags)
totalSupply -= amount
emit Transfer(from, address(0), amount); emit Burned(from, amount)
```

Relayable and preparable like A.1's `0x04`. There is no "recipient": the public amount simply ceases to exist.

## 6. Circuits

None new. `transfer.circom`, `fold.circom`, `unshield.circom` from A.1 are reused unchanged; the verifier contracts already deployed for A.1 on a chain can be passed to the B.1 constructor. Public inputs bind `contractAddr`, so a proof made for an A.1 token cannot be replayed against a B.1 token or vice versa.

## 7. Events

| Event | Fields | When |
| --- | --- | --- |
| `Transfer` | `(from, to, x)` | every operation (family §7); mint/burn use the zero address, which is what indexers expect for supply changes |
| `Minted` | `(id, amount)` | mint |
| `Burned` | `(id, amount)` | `0x81` |
| `ConfidentialTransfer`, `ConfidentialTransferPrepared`, `OperationPrepared`, `PreparedExecuted`, `PreparedCancelled`, `Folded`, `RegulatorKeyRotated` | as A.1 | as A.1 |

`LedgerCrossing` does not exist (there is no other ledger).

## 8. Views

`confidentialAccountOf(id)`, `preparedOf`, `regulatorKey`, `regulatorKeyCount`, `pep()` and ERC-165 as A.1. `shieldedSupply()` is removed.

## 9. Privacy evaluation (family conventions §12)

| Goal | Achieved | Note |
| --- | --- | --- |
| P1 amount hidden | Full | as A.1 |
| P2 recipient | Pseudonymous (stable id) | as A.1 |
| P3 sender | Pseudonymous (stable id) | as A.1 |
| P4 unlinkability | No | stable ids; stealth (`0x02`) would be the same backlog item as in A.1 |
| P5 crossing linkability | **n/a** | there is no crossing; mint / burn are public by decision B-2 |
| **Confidential aggregate** | **Hidden** | the only public number is `totalSupply`; no address, view or event reveals how supply is distributed |
| S1–S5 | as A.1 | proof-as-authorization, regulator ciphertext, no registry, browser-only keys, no user-error fallbacks |

What B.1 still reveals: `totalSupply`, every mint and burn (id, amount, block), the transfer graph between ids (amounts hidden), and per-id activity timing (`foldedAtBlock` / `lastReceivedAtBlock`, as A1-0006 notes for A.1).

## 10. Gas (estimated from A.1 0.3.0 measurements)

| Operation | A.1 measured | B.1 estimate | Delta |
| --- | --- | --- | --- |
| mint (fresh id) | shield 214k | **177k measured** (194k local) | no ERC20 `_update`, no custody |
| `0x01` (first spend, includePending) | 716k | 716k | identical |
| `0x80` fold (first) | 464k | 464k | identical |
| `0x81` burn (default mode) | unshield 374k | **362k measured** | no `_update` to a recipient |
| `wrap` (first for a token) | — | **967k measured** (≈ 410k afterwards) | burn + wCLS creation + wCLS mint |
| `unwrap` | — | **125k measured** | wCLS burn + confidential mint |

## 11. Scope of 0.1

**Included**: everything in §2–§8. **Excluded**: stealth `0x02`, a confidential mint (hidden issuance), any public ledger or bridge to one, an official trusted setup (A.1's dev ptau is reused for now).

## 12. Wrapper hooks (family tool, [10-wrapper](../../../10-wrapper.md))

B.1 implements `IPEPWrappable` so a B.1 token can reach DeFi through the family wrapper:

| Interface | B.1 implementation |
| --- | --- |
| `wrapperMint(bytes recipient, amount)` | `recipient` = 20-byte confidential id; same body as `mint` (§5.1) but gated by `msg.sender == wrapper()` instead of `MINTER_ROLE`; emits `Transfer(0x0, id, amount)` and `Minted` |
| `wrapperBurn(from, to, amount, payload)` | the `0x81` burn (§5.3) with `to` = the public address that will receive `wTOKEN`; the reused unshield circuit binds `to` and `amount` (F14); gated by `msg.sender == wrapper()`; emits `Transfer(id, 0x0, amount)` and `Burned` |
| `wrapper()` | set once at construction (or by `DEFAULT_ADMIN_ROLE` while unset); no rotation in 0.1 |

A direct `0x81` (not via the wrapper) keeps `to == address(0)`. Both paths reduce `totalSupply`.

## 13. Open decisions

| # | Question | Draft answer | Why it needs the owner |
| --- | --- | --- | --- |
| B1-1 | Keep `0x81` burn at all? | **Yes (settled 2026-09-27)** | The wrapper's `wrapperBurn` is this operation; without it a B.1 token could never reach DeFi |
| B1-2 | Should `mint` accept a batch of ids to hide *who* got minted how much? | No for 0.1 | Batch mint still reveals per-id amounts via events; hiding them needs a confidential mint (excluded) |
| B1-3 | `approve` / `allowance`: keep as no-ops or revert? | Keep as no-ops | Some wallets call `allowance` before showing a token; reverting there is hostile for no gain |
| B1-4 | Contract code: copy of A.1 with paths deleted, or inherit A.1 and override? | Copy | ADR-0002 (self-contained Variants); inheriting would drag the public ledger's storage layout along |
| B1-5 | Reuse A.1's deployed verifiers on BSC testnet, or deploy B.1's own? | Reuse | identical bytecode; proofs are bound to the token address anyway |
