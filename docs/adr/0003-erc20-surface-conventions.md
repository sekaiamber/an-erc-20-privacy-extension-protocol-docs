English | [中文](0003-erc20-surface-conventions.zh-cn.md)

# 0003 ERC-20 surface conventions: reuse standard selectors and trailing payload

- Status: Accepted
- Date: 2026-09-24

## Context

Confidential operations need to carry ciphertexts and proofs, while ERC-20's `transfer` / `transferFrom` have only fixed parameters. The goal is to let existing wallets and contracts reach confidential functionality without a new ABI, while keeping the protocol semantics precise and unambiguous.

## Decision

1. **No new transfer selectors**. Confidential operations reuse `transfer(address,uint256)` and `transferFrom(address,address,uint256)`.
2. **The payload is appended after the ABI parameters**: `transfer` reads from `msg.data[68:]`, `transferFrom` reads from `msg.data[100:]`. This relies on the Solidity ABI decoder ignoring extra bytes (the same property used by ERC-2771).
3. **The first byte of the payload is the type, the second byte is flags**. Type numbers are unified at the family level: `0x01` confidential -> confidential, `0x02` stealth, `0x03` public -> confidential, `0x04` confidential -> public. No payload means a public transfer.
4. **The interpretation of `to` / `from` is determined entirely by the payload type**. The protocol does not judge whether a 20-byte value is a wallet address or a confidential id; with no payload it always goes through the public ledger; the consequences of sending the wrong type are borne by the sender, and the protocol provides no fallback.
5. **The `amount` slot of a confidential transfer carries a handle**: `handle = keccak256(payload) | (1 << 255)`, with the top bit set to 1 so indexers can distinguish it.
6. **All types emit the standard `Transfer` event**; confidential details are emitted in separate dedicated events.
7. **Fallback path**: callers that cannot assemble calldata can first register with `prepare(payload)`, then execute with a bare call.

## Alternatives

- Add a `transfer(address,uint256,bytes)` overload: one more ABI surface, and native wallet UIs still cannot use it; the benefit is lower than the trailing payload.
- Give confidential ids a fixed prefix and reject public transfers to them: would mistakenly hit real wallets sharing the same prefix, and violates rule 4.

## Consequences

- Positive: integrators can initiate public transfers with zero changes; dApps and scripts can complete a confidential operation in a single transaction; one selector covers all modes.
- Negative: wallets will display the handle as a huge number; ERC-2771 forwarders' trailing append conflicts with the payload, so v0.x does not support 2771.
