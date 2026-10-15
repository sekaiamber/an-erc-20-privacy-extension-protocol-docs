English | [中文](07-family-conventions.zh-cn.md)

# 07 Family conventions

Status: `Draft`  Applies to: all Tracks / Variants

This document is the **normative** family-level convention. Track and Variant documents may only narrow or supplement it; they must not conflict with it.

> 2026-10-13: §1, §3 to §7, §13 and §14 follow [ADR-0010](adr/0010-erc20-surface-tradeoffs.md), and the names follow [ADR-0011](adr/0011-project-name-casata.md). A.1 implements this text from 0.6.0 and B.1 from 0.2.0. Tokens of earlier versions follow the text before it: they answer `pep()` instead of `casata()`, issue with `mintConfidential`, and A.1 still has `prepare` / `cancel`.

> 2026-10-15: §3, §5, §7, §13 and §14 follow [ADR-0013](adr/0013-mintable.md) (accepted 2026-10-15): role issuance is renamed Mintable, and the initial supply and the holder's burn belong to the core. A.1 is to implement this from 0.7.0 and B.1 from 0.3.0. Earlier versions follow the text before it, where the module is called role issuance and carries the burn.

## 1. Entry point: the transfer verb + trailing payload

Decision records: [ADR-0003](adr/0003-erc20-surface-conventions.md), amended by [ADR-0010](adr/0010-erc20-surface-tradeoffs.md).

- Every operation that moves value goes through `transfer(address,uint256)` or `transferFrom(address,address,uint256)`. Transfers get no new selector.
- A payload carries what the standard arguments cannot. Where the signature is fixed by someone else, the payload immediately follows the ABI-encoded arguments: `transfer` reads from `msg.data[68:]`, `transferFrom` from `msg.data[100:]`, and `mint` (§13.1) from `msg.data[68:]`. A function that a Variant defines for itself takes `bytes payload` as an ordinary argument.
- A call without a payload behaves exactly as the standard function does: it is an ordinary public-ledger operation. A token without the public-ledger module (§13) has nothing public to move: a payload-less `transfer`, `transferFrom` or `mint` reverts `NoPublicLedger()`.
- An operation that moves no value does not use the transfer verb. It is a function of the Variant (A.1: `fold`).
- Compatibility with ERC-20 is decided item by item, by three questions: is what the token says true, is it cheap, and does anyone use it or does it make the design easier to explain (ADR-0010, item 1).

## 2. Payload header

```
byte 0   type
byte 1   flags
byte 2.. segments determined by type
```

**type registry** (unified at the family level; Variants must not repurpose it):

| type | Name | Semantics |
| --- | --- | --- |
| `0x01` | Confidential transfer | confidential → confidential |
| `0x02` | Stealth confidential transfer | confidential → one-time confidential id |
| `0x03` | Public → confidential | Public-ledger module only (§13) |
| `0x04` | Confidential → public | Public-ledger module only (§13) |
| `0x05`–`0x7F` | Reserved | future family-level types |
| `0x80`–`0xFF` | Variant-private | defined by each Variant, must be registered in its specification |

**flags**: bit 0 = `includePending`, bit 1 = carries a `decryptable` segment; the remaining bits are reserved and must be 0, otherwise revert.

## 3. Interpretation of `to` / `from`

`to` and `from` are 20-byte values whose **meaning is determined entirely by the payload type**: with no payload or with `0x03`, `from` is a public account; with `0x01` / `0x02` / `0x04`, `from` is a confidential id; with `0x01` / `0x03`, `to` is a confidential id. The protocol does not decide whether a value "is a wallet or an id" and provides no fallback; the consequences of sending the wrong type are borne by the sender (ADR-0003, item 4).

In Track B (notes) there are no ids. With a note-transfer payload, `from` and `to` MUST be the token's own address; for a burn, `to` is the zero address. See the [Track B document](tracks/track-b/README.md).

For `mint`, `to` is a public account when there is no payload. With a payload it is what the Variant's issuance type says: a confidential id in A.1, the token's own address in B.1. The initial issuance at deployment (§14) names its recipient by the same rule.

## 4. Handles

For confidential transfers (`0x01` / `0x02`) the `amount` slot carries a handle:

```
handle = keccak256(payload) | (1 << 255)
```

The top bit is set to 1 so indexers can distinguish handles from public amounts; public amounts are bounded by each Variant's supply cap, far below 2²⁵⁵.

Explorers and wallets show a handle as a very large amount. A client states this before it asks a wallet to sign a call that carries a handle: the number the wallet shows is a handle, not an amount.

## 5. Authorization

- `transfer`: payer = the public account of `msg.sender`.
- `transferFrom`: when `from` is a public account, standard allowance applies; when `from` is a confidential id, authorization is defined by the Variant (A.1: zero-knowledge proof) and `msg.sender` is not checked.
- `approve` / `allowance`: standard on a token with the public-ledger module. On a token without it, `approve` reverts `NoPublicLedger()` and `allowance` returns 0: there is nothing an allowance could authorise, and returning true would be a false answer.
- `mint`: the minter role of the Mintable module (§13.1).
- Burn: the holder, under the Variant's own authorization; no role (§14).

## 6. Fallback path (withdrawn)

This section described `prepare` / `cancel`: registering a confidential operation so that a bare `transferFrom` could execute it later. [ADR-0010](adr/0010-erc20-surface-tradeoffs.md) withdrew it. No Variant has to implement it; A.1 removes it in 0.6.0 and B.1 never had it. The section number is kept so that references to later sections stay valid.

## 7. Events

- Every operation that moves value emits the standard `Transfer(from, to, x)`; `x` is a handle or a public amount. With the public-ledger module, `0x03` / `0x04` are triggered by the public-ledger custody transfer and emit `Transfer(from, this, x)` / `Transfer(this, to, x)`.
- Issuance, the initial issuance at deployment included, emits `Transfer` from the zero address, and a burn emits `Transfer` to the zero address.
- An operation that moves no value emits no `Transfer`; it has an event of its own (A.1: `Folded`).
- `0x03` / `0x04` additionally emit `LedgerCrossing(from, to, type, amount)`.
- Confidential transfers additionally emit a Variant-defined dedicated event (A.1: `ConfidentialTransfer`) for recipient scanning and regulator decryption.
- Track B: a note transfer emits `Transfer(token, token, handle)`, value entering emits `Transfer(0x0, token, amount)` and value leaving emits `Transfer(token, 0x0, amount)`, where `token` is the token's own address. The dedicated event has no indexed field that identifies a user.

## 8. Key derivation

User keys in every Variant are derived from a wallet signature, implemented once on the wallet side and shared by all:

```
domain  = { name: "Casata", version: "1", chainId, verifyingContract }
message = { purpose: "<variant> key", index }
secret  = keccak256(sign_EIP712(domain, message)) mod <the Variant's scalar field order>
```

The same wallet derives multiple accounts with different `index` values. Whether the derived public key goes on-chain is decided by the Variant (A.1: not on-chain). Tokens of versions before the rename (ADR-0011) use the domain name `"PEP"`, so their keys differ from the ones derived here.

## 9. Regulator interface

Principles are in ADR-0004. Minimal contract interface:

```solidity
function regulatorKey(uint32 keyId) external view returns (...);   // historical keys remain queryable forever
function activeRegulatorKeyId() external view returns (uint32);
function rotateRegulatorKey(...) external;                          // REGULATOR_ADMIN role
event RegulatorKeyRotated(uint32 indexed keyId, ...);
```

Every operation that must be regulator-readable records the `keyId` used. The regulator can rebuild the balance of any account at any point in time from on-chain data and its own private key alone, without anyone's cooperation; there are no freeze, seizure or forced-transfer interfaces. `pk_reg` may be a single key or the threshold group key of a [Regulatory Committee](11-regulatory-committee.md); the token interface is the same.

## 10. Family descriptor and ERC-165

```solidity
interface ICasata {
    /// ASCII "<track>:<variant>:<version>", e.g. "A:1:0.6.0", right-padded with zero bytes
    function casata() external pure returns (bytes32);
}
```

- The contract declares `type(ICasata).interfaceId` (`0x75118339`) via ERC-165. Modules add their own interface ids (§13).
- For any address, the frontend first calls `supportsInterface`, then reads `casata()` to parse track / variant / version and routes to the corresponding page. Which features the page offers follows from the modules (§13).
- Before [ADR-0011](adr/0011-project-name-casata.md) the interface was `IPEP` with `pep()` (`0xace237f5`). Tokens of A.1 up to 0.5.0 and of B.1 0.1.0 answer that and not `casata()`.
- The descriptor is **self-declared**: the family is permissive, there is no on-chain registry, and no check that contract behavior matches the declaration (just like ERC-20). The consequences of a wrong descriptor are borne by the publisher.
- `version` follows the version of that Variant's design document; changing a circuit, an interface or the list of supported modules (§13.2) bumps the version.

## 11. Numeric constraints

Each Variant sets its own amount bit width, balance bit width and supply cap, states them explicitly in its specification, and guarantees that every account balance lies within the range covered by its proof system (A.1 from 0.8.0 and B.1 from 0.4.0: every amount `< 2¹²⁸`, `totalSupply ≤ 2¹²⁸ − 1`).

A token's `decimals` is chosen when it is deployed, from 0 to 18, and `decimals()` returns it. No circuit depends on it: it only says where the point is shown ([ADR-0014](adr/0014-eighteen-decimals.md)). A.1 up to 0.7.0 and B.1 up to 0.3.0 fix 6 decimals and narrower widths ([A1-0005](adr/a1-0005-numeric-parameters.md)).

## 12. Privacy goal evaluation table

Each Variant self-assesses against P1–P5 and S1–S5 from [04 Design goals](04-design-goals.md), in this format:

| Goal | Achieved | Notes |
| --- | --- | --- |
| P1 Amount hiding | full / partial / no | |
| P2 Recipient | hidden / pseudonymous / public | |
| P3 Sender | hidden / pseudonymous / public | |
| P4 Transaction linkability | … | |
| P5 Ledger-crossing linkability | … | |
| S1–S5 | satisfied / not satisfied | |

## 13. Modules

Decision record: [ADR-0008](adr/0008-modules.md). A module is a contract-level option that reuses a Variant's circuits unchanged. This section is the family registry; each Variant implements the modules it supports and says which ones it does not.

### 13.1 Registry

| Module | Kind | Interface | Adds | Limit enforced by the token |
| --- | --- | --- | --- | --- |
| Public ledger | Compile-time | `ICasataPublicLedger` | Standard ERC-20 balances at the token's address; payload types `0x03` / `0x04`; `shieldedSupply()`; `LedgerCrossing` | None |
| Mintable | Compile-time | `ICasataMintable` | Issuance after deployment: `mint(address to, uint256 amount)` for a minter role, with the payload rule of §1. Without a payload it is a public issuance to `to`. With a payload it issues a public amount into the confidential side, and the Variant's issuance type says what `to` means (A.1: [04-modules §4.2](tracks/track-a/variant-1/04-modules.md); B.1: [01-design §5](tracks/track-b/variant-1/01-design.md)). Named role issuance up to A.1 0.6.0 and B.1 0.2.0, where it also carried the holder's burn (ADR-0013) | The Variant's supply cap |
| Wrapper port | Port and runtime module | `ICasataWrappable` | `wrapperMint`, `wrapperBurn`, `wrapper()`; used by the family Wrapper ([10](10-wrapper.md)) or the family gateway ([14](14-gateway.md)) | Credits never exceed what left through the port (`wrappedOut`) |

Custody issuance, a reserved name until 2026-10-15, is withdrawn (ADR-0013, item 5). A privacy version of an existing ERC-20 is a token with Mintable and the Wrapper port whose minter and wrapper is the family gateway ([14](14-gateway.md)).

The registry is append-only. Registering a new module changes nothing for existing Variant versions. A module may make sense in one Track only; it is registered here all the same, and only the Variants of that Track declare it.

**Declared support.** Every version of every Variant declares which modules it supports (§13.2):

| Variant version | Public ledger | Mintable (role issuance before 0.7.0 / 0.3.0) | Wrapper port |
| --- | --- | --- | --- |
| A.1 0.5.0 | Yes | Yes | Yes |
| A.1 0.6.0 | Yes | Yes | Yes |
| A.1 0.7.0 (draft) | Yes | Yes | Yes |
| B.1 0.1.0 | No | Yes | Yes |
| B.1 0.2.0 | No | Yes | Yes |
| B.1 0.3.0 (draft) | No | Yes | Yes |

The interfaces are in `contracts/contracts/family/`.

### 13.2 Rules

- **Kinds.** A compile-time module is inherited into the token contract. A runtime module is an external contract plugged into a port; the port is a small compile-time module.
- **Order.** Compile-time modules are inherited in a fixed order: core, public ledger, issuance, ports.
- **Supply.** Every token issues its initial supply at deployment (§14). Mintable is the only module that issues afterwards; a port returns at most what left through it. Up to A.1 0.6.0 and B.1 0.2.0 the rule was that a composition has at least one source of supply, which only role issuance was (ADR-0013).
- **Ports only.** A runtime module is reached with an ordinary call and never runs in the token's storage.
- **No installing.** A runtime module is fixed at deployment or set once.
- **Limits.** Every port carries a limit that the token enforces; the token does not rely on the module's own checks.
- **No general hooks.** The token does not call out before or after a transfer.
- **No circuit change.** Whatever needs a different circuit is a Variant. So is whatever replaces a contract the circuits depend on: a verifier, the on-chain hash, a lookup table.
- **Declaration per version.** Each version of a Variant declares the list of modules it supports, in its design document and in the table of §13.1. The list is closed: a token of that version may use any subset of it and nothing else. When a module is registered later, an existing version does not support it. Supporting it takes a new version of the Variant, which bumps at least the minor number.

### 13.3 Probe

```solidity
interface ICasataModules {
    struct Module { bytes4 id; address impl; }
    /// `impl == address(this)`: compiled in. Another non-zero address: the runtime module plugged into
    /// this port. Zero: the port exists and nothing is plugged in.
    function casataModules() external view returns (Module[] memory);
}
```

- `id` is the ERC-165 interface id of the module's interface; `supportsInterface(id)` returns true for it.
- The list is self-declared, like `casata()`.
- `casata()` tells which Variant version a token is, and therefore which modules it could have; `casataModules()` tells which of them it has.
- Integrators must not infer from the Track letter whether a token has public balances. They read it from the probe.
- Interface ids: `ICasataModules` `0xf71c7351`, `ICasataPublicLedger` `0x43dcbbd9`, `ICasataMintable` `0x40c10f19`, `ICasataWrappable` `0x1464bbec`. The Mintable id is the selector of `mint(address,uint256)`, since that is the interface's only function. Up to A.1 0.6.0 and B.1 0.2.0 the same id was named `ICasataRoleIssuance`.
- Earlier versions: A.1 0.5.0 and B.1 0.1.0 have the same probe under the name `pepModules()` (`IPEPModules`, `0xad5ad25b`), and their role-issuance id is `0x60b2d978` (`mintConfidential`). Tokens before A.1 0.5.0 have no probe; on those the Wrapper port is detected with `supportsInterface(0x1464bbec)`.

### 13.4 A token without the public-ledger module

Its ERC-20 surface is specified by the Variant: for A.1 in [04-modules §5](tracks/track-a/variant-1/04-modules.md), for B.1 in [01-design §5](tracks/track-b/variant-1/01-design.md). In Track A, `balanceOf` is always 0, a payload-less `transfer` reverts, `approve` reverts, `totalSupply()` is minted minus burned minus what is out through the Wrapper, and mint and burn amounts are public. A Track B token differs in `balanceOf` and in its events; see the [Track B document](tracks/track-b/README.md). The decisions behind this surface were first recorded in [00-erc20-surface](tracks/track-a/variant-1-privacy-only/00-erc20-surface.md), which describes the standalone contract of 2026-09 and is kept as a record.

## 14. Read surface and supply

- Every token keeps `name`, `symbol`, `decimals`, `totalSupply` and `balanceOf`. Their answers are true on every token. On a token without the public ledger, `balanceOf` reports the public balance, which is zero for a user.
- `totalSupply()` equals what has been issued at the token and not burned.
- **Initial supply** (ADR-0013, from A.1 0.7.0 and B.1 0.3.0). Every token issues an initial supply once, as part of its deployment, to a recipient named by the rule of `mint` (§3). How is the Variant's. It may be zero only on a token with Mintable; otherwise the deployment reverts. A token without Mintable has a fixed supply: it can only shrink by burns.
- **Burn** (same). Every token lets a holder destroy a public amount of their own balance, `transferFrom(from, 0x0, amount)` with the Variant's burn type, under the Variant's authorization and without a role. In a privacy token a transfer to an id nobody controls hides its amount, so a burn is the only reduction of the supply that others can verify.
- Recommended, not required: a token reports figures from which anyone can compute its confidential supply, by subtracting the public part from `totalSupply()`. How a Variant presents this is its own choice. A.1 with the public ledger has `shieldedSupply()`; B.1 lets the token's own address hold the confidential supply in `balanceOf`.
- Whether a token may hide its supply is not decided. No Variant does so.
