English | [中文](04-modules.zh-cn.md)

# A.1 modules and compositions

Version: `0.5.0`. Status: `Draft`. Date: 2026-10-13

This document is the structure of A.1 under [ADR-0008](../../../adr/0008-modules.md): one core and three modules.

**Status of the implementation (2026-10-13).** The contracts repository implements it as `A1LedgerToken` and `A1PrivateToken`; all tests pass, and gas is within 300 of the standalone contracts on every measured operation. Both compositions are deployed on BSC testnet ([03-deployments](03-deployments.md)) and the dApp targets them. Not done yet: no operation has been run against the new tokens on chain, and the dApp pages have not been exercised in a browser. §9 lists what changed.

The core is specified in [01-design](01-design.md). No circuit changes.

## 1. Structure

```
A.1 core                privacy-only ledger of encrypted accounts
│                       0x01 transfer, 0x80 fold, prepare / cancel, regulator key
│                       circuits: transfer, unshield, fold
│
├─ Public ledger        compile-time    standard ERC-20 balances at the token's address
│                                       0x03 shield, 0x04 unshield
├─ Role issuance        compile-time    mintConfidential, 0x81 burn; mint when the public ledger is present
└─ Wrapper port         compile-time    IPEPWrappable
     └─ PEPWrapper      runtime         the family Wrapper, plugged into the port
```

| Part | Kind | Needs | Adds a payload type | Changes a circuit |
| --- | --- | --- | --- | --- |
| Core | n/a | n/a | `0x01`, `0x80` | n/a |
| Public ledger | Compile-time module | Core | `0x03`, `0x04` | No |
| Role issuance | Compile-time module | Core | `0x81` | No |
| Wrapper port | Compile-time port, runtime module | Core | None | No |

A token is the core plus a set of these. It needs a source of supply, and role issuance is the only one today, so every composition includes it. The Wrapper port cannot issue: it only returns what left through it.

**Declared support.** A.1 0.5.0 supports exactly these three modules: public ledger, role issuance, Wrapper port. The list is part of the version (07 §13.2). A module registered in the family later is not supported by A.1 0.5.0, and a 0.5.0 token cannot use it; supporting it takes a new A.1 version.

## 2. What the core offers a module

A module never writes an account's ciphertexts. It calls one of two internal primitives, and the core does the rest.

| Primitive | What it does | Proof |
| --- | --- | --- |
| `_creditPublic(id, amount)` | Adds the degenerate ciphertext `(amount·G, 0)` to `pending` of `id`; records `lastReceivedAtBlock`; increases the confidential supply | None: the amount is public |
| `_debitPublic(from, to, amount, payload)` | Verifies the unshield proof for `(from, nonce, amount, to)`, applies the spend with the lazy fold of 01-design §4.3; decreases the confidential supply | Unshield circuit (01-design §5.2) |

- `amount < 2⁴⁸` in both (A1-0005).
- `to` in `_debitPublic` is the public value the caller wants bound into the proof: the public recipient for `0x04`, the zero address for a burn, the recipient of the wrapped token for a wrap. The circuit does not care what it means (security review F14).
- Neither primitive emits `Transfer`. The module emits it, because the shape differs per module.
- A module may add its own storage. It may not read or write `_accounts` except through the primitives.

Every module of §4 is these two primitives plus bookkeeping.

## 3. Supply

The core keeps one counter, the **confidential supply**: the sum of all confidential balances. It is public, because it changes only by public amounts.

| Quantity | Definition | Where |
| --- | --- | --- |
| Confidential supply | Sum of all confidential balances | Core. Exposed as `shieldedSupply()` by the public ledger; equal to `totalSupply()` without it |
| `totalSupply()` | Everything at the token's address: public balances plus the confidential supply | ERC-20 |
| `wrappedOut` | What has left through the Wrapper port and not come back | Wrapper port |
| `issuedSupply()` | `totalSupply() + wrappedOut` | Core; without the Wrapper port it equals `totalSupply()` |

**Cap.** `issuedSupply() ≤ 2⁶⁴ − 1`, checked on every mint. It bounds every confidential balance, which the range proofs rely on (01-design, I2; review B1-F1).

| Operation | Module | Confidential supply | Public balances | `wrappedOut` | `totalSupply` | `issuedSupply` |
| --- | --- | --- | --- | --- | --- | --- |
| `0x01`, `0x80` | Core | 0 | 0 | 0 | 0 | 0 |
| `mint` | Role issuance with public ledger | 0 | `+x` | 0 | `+x` | `+x` |
| `mintConfidential` | Role issuance | `+x` | 0 | 0 | `+x` | `+x` |
| `0x81` burn | Role issuance | `−x` | 0 | 0 | `−x` | `−x` |
| `0x03` shield | Public ledger | `+x` | `−x` | 0 | 0 | 0 |
| `0x04` unshield | Public ledger | `−x` | `+x` | 0 | 0 | 0 |
| wrap | Wrapper port | `−x` | 0 | `+x` | `−x` | 0 |
| unwrap | Wrapper port | `+x` | 0 | `−x` | `+x` | 0 |

**The one place where modules meet.** With the public ledger, confidential value is escrowed as public tokens at the token's own address, so `balanceOf(token) == shieldedSupply()`. When role issuance or the Wrapper port creates or destroys confidential value, the escrow has to follow. The core therefore declares a pair of internal hooks, `_onConfidentialCreated(id, amount)` and `_onConfidentialDestroyed(id, amount)`. The ERC-20 surface implements them: the public ledger mints or burns escrow, and a token without it emits `Transfer` from or to the zero address. This is why the public ledger comes first in the inheritance order.

## 4. Modules

### 4.1 Public ledger

| | |
| --- | --- |
| Kind | Compile-time |
| Adds | The standard ERC-20 ledger keyed by Ethereum address: `balanceOf`, payload-less `transfer` / `transferFrom`, `approve`, `allowance`. Payload types `0x03` (shield) and `0x04` (unshield). `shieldedSupply()`. Event `LedgerCrossing` |
| Flows | 01-design §4.1 and §4.4: a shield is a public transfer into escrow followed by `_creditPublic`; an unshield is `_debitPublic` followed by a release from escrow |
| Requirement | The public-ledger logic is the unmodified OpenZeppelin `ERC20`. No failure of the confidential logic can affect it |
| Interface (draft) | `IPEPPublicLedger { function shieldedSupply() external view returns (uint256); }` |
| Without it | `balanceOf` returns 0 for every address, a payload-less `transfer` reverts `NoPublicLedger()`, `approve` and `allowance` authorise nothing, and `0x03` / `0x04` revert `TypeNotAllowedHere` |

### 4.2 Role issuance

| | |
| --- | --- |
| Kind | Compile-time |
| Adds | `MINTER_ROLE`. `mintConfidential(id, amount)`: `_creditPublic`, emits `Transfer(0x0, id, amount)` and `Minted`. Payload type `0x81`, called as `transferFrom(id, 0x0, amount)`: `_debitPublic` with `to = 0x0`, emits `Transfer(id, 0x0, amount)` and `Burned`. With the public ledger, the `Transfer` events of these two are the mint and burn of escrow at the token's address, and there is also `mint(to, amount)`, a public mint |
| Who may burn | The holder: `0x81` is authorised by the holder's proof, not by a role |
| Limit | The supply cap of §3 |
| Interface (draft) | `IPEPRoleIssuance { function mintConfidential(address id, uint256 amount) external; }` |
| Preparable | `0x81` can use `prepare` / `cancel` like `0x04` |

Mint and burn amounts are public, and so is the id that receives a mint. A hidden issuance would need a circuit and is therefore a Variant matter, not a module.

### 4.3 Wrapper port

| | |
| --- | --- |
| Kind | Compile-time port; the runtime module is the family `PEPWrapper` ([10](../../../10-wrapper.md)) |
| Adds | `wrapperMint(recipient, amount)`: `recipient` is a 20-byte id; requires `amount ≤ wrappedOut`, then `wrappedOut −= amount` and `_creditPublic`. `wrapperBurn(from, to, amount, payload)`: `_debitPublic` with `to` = the recipient of the wrapped token, then `wrappedOut += amount`. `wrapper()`, `wrappedOut()`. Events `WrapperMinted` and `WrapperBurned`; the port does not emit `Minted` or `Burned` |
| Who may call | Only `wrapper()`. It is set at construction or once by the admin and never rotated |
| Limit | Credits never exceed `wrappedOut`: a compromised Wrapper can mis-credit what left through it, never inflate (review B1-F2) |
| Interface | `IPEPWrappable`, unchanged |
| Not preparable | `wrapperBurn` takes its payload directly |

## 5. ERC-20 surface by composition

| | With the public ledger | Without |
| --- | --- | --- |
| `balanceOf(a)` | Public balance; the token's own address holds the escrow | 0 for every address |
| `transfer` / `transferFrom` without payload | Standard ERC-20 | Revert `NoPublicLedger()` |
| `approve`, `allowance` | Standard; also used by `0x03` through `transferFrom` | Kept for the ABI; authorise nothing |
| `totalSupply()` | Public balances, including the escrow | Minted minus burned, minus what is out through the Wrapper |
| `Σ balanceOf == totalSupply` | Holds | Fails by construction: no balance is public |
| Wallets and explorers | Show public balances | Show 0; the real balance is visible only in a wallet that speaks A.1 |
| DeFi | The token itself | Through the Wrapper's `wTOKEN`, if the port is present |
| `supportsInterface(IERC20)` | True | True: the ABI is ERC-20 in both. Whether balances are real is what the probe says |

In both, `transferFrom(id, id, handle)` with `0x01` or `0x80` behaves as in 01-design.

## 6. Compositions

| Composition | Core | Public ledger | Role issuance | Wrapper port | Contract |
| --- | --- | --- | --- | --- | --- |
| **With the public ledger** | Yes | Yes | Yes | No | `A1LedgerToken` (before 0.5.0: `ConfidentialERC20A1`) |
| **Privacy-only** | Yes | No | Yes | Yes | `A1PrivateToken` (before 0.5.0: `ConfidentialERC20B1`, [records](../variant-1-privacy-only/README.md)) |

- **Inheritance order**: core, public ledger, role issuance, Wrapper port (07 §13.2).
- **Public ledger together with the Wrapper port**: not built or tested. No use is known, and it would need one more thing. The unshield proof binds `to` but not which exit is meant. Today the exits cannot be confused because they accept disjoint recipients: zero for a burn, non-zero for an unshield or a wrap, and no built composition has both of the last two. A token with both would have to bind the kind of exit into the proof.
- **Contracts**: `A1Core` (abstract core), `A1NoLedger` (the ERC-20 surface without public balances), `A1PublicLedger`, `A1RoleIssuance`, `A1WrapperPort` (abstract modules), and two deployable tokens, `A1LedgerToken` and `A1PrivateToken`. A composition takes exactly one of `A1NoLedger` and `A1PublicLedger`.

## 7. Probe

`pep()` returns `A:1:0.5.0` for both compositions. They are told apart by `pepModules()` (07 §13.3):

| Composition | `pepModules()` |
| --- | --- |
| With the public ledger | `(IPEPPublicLedger, token)`, `(IPEPRoleIssuance, token)` |
| Privacy-only | `(IPEPRoleIssuance, token)`, `(IPEPWrappable, wrapper)`; the second entry has the zero address while no Wrapper is set |

## 8. What differs for privacy

The core gives both compositions the same guarantees (01-design; the evaluation table is in the README). Two things depend on the modules:

| | With the public ledger | Privacy-only |
| --- | --- | --- |
| How much of the supply is confidential | Public: `shieldedSupply()` | Hidden as long as the token never wraps; `wTOKEN.totalSupply()` reveals it once it does |
| Link between a wallet and an id | Every `0x03` / `0x04` is a public edge `wallet ↔ id` | Only a mint (issuer to id) and a wrap or unwrap |

## 9. What changes at 0.5.0

Relative to the two deployed contracts. Nothing here changes a circuit, a payload layout or an event that clients parse for `0x01` / `0x80`. All nine items are done (contracts `3414e24`, dApp `4975eb8`, deployments of 2026-10-13).

| # | Change | Affects |
| --- | --- | --- |
| 1 | One core, shared by both compositions, instead of two copies | Contracts |
| 2 | One version and one descriptor: `A:1:0.5.0`. `B:1:…` is no longer issued | Contracts, dApp routing, deployments |
| 3 | `pepModules()` and the module interface ids | Contracts, dApp |
| 4 | Privacy-only: `mint(id, amount)` is renamed `mintConfidential(id, amount)` | Contracts, dApp, scripts |
| 5 | With the public ledger: `mintConfidential` and `0x81` become available | Contracts, tests |
| 6 | `issuedSupply()` exists in both compositions | Contracts |
| 7 | The dApp picks the page from `pep()` and switches features from the modules, instead of one route per Track | dApp |
| 8 | Both testnet tokens are redeployed. The privacy-only token reuses the verifiers and the window table of the new ledger-token deployment, and the Wrapper that is already on the chain | Deployments |
| 9 | A wrap emits `WrapperBurned` only. The standalone contract emitted `Burned` as well, which the dApp's regulator view counts as a second outflow | Contracts, regulator view |

## 10. Review and tests

- The two shipped compositions were reviewed as standalone contracts ([02-security-review](02-security-review.md), [privacy-only review](../variant-1-privacy-only/03-security-review.md)). After the restructuring, the review is repeated against the diff, with attention to the hooks of §3 and to the cap being checked against `issuedSupply()` on every mint path.
- Tests run per module and per shipped composition. Supply conservation (the table of §3) is asserted after every operation.
- Bytecode: `A1LedgerToken` 18,339 bytes, `A1PrivateToken` 17,345 bytes; the limit is 24,576. The standalone contracts were 17,060 and 17,195.
- Gas, measured locally against the standalone contracts with the same tests: every operation is within 300 gas. New: `0x81` burn with the public ledger, 528k on an account's first spend.

## 11. Decisions

All four were adopted as drafted on 2026-10-13 and are implemented.

| # | Decision | Adopted | Alternative not taken |
| --- | --- | --- | --- |
| M1 | Name of the confidential mint | `mintConfidential(id, amount)` in every composition; `mint(to, amount)` is always public | Keep `mint` and let its meaning depend on the composition, as today |
| M2 | `mintConfidential` and `0x81` in the composition with the public ledger | Available | Leave them out to keep that contract exactly as deployed |
| M3 | Contract names | The proposal of §6 | Keep `ConfidentialERC20A1` for the composition with the public ledger |
| M4 | Interface of the public-ledger module | `shieldedSupply()` | A marker id not tied to a function |
