English | [中文](07-family-conventions.zh-cn.md)

# 07 Family conventions

Status: `Draft`  Applies to: all Tracks / Variants

This document is the **normative** family-level convention. Track and Variant documents may only narrow or supplement it; they must not conflict with it.

## 1. Entry point: reuse the standard selectors + trailing payload

- No new transfer selectors are added. Confidential operations reuse `transfer(address,uint256)` and `transferFrom(address,address,uint256)`.
- The payload immediately follows the ABI-encoded arguments: `transfer` reads from `msg.data[68:]`, `transferFrom` reads from `msg.data[100:]`.
- A call without a payload is an ordinary public-ledger operation (for Track B, which has no public ledger, the behavior without a payload is defined by its Track document).

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
| `0x03` | Public → confidential | Track A only |
| `0x04` | Confidential → public | Track A only |
| `0x05`–`0x7F` | Reserved | future family-level types |
| `0x80`–`0xFF` | Variant-private | defined by each Variant, must be registered in its specification |

**flags**: bit 0 = `includePending`, bit 1 = carries a `decryptable` segment; the remaining bits are reserved and must be 0, otherwise revert.

## 3. Interpretation of `to` / `from`

`to` and `from` are 20-byte values whose **meaning is determined entirely by the payload type**: with no payload or with `0x03`, `from` is a public account; with `0x01` / `0x02` / `0x04`, `from` is a confidential id; with `0x01` / `0x03`, `to` is a confidential id. The protocol does not decide whether a value "is a wallet or an id" and provides no fallback; the consequences of sending the wrong type are borne by the sender (ADR-0003, item 4).

## 4. Handles

For confidential transfers (`0x01` / `0x02`) the `amount` slot carries a handle:

```
handle = keccak256(payload) | (1 << 255)
```

The top bit is set to 1 so indexers can distinguish handles from public amounts; public amounts are bounded by each Variant's supply cap, far below 2²⁵⁵.

## 5. Authorization

- `transfer`: payer = the public account of `msg.sender`.
- `transferFrom`: when `from` is a public account, standard allowance applies; when `from` is a confidential id, authorization is defined by the Variant (A.1: zero-knowledge proof) and `msg.sender` is not checked.

## 6. Fallback path

Callers that cannot assemble calldata may first register with `prepare(from, to, x, payload)`, after which a bare `transferFrom(from, to, x)` from any source executes it; `cancel` requires submitting the original payload. The registration is bound to the account state version at that time; once stale it fails and is not retried.

## 7. Events

- Every type emits the standard `Transfer(from, to, x)`; `x` is a handle or a public amount. In Track A, `0x03` / `0x04` are triggered by the public-ledger custody transfer and emit `Transfer(from, this, x)` / `Transfer(this, to, x)`.
- `0x03` / `0x04` additionally emit `LedgerCrossing(from, to, type, amount)`.
- Confidential transfers additionally emit a Variant-defined dedicated event (A.1: `ConfidentialTransfer`) for recipient scanning and regulator decryption.

## 8. Key derivation

User keys in every Variant are derived from a wallet signature, implemented once on the wallet side and shared by all:

```
domain  = { name: "PEP", version: "1", chainId, verifyingContract }
message = { purpose: "<variant> key", index }
secret  = keccak256(sign_EIP712(domain, message)) mod <the Variant's scalar field order>
```

The same wallet derives multiple accounts with different `index` values. Whether the derived public key goes on-chain is decided by the Variant (A.1: not on-chain).

## 9. Regulator interface

Principles are in ADR-0004. Minimal contract interface:

```solidity
function regulatorKey(uint32 keyId) external view returns (...);   // historical keys remain queryable forever
function activeRegulatorKeyId() external view returns (uint32);
function rotateRegulatorKey(...) external;                          // REGULATOR_ADMIN role
event RegulatorKeyRotated(uint32 indexed keyId, ...);
```

Every operation that must be regulator-readable records the `keyId` used. The regulator can rebuild the balance of any account at any point in time from on-chain data and its own private key alone, without anyone's cooperation; there are no freeze, seizure or forced-transfer interfaces.

## 10. Family descriptor and ERC-165

```solidity
interface IPEP {
    /// ASCII "<track>:<variant>:<version>", e.g. "A:1:0.2.4", right-padded with zero bytes
    function pep() external pure returns (bytes32);
}
```

- The contract declares `type(IPEP).interfaceId` via ERC-165; this is the only family-level interface id.
- For any address, the frontend first calls `supportsInterface`, then reads `pep()` to parse track / variant / version and routes to the corresponding page.
- The descriptor is **self-declared**: the family is permissive, there is no on-chain registry, and no check that contract behavior matches the declaration (just like ERC-20). The consequences of a wrong descriptor are borne by the publisher.
- `version` follows the version of that Variant's design document; changing a circuit or an interface bumps the version.

## 11. Numeric constraints

Each Variant sets its own amount bit width, balance bit width, decimals and supply cap, but must state them explicitly in its specification and guarantee that every account balance lies within the range covered by its proof system (A.1: `totalSupply ≤ 2⁶⁴ − 1`).

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
