English | [中文](a1-0007-exit-kind-binding.zh-cn.md)

# A1-0007 The unshield proof binds which exit it is for, through the recipient value

- Status: Accepted (owner, 2026-10-15; to be implemented in A.1 0.7.0)
- Date: 2026-10-15
- Scope: A.1

## Context

One circuit, the unshield circuit (01-design §5.2), is behind every exit of a public amount from a confidential account: the `0x04` unshield of the public-ledger module, the `0x81` burn, and `wrapperBurn` of the Wrapper port. It binds `from`, the nonce, the token, the chain, the amount and `to` (since 0.3.1, security review F14). It does not bind which of the three exits the proof was made for.

Up to 0.6.0 this is harmless, because the exits accept disjoint values of `to`: zero for a burn, non-zero for an unshield or a wrap, and no built composition has both an unshield and a wrap. 04-modules §6 therefore left the public ledger together with the Wrapper port unbuilt.

[ADR-0013](0013-mintable.md) makes every subset of a Variant's modules a token, and the family gateway ([14](../14-gateway.md)) gives that composition a use: a privacy version of an existing ERC-20 whose holders can also hold it publicly. On such a token, a proof made for one exit could be submitted through the other. Someone who sees a holder's `0x04` payload in the mempool could pass it to the Wrapper (or the gateway) with the same `to` and amount. Nothing is stolen, since the value goes to the same recipient, but the recipient gets a different asset than the holder asked for: wrapped tokens or the locked ERC-20 instead of a public balance, or the reverse. Undoing it costs the holder fees, and a relayer could do it to anyone.

## Decision

1. **From 0.7.0 the contract binds the exit through the value it passes as `to`.** For an exit to a non-zero recipient, the public input that the circuit range-checks as `to` is no longer the address itself but

   ```
   r = uint160(uint256(keccak256(abi.encodePacked("Casata A.1 exit", kind, to))))
   ```

   with `kind` a `uint8` (one byte in the packed encoding), `1` for the `0x04` unshield and `2` for `wrapperBurn`. Contract and client must encode it the same way. The burn keeps `to = 0`, which no hash produces except with negligible probability.

2. **The contract assembles `r` itself** from the entry point that was called and its `to` argument, as it already assembles every public input (01-design §3.3, check 6). Nothing in the payload names the kind.

3. **No circuit change.** The circuit takes `to` as a 160-bit value and places no meaning on it. The proving keys, the verifier contracts and the window table stay the same.

4. **One rule for every composition of 0.7.0**, including those with only one non-zero exit. A client then proves an exit the same way on every 0.7.0 token and does not have to read the modules first.

5. **Events and calldata keep the plain address.** `to` in `LedgerCrossing`, `WrapperBurned`, `Transfer` and in the call is the recipient, as before. Only the proof's public input changes.

## Alternatives

- **Add the kind as a public input of the circuit.** Rejected: a circuit change is a new Variant (ADR-0008, item 3), and the binding needs no new constraint.
- **Bind the kind through `w1`** (`contract | chainId<<160`), by hashing the token address with the kind. Rejected: `w1` is what stops a proof from being replayed on another token, and mixing a second purpose into it makes that harder to review. `to` is already the value that names the destination.
- **Keep the conflict and leave the composition out.** Rejected by the owner (2026-10-15): with ADR-0013 it is the last subset that would not be a token, and the gateway gives it a use.

## Consequences

- Positive: all eight subsets of A.1's modules are tokens from 0.7.0 (04-modules §6).
- Positive: redirecting a proof to another exit, or to another recipient, needs a second preimage of a 160-bit truncation of keccak, about 2¹⁶⁰ work. Collisions between two values the attacker chooses do not help, since an attacker can only redirect proofs that others made.
- Negative: clients, scripts and the dApp compute `r` before proving an unshield or a wrap. A 0.6.0 proof does not verify on a 0.7.0 token and the reverse, which the version already separates.
- Negative: the security review of 0.7.0 covers the assembly of `r` in each exit.
- B.1 is not affected. It has no public ledger, and its burn and wrap are kept apart by `to = 0` (B.1 01-design §5). A B.1 version that adds the public ledger would need the same binding.
