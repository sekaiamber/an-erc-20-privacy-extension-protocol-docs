English | [中文](a1-0003-proof-as-authorization.zh-cn.md)

# A1-0003 Proof-as-authorization; `transferFrom` is the confidential payment entry point

- Status: Accepted
- Date: 2026-09-24
- Scope: A.1

## Context

A confidential account has no Ethereum address and can never be `msg.sender`. The essential authorization for spending a confidential balance is "knowing the private key", which is already included in the spend proof.

## Decision

1. When a confidential account is the payer, the entry point is `transferFrom(from, to, x)` + payload (`0x01` / `0x04`).
2. **No check whatsoever on `msg.sender`**. Authorization = proof (including knowledge of the private key and the `nonce`).
3. When `from` is a public account, `transferFrom` keeps the standard allowance semantics (including `0x03`).
4. `transfer(to, x)` is used only for payments from `msg.sender`'s public account.

## Alternatives

- Require `msg.sender` to be some bound address: confidential accounts have no address; even if they did, it would link the gas source to the account.

## Consequences

- Positive: any relayer can pay gas on behalf of the user; a confidential account never needs ETH; the stealth scenario needs no one-time Ethereum key; a DEX router can send swap results directly into the confidential ledger via allowance.
- Negative: spending on behalf of a third party who **does not hold the private key** (custodial-style allowance) is not covered by this mechanism; listed in the backlog.
