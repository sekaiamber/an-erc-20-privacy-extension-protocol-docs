English | [中文](a1-0001-account-is-public-key.zh-cn.md)

# A1-0001 Confidential account = public key; public key never goes on-chain

- Status: Accepted
- Date: 2026-09-24
- Scope: A.1

## Context

Encrypting to a recipient requires their public key; an Ethereum address cannot be used to derive a public key, and the wallet's secp256k1 key is non-native arithmetic inside the circuit. The initial design solved key discovery with an `address -> pk` registry, but it brought problems such as account-opening signature credentials, griefing in the stealth scenario, and the spender needing `msg.sender` to hold gas, and it left the set of public keys on-chain.

## Decision

1. A confidential account is a Baby Jubjub key, referred to on-chain by `id = address(uint160(Poseidon(pk)))`.
2. **The public key never goes on-chain**. The payer obtains `pk_recv` off-chain as a private circuit input, and the circuit proves `Poseidon(pk_recv) -> to`; likewise, the paying account proves `Poseidon(pk_sender) -> from`.
3. No registry, no account-opening action. The first transfer sent to an `id` creates the storage slot.
4. The private key is derived from the hash of a wallet EIP-712 signature; the same wallet can derive multiple accounts using different indexes.
5. The association between an `id` and a wallet address appears only as the public side of a public <-> confidential transfer.

## Alternatives

- `address -> pk` registry + self-signed credential: requires `ecrecover` / ERC-1271, a two-level registry to prevent griefing, and exposes the set of public keys on-chain.
- Use the wallet's secp256k1 public key directly: non-native arithmetic inside the circuit, tens of millions of constraints per transfer, infeasible.

## Consequences

- Positive: the contract has no key logic and no attack surface; a third party can "open an account" with a single transfer; stealth only requires the payer to derive a new `pk`.
- Negative: confidential transfers can only be sent to accounts whose `pk` was obtained off-chain; it is impossible to transfer to an "id only ever seen on-chain" (regarded as a plus for privacy). `id` is a stable pseudonym, so payer and payee can be linked.
