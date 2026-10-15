English | [中文](04-modules.zh-cn.md)

# A.1 modules and compositions

Version: `0.7.0`. Status: `Draft`. Date: 2026-10-15

This document is the structure of A.1 under [ADR-0008](../../../adr/0008-modules.md): one core and three modules. From 0.7.0 it follows [ADR-0013](../../../adr/0013-mintable.md) (Mintable; the initial supply and the burn in the core) and [A1-0007](../../../adr/a1-0007-exit-kind-binding.md) (the exit kind bound through the recipient value).

**Status of the implementation (2026-10-15).** This document describes 0.7.0, which is designed and not implemented; §9.2 lists what it changes. What runs today is 0.6.0. It is implemented in the contracts repository (`a2c0ae0`, all tests pass) and in the dApp (`e06424a`), and both of its compositions are deployed on BSC testnet ([03-deployments](03-deployments.md)) and were run end to end on chain on 2026-10-13. For 0.6.0, read "role issuance" wherever this document says Mintable, and read §1 to §8 with the differences listed in §9.2. Not done for 0.6.0: a `mint` to a confidential id and the `0x81` burn on the token with the public ledger have only been run locally, and the dApp pages have not been exercised in a browser.

The core is specified in [01-design](01-design.md). No circuit changes.

## 1. Structure

```
A.1 core                privacy-only ledger of encrypted accounts
│                       initial supply, 0x01 transfer, fold (0x80), 0x81 burn, regulator key
│                       circuits: transfer, unshield, fold
│
├─ Public ledger        compile-time    standard ERC-20 balances at the token's address
│                                       0x03 shield, 0x04 unshield
├─ Mintable             compile-time    mint after deployment (0x82 for an id; public without a payload)
└─ Wrapper port         compile-time    ICasataWrappable
     ├─ CasataWrapper   runtime         the family Wrapper
     └─ CasataGateway   runtime         the family gateway for an existing ERC-20 (14)
```

| Part | Kind | Needs | Adds a payload type | Changes a circuit |
| --- | --- | --- | --- | --- |
| Core | n/a | n/a | `0x01`, `0x80`, `0x81` | n/a |
| Public ledger | Compile-time module | Core | `0x03`, `0x04` | No |
| Mintable | Compile-time module | Core | `0x82` | No |
| Wrapper port | Compile-time port, runtime module | Core | None | No |

A token is the core plus any subset of these. Every token issues its initial supply at deployment (§3). Mintable is the only module that issues afterwards, and the Wrapper port only returns what left through it (ADR-0013, item 4). So every subset has a supply, and all eight are tokens (§6).

**Declared support.** A.1 0.7.0 supports exactly these three modules: public ledger, Mintable, Wrapper port. 0.5.0 and 0.6.0 declared the same three, with Mintable under its former name, role issuance (ADR-0013, item 1). The list is part of the version (07 §13.2). A module registered in the family later is not supported by A.1 0.7.0, and a 0.7.0 token cannot use it; supporting it takes a new A.1 version.

## 2. What the core offers a module

A module never writes an account's ciphertexts. It calls one of two internal primitives, and the core does the rest.

| Primitive | What it does | Proof |
| --- | --- | --- |
| `_creditPublic(id, amount)` | Adds the degenerate ciphertext `(amount·G, 0)` to `pending` of `id`; records `lastReceivedAtBlock`; increases the confidential supply | None: the amount is public |
| `_debitPublic(from, kind, to, amount, payload)` | Verifies the unshield proof for `(from, nonce, amount, r)`, where `r` is the recipient value of the exit `kind`; applies the spend with the lazy fold of 01-design §4.3; decreases the confidential supply | Unshield circuit (01-design §5.2) |

- `amount < 2⁴⁸` in both (A1-0005).
- `to` in `_debitPublic` is the public recipient: the public recipient for `0x04`, the zero address for a burn, the recipient of the wrapped token (or of the released ERC-20) for `wrapperBurn`. Up to 0.6.0 the proof bound `to` itself. From 0.7.0 it binds `r`: `r = 0` for the burn, and for the two exits to a non-zero recipient `r = uint160(uint256(keccak256(abi.encodePacked("Casata A.1 exit", kind, to))))`, with `kind = 1` for `0x04` and `kind = 2` for `wrapperBurn` (A1-0007). The circuit does not care what the value means (security review F14). The caller does not pass `r`; the core computes it from `kind` and `to`.
- Neither primitive emits `Transfer`. The caller emits it, because the shape differs per operation.
- A module may add its own storage. It may not read or write `_accounts` except through the primitives.

Every module of §4 is these two primitives plus bookkeeping. So are the core's own initial issuance and burn (§3, §4.0).

## 3. Supply

The core keeps one counter, the **confidential supply**: the sum of all confidential balances. It is public, because it changes only by public amounts.

| Quantity | Definition | Where |
| --- | --- | --- |
| Confidential supply | Sum of all confidential balances | Core. Exposed as `shieldedSupply()` by the public ledger; equal to `totalSupply()` without it |
| `totalSupply()` | Everything at the token's address: public balances plus the confidential supply | ERC-20 |
| `wrappedOut` | What has left through the Wrapper port and not come back | Wrapper port |
| `issuedSupply()` | `totalSupply() + wrappedOut` | Core; without the Wrapper port it equals `totalSupply()` |

**Cap.** `issuedSupply() ≤ 2⁶⁴ − 1`, checked on every issuance, the initial one included. It bounds every confidential balance, which the range proofs rely on (01-design, I2; review B1-F1).

**Initial supply.** The constructor takes `initialTo`, `initialAmount` and `initialPayload` and issues once, by the rule of `mint` (§4.2, 07 §3):

- `initialPayload` empty: a public issuance to the address `initialTo`. Only with the public ledger; without it the deployment reverts `NoPublicLedger()`.
- `initialPayload` = `0x82` with flags 0: `_creditPublic(initialTo, initialAmount)`, a confidential balance for the id `initialTo`. An id is the key a wallet derives for one token's address (07 §8), so a deployer who wants the initial supply in its own id derives it for the address the deployment will get, from its account and nonce. The dApp's deploy form does this; if another transaction moves the nonce first, the supply lands in an id nobody holds. Like any credit to an id, the amount is below 2⁴⁸ (§2).
- `initialAmount` may be zero only on a token with Mintable. A token without Mintable and with nothing issued could never hold anything, so the deployment reverts `NoSupply()`.
- It emits what a mint emits: `Transfer(0x0, initialTo, initialAmount)`, and `Minted` when it goes to an id (a public issuance has only the ERC-20 `Transfer`). Nothing when the amount is zero. A payload other than empty or `0x82 00` reverts `BadInitialPayload()`.

| Operation | Part | Confidential supply | Public balances | `wrappedOut` | `totalSupply` | `issuedSupply` |
| --- | --- | --- | --- | --- | --- | --- |
| Initial issuance, public | Core, with the public ledger | 0 | `+x` | 0 | `+x` | `+x` |
| Initial issuance with `0x82` | Core | `+x` | 0 | 0 | `+x` | `+x` |
| `0x01`, `fold` | Core | 0 | 0 | 0 | 0 | 0 |
| `0x81` burn | Core | `−x` | 0 | 0 | `−x` | `−x` |
| `mint` without payload | Mintable with public ledger | 0 | `+x` | 0 | `+x` | `+x` |
| `mint` with `0x82` | Mintable | `+x` | 0 | 0 | `+x` | `+x` |
| `0x03` shield | Public ledger | `+x` | `−x` | 0 | 0 | 0 |
| `0x04` unshield | Public ledger | `−x` | `+x` | 0 | 0 | 0 |
| wrap (`wrapperBurn`) | Wrapper port | `−x` | 0 | `+x` | `−x` | 0 |
| unwrap (`wrapperMint`) | Wrapper port | `+x` | 0 | `−x` | `+x` | 0 |

**The one place where modules meet.** With the public ledger, confidential value is escrowed as public tokens at the token's own address, so `balanceOf(token) == shieldedSupply()`. When the core, Mintable or the Wrapper port creates or destroys confidential value, the escrow has to follow. The core therefore declares a pair of internal hooks, `_onConfidentialCreated(id, amount)` and `_onConfidentialDestroyed(id, amount)`. The ERC-20 surface implements them: the public ledger mints or burns escrow, and a token without it emits `Transfer` from or to the zero address. This is why the public ledger comes first in the inheritance order.

## 4. The core's issuance and burn, and the modules

### 4.0 In the core: initial issuance and burn

| | |
| --- | --- |
| Initial issuance | §3. Once, in the constructor. It needs no role, and no one can issue this way afterwards |
| Burn | `transferFrom(id, 0x0, amount)` + payload `0x81`: `_debitPublic` with `to = 0x0` (so `r = 0`), emits `Transfer(id, 0x0, amount)` and `Burned`. With the public ledger the `Transfer` is the burn of escrow at the token's address |
| Who may burn | The holder: `0x81` is authorised by the holder's proof, not by a role |
| Why in the core | A confidential transfer to an id nobody controls hides its amount, so it cannot be excluded from the circulating supply. A burn with a public amount is the only reduction of supply that others can verify, and a token issued once may need it as much as a token that keeps minting (ADR-0013, item 3) |

Up to 0.6.0 the burn belonged to role issuance, and a token had no initial issuance.

### 4.1 Public ledger

| | |
| --- | --- |
| Kind | Compile-time |
| Adds | The standard ERC-20 ledger keyed by Ethereum address: `balanceOf`, payload-less `transfer` / `transferFrom`, `approve`, `allowance`. Payload types `0x03` (shield) and `0x04` (unshield). `shieldedSupply()`. Event `LedgerCrossing` |
| Flows | 01-design §4.1 and §4.4: a shield is a public transfer into escrow followed by `_creditPublic`; an unshield is `_debitPublic` with `kind = 1` followed by a release from escrow |
| Requirement | The public-ledger logic is the unmodified OpenZeppelin `ERC20`. No failure of the confidential logic can affect it |
| Interface | `ICasataPublicLedger { function shieldedSupply() external view returns (uint256); }` |
| Without it | `balanceOf` returns 0 for every address, a payload-less `transfer`, `transferFrom` or `mint` reverts `NoPublicLedger()`, `approve` reverts `NoPublicLedger()` and `allowance` returns 0, and `0x03` / `0x04` revert `TypeNotAllowedHere`. A public initial issuance reverts the deployment `NoPublicLedger()` |

### 4.2 Mintable

Named role issuance up to 0.6.0 (ADR-0013, item 1).

| | |
| --- | --- |
| Kind | Compile-time |
| Adds | `MINTER_ROLE` and `mint(to, amount)`, which follows the payload rule of the family (07 §1, §13.1). Nothing else: the burn is in the core from 0.7.0 |
| Mint to an id | `mint(id, amount)` + payload `0x82`. The payload is `[type, flags = 0]`, 2 bytes, like `0x03`. `_creditPublic`, emits `Transfer(0x0, id, amount)` and `Minted`. With the public ledger the `Transfer` is the mint of escrow at the token's address |
| Public mint | `mint(to, amount)` without a payload: an ordinary ERC-20 mint to the address `to`. Only with the public ledger; without it the call reverts `NoPublicLedger()` |
| Who may mint | Holders of `MINTER_ROLE`, granted by the admin. A contract may hold it: the family gateway mints what it receives ([14](../../../14-gateway.md)) |
| Limit | The supply cap of §3 |
| Interface | `ICasataMintable { function mint(address to, uint256 amount) external; }`. The ERC-165 id is the selector of `mint(address,uint256)`, `0x40c10f19`, the same as that of `ICasataRoleIssuance` in 0.6.0 |
| A forgotten payload | On a token with the public ledger, `mint(id, amount)` sent without its payload is a public mint to the address `id`. Nobody holds a key for that address, so the balance cannot be moved. Transfers already follow this rule (07 §3); the minter has to follow it too |
| Without it | No one can issue after deployment: the supply is the initial supply less what is burned. A call to `mint` reverts |

Mint and burn amounts are public, and so is the id that receives a mint. A hidden issuance would need a circuit and is therefore a Variant matter, not a module.

### 4.3 Wrapper port

| | |
| --- | --- |
| Kind | Compile-time port. The runtime module is the family `CasataWrapper` ([10](../../../10-wrapper.md)) or the family gateway ([14](../../../14-gateway.md)); a token has one `wrapper()` |
| Adds | `wrapperMint(recipient, amount)`: `recipient` is a 20-byte id; requires `amount ≤ wrappedOut`, then `wrappedOut −= amount` and `_creditPublic`. `wrapperBurn(from, to, amount, payload)`: `_debitPublic` with `kind = 2` and `to` = the recipient of the wrapped token or of the released ERC-20, then `wrappedOut += amount`. `wrapper()`, `wrappedOut()`. Events `WrapperMinted` and `WrapperBurned`; the port does not emit `Minted` or `Burned` |
| Who may call | Only `wrapper()`. It is set at construction or once by the admin and never rotated |
| Limit | Credits never exceed `wrappedOut`: a compromised Wrapper can mis-credit what left through it, never inflate (review B1-F2) |
| Interface | `ICasataWrappable`. Functions and interface id unchanged since 0.5.0 |

## 5. ERC-20 surface by composition

| | With the public ledger | Without |
| --- | --- | --- |
| `balanceOf(a)` | Public balance; the token's own address holds the escrow | 0 for every address |
| `transfer` / `transferFrom` without payload | Standard ERC-20 | Revert `NoPublicLedger()` |
| `approve`, `allowance` | Standard; also used by `0x03` through `transferFrom` | `approve` reverts `NoPublicLedger()`; `allowance` returns 0 |
| `mint` without payload | With Mintable: public mint to an address. Without: reverts | Revert `NoPublicLedger()` |
| `totalSupply()` | Public balances, including the escrow | Initial supply plus minted, minus burned, minus what is out through the Wrapper port |
| `Σ balanceOf == totalSupply` | Holds | Fails by construction: no balance is public |
| Wallets and explorers | Show public balances | Show 0; the real balance is visible only in a wallet that speaks A.1 |
| DeFi | The token itself | Through the port's runtime module, if the port is present: the Wrapper's `wTOKEN`, or the underlying ERC-20 of a gateway |
| `supportsInterface(IERC20)` | True | True: the ABI is ERC-20 in both. Whether balances are real is what the probe says |

In both, `transferFrom(id, id, handle)` with `0x01`, `transferFrom(id, 0x0, amount)` with `0x81` and `fold(id, payload)` behave as specified in 01-design and §4.0; with Mintable, so does `mint(id, amount)` with `0x82` (§4.2).

## 6. Compositions

The three modules give eight subsets. In 0.7.0 every one of them is a token: each has its initial supply (ADR-0013), and an exit through the public ledger can no longer be confused with one through the Wrapper port (A1-0007).

| Public ledger | Mintable | Wrapper port | What it is |
| --- | --- | --- | --- |
| | | | A fixed-supply privacy token: the core alone |
| Yes | | | A fixed-supply token with public and confidential balances |
| | | Yes | A fixed-supply privacy token with a wrapped ERC-20 |
| Yes | | Yes | A fixed-supply token with public balances and a wrapped ERC-20 |
| | Yes | | A privacy token that keeps issuing. `A1PrivateToken` of 0.6.0 behaved this way while no Wrapper was set |
| Yes | Yes | | `A1LedgerToken`, shipped in 0.6.0 |
| | Yes | Yes | `A1PrivateToken`, shipped in 0.6.0. With the gateway as `wrapper()`: the privacy version of an existing ERC-20 |
| Yes | Yes | Yes | Before 0.7.0 not a token, because the two exits were not told apart. With the gateway as `wrapper()`: the privacy version of an existing ERC-20 that can also be held publicly |

- **Inheritance order**: core, public ledger, Mintable, Wrapper port (07 §13.2).
- **Public ledger together with the Wrapper port.** The unshield proof binds `to` but, up to 0.6.0, not which exit is meant. The exits could not be confused only because no built composition had both `0x04` and `wrapperBurn`. From 0.7.0 the proof binds `r` (§2), so the two exits are told apart and this composition is allowed. A wrapped ERC-20 beside public balances has little use with the Wrapper. It has one with the gateway, where the public balance and the underlying ERC-20 are different assets.
- **The gateway composition** ([14](../../../14-gateway.md)). Mintable and the Wrapper port, with or without the public ledger, and the gateway set as `wrapper()` and holding `MINTER_ROLE`. The gateway mints against what it locks and releases the locked ERC-20 through `wrapperBurn`. The supply is backed only if the gateway is the sole holder of `MINTER_ROLE`, the admin has renounced granting it, and the initial supply is zero (ADR-0013, item 5). The token does not enforce this; a front end checks it. A.1 has 6 decimals (A1-0005), so the gateway converts the precision of an underlying token with more.
- **Contracts.** The parts stay as in 0.6.0, with `A1RoleIssuance` renamed `A1Mintable`: `A1Core` (abstract core, now with the initial issuance and the burn), `A1NoLedger` (the ERC-20 surface without public balances), `A1PublicLedger`, `A1Mintable`, `A1WrapperPort` (abstract modules). A composition takes exactly one of `A1NoLedger` and `A1PublicLedger`. 0.7.0 ships one deployable contract per subset, generated by a script from these parts (M10, §11). `A1LedgerToken` and `A1PrivateToken` keep their names for the two compositions shipped in 0.6.0; the other six are `A1Token` followed by the letters of their modules (`L` public ledger, `M` Mintable, `W` Wrapper port), from `A1Token` (the core alone) to `A1TokenLMW`. The script is `contracts/scripts/track-a/variant-1/gen-compositions.mjs`, and the files are in `contracts/contracts/track-a/variant-1/tokens/`.

## 7. Probe

`casata()` returns `A:1:0.7.0` for every composition. They are told apart by `casataModules()` (07 §13.3), which lists one entry per module present:

| Module present | Entry in `casataModules()` |
| --- | --- |
| Public ledger | `(ICasataPublicLedger, token)` |
| Mintable | `(ICasataMintable, token)` |
| Wrapper port | `(ICasataWrappable, wrapper)`; the address is zero while no runtime module is set |

The core alone returns an empty list. The two compositions of 0.6.0 return `A:1:0.6.0` and the same entries, with the Mintable entry named `ICasataRoleIssuance`. Its id is the same, so a front end reads both the same way. Whether a Wrapper port holds the Wrapper or a gateway is read from the runtime module at the returned address (14).

In 0.5.0 the same two functions are `pep()` and `pepModules()` (ADR-0011).

## 8. What differs for privacy

The core gives every composition the same guarantees (01-design; the evaluation table is in the README). Two things depend on the modules:

| | With the public ledger | Without |
| --- | --- | --- |
| How much of the supply is confidential | Public: `shieldedSupply()` | Public: all of `totalSupply()` is confidential. What is out through the Wrapper port is `wrappedOut()` |
| Link between a wallet and an id | Every `0x03` / `0x04` is a public edge `wallet ↔ id` | Only an issuance to an id (issuer to id), a wrap or unwrap, and with the gateway a deposit or withdrawal |

The 0.6.0 text said that, without the public ledger, the confidential share of the supply stays hidden as long as the token never wraps. That was wrong: every change of the confidential supply is a public amount (§3), so it is public in every composition.

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

### 9.1 What changes at 0.6.0

Relative to 0.5.0. Decision records: [ADR-0010](../../../adr/0010-erc20-surface-tradeoffs.md) and [ADR-0011](../../../adr/0011-project-name-casata.md). No circuit changes, so the proving keys and the verifier contracts stay the same. All seven items are done (2026-10-13). The redeployment put a new set of verifiers and a new window table on chain with the ledger token, and kept the Wrapper.

| # | Change | Affects |
| --- | --- | --- |
| 1 | The fold is called as `fold(id, payload)`, not as a `transferFrom`. The payload bytes are the same. `Folded` is `(id, nonce)`, without a handle | Contracts, dApp, scripts |
| 2 | `prepare`, `cancel`, `preparedOf`, the stored registrations and the events `ConfidentialTransferPrepared`, `OperationPrepared`, `PreparedCancelled` and `PreparedExecuted` are removed | Contracts |
| 3 | `mint(to, amount)` with the payload rule replaces `mintConfidential`. New payload type `0x82` | Contracts, dApp, scripts |
| 4 | Without the public ledger, `approve` reverts `NoPublicLedger()` | Contracts |
| 5 | `pep()` becomes `casata()`, `pepModules()` becomes `casataModules()`, the family interfaces are `ICasata*`. The key-derivation domain is `"Casata"`, so a wallet derives different keys than for 0.5.0 | Contracts, dApp |
| 6 | The dApp states, before a signature, that the number shown by the wallet is a handle (07 §4) | dApp |
| 7 | Both testnet tokens are redeployed. The verifiers, the window table and the Wrapper already on the chain can be reused | Deployments |

### 9.2 What changes at 0.7.0

Relative to 0.6.0. Decision records: [ADR-0013](../../../adr/0013-mintable.md) and [A1-0007](../../../adr/a1-0007-exit-kind-binding.md). No circuit changes, so the proving keys, the verifier contracts and the window table stay the same. Implemented in the contracts and tested locally on 2026-10-15 (79 tests pass); the dApp and the deployments are not done.

| # | Change | Affects |
| --- | --- | --- |
| 1 | Role issuance is renamed Mintable: `ICasataMintable`, `A1Mintable`, code id `mintable`. The interface id stays `0x40c10f19` | Contracts, dApp, docs |
| 2 | The initial issuance moves into the core: the constructor takes `initialTo`, `initialAmount` and `initialPayload`; zero only with Mintable, otherwise `NoSupply()` (§3) | Contracts, deploy scripts, dApp deploy forms |
| 3 | The `0x81` burn moves into the core and is available on every composition. Mintable adds only `mint` | Contracts, dApp |
| 4 | The exits to a non-zero recipient bind `r` instead of `to` (§2, A1-0007): `0x04` with `kind = 1`, `wrapperBurn` with `kind = 2`. The burn keeps 0 | Contracts, dApp, scripts (proving an unshield or a wrap) |
| 5 | All eight subsets are tokens. The public ledger together with the Wrapper port is allowed | Contracts, tests, dApp module simulator |
| 6 | The deployable contracts follow M10 | Contracts, deploy scripts |
| 7 | The Wrapper port accepts the family gateway ([14](../../../14-gateway.md)) as its runtime module. The port itself is unchanged | Docs, dApp |
| 8 | `casata()` = `A:1:0.7.0`. The declared list is public ledger, Mintable, Wrapper port | Contracts, dApp, 07 §13.1 |
| 9 | New testnet tokens. The verifiers, the window table and the Wrapper on chain can be reused. The 0.6.0 tokens stay | Deployments |
| 10 | Roles are enumerable: `AccessControlEnumerable` replaces `AccessControl` (M12) | Contracts, dApp |

## 10. Review and tests

- The two shipped compositions were reviewed as standalone contracts ([02-security-review](02-security-review.md), [privacy-only review](../variant-1-privacy-only/03-security-review.md)). After the restructuring, the review is repeated against the diff, with attention to the hooks of §3 and to the cap being checked against `issuedSupply()` on every mint path.
- 0.7.0 adds to the review: the initial issuance (once, cap, the escrow hook with the public ledger, `NoSupply()`), the burn in the core on every composition, the assembly of `r` in each exit, the composition with both the public ledger and the Wrapper port, and the script that generates the compositions (M10).
- Tests run per module and per shipped composition. Supply conservation (the table of §3) is asserted after every operation.
- Bytecode at 0.5.0: `A1LedgerToken` 18,339 bytes, `A1PrivateToken` 17,345 bytes; the limit is 24,576. The standalone contracts were 17,060 and 17,195. At 0.6.0: 13,808 and 14,293; the difference is the removed fallback path. At 0.7.0, the eight compositions: `A1Token` 12,305, `A1TokenM` 13,122, `A1TokenL` 14,237, `A1TokenW` 14,593, `A1LedgerToken` 14,683, `A1PrivateToken` 15,195, `A1TokenLW` 16,205, `A1TokenLMW` 16,765. The two shipped compositions grew by about 900 bytes, for the enumerable roles and the initial issuance.
- Gas, measured locally against the standalone contracts with the same tests: every operation is within 300 gas. New: `0x81` burn with the public ledger, 528k on an account's first spend.

## 11. Decisions

M1 to M4 were adopted as drafted on 2026-10-13 and are implemented in 0.5.0. M5 to M7 belong to 0.6.0. M8 to M12 belong to 0.7.0: M8, M9 and M11 follow the owner's choices of 2026-10-15 as recorded in ADR-0013 and A1-0007, and M12 was chosen the same day; M10 was decided the same day.

| # | Decision | Adopted | Alternative not taken |
| --- | --- | --- | --- |
| M1 | Name of the confidential mint | 0.5.0: `mintConfidential(id, amount)` in every composition; `mint(to, amount)` is always public. **Superseded in 0.6.0 by M5** | Keep `mint` and let its meaning depend on the composition, as before 0.5.0 |
| M2 | `mintConfidential` and `0x81` in the composition with the public ledger | Available | Leave them out to keep that contract exactly as deployed |
| M3 | Contract names | The proposal of §6 | Keep `ConfidentialERC20A1` for the composition with the public ledger |
| M4 | Interface of the public-ledger module | `shieldedSupply()` | A marker id not tied to a function |
| M5 | Issuance in 0.6.0 | One `mint(to, amount)`; the payload decides what `to` means, as for a transfer (ADR-0010, item 10) | Keep `mintConfidential` beside a public `mint` (M1) |
| M6 | Payload type of a mint to an id | A new A.1-private type, `0x82`, with no body | Reuse `0x03`. Not taken: the family registers `0x03` for the public-ledger module only, and the privacy-only token issues without that module |
| M7 | Signature of the fold | `fold(address id, bytes payload)`, no handle; `Folded(id, nonce)` | Keep a handle argument and keep it in the event. Not taken: the handle exists to fill an amount slot, and `fold` has none; `id` and `nonce` already identify a fold |
| M8 | Initial issuance | In the constructor, by the rule of `mint`: `initialTo`, `initialAmount`, `initialPayload`; zero only with Mintable (ADR-0013, item 2) | A one-time call after deployment. Not taken: A.1 credits without a proof, so the constructor can do it, and a call left open after deployment is one more thing to close |
| M9 | Where the `0x81` burn lives | The core (ADR-0013, item 3) | Keep it in Mintable. Rejected by the owner: a token issued once may need to burn too |
| M10 | Deployable contracts in 0.7.0 | One contract per subset, eight in all (owner, 2026-10-15). A script generates them from the parts; each is one line of inheritance, none is written by hand. The review covers the modules and the places where they meet (§3's escrow hook, the exits of A1-0007), not each composition. Every subset is compiled and smoke-tested; the modules and each pair that meets are tested in depth. A composition is deployed when someone issues one | Two contracts with every module compiled in and a constructor flag that switches each off for good. Not taken: the switched-off code stays reachable on chain and each flag needs its own review, and one bytecode with every module runs into the 24,576-byte limit as modules are added. The number of subsets doubles with each compile-time module either way; what keeps it small is that each version declares a closed list and that large features go behind an existing port (ADR-0008, items 3 and 4) |
| M11 | Telling the exits apart | Bind `r = keccak(…, kind, to)` truncated to 160 bits instead of `to` (A1-0007) | A kind input in the circuit, which is a new Variant; or keep the composition with both exits out |
| M12 | Listing role holders | OpenZeppelin `AccessControlEnumerable` in the core (owner, 2026-10-15), so that a front end can confirm by views who holds `MINTER_ROLE` and `DEFAULT_ADMIN_ROLE`, which the gateway composition needs ([14](../../../14-gateway.md) §4) | Plain `AccessControl`, with a scan of the role events. Smaller, and no extra gas on a role change |
