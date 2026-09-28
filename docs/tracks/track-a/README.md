English | [中文](README.zh-cn.md)

# Track A: Dual-Ledger Privacy Mechanism

Status: `Draft`

## Definition

The token maintains two ledgers simultaneously:

| Ledger | Key | State | `balanceOf` | Composability |
| --- | --- | --- | --- | --- |
| Public ledger | Ethereum address | Standard ERC-20 balance, plaintext | Returns the real balance | Fully compatible with existing DeFi |
| Confidential ledger | Confidential account id (20 bytes, derivation defined by the Variant) | Balances and transfer amounts hidden | Separate interface | Within the protocol only |

Users can move funds between the two ledgers and can also transfer within each ledger. All four combinations are single calls.

## Integrator Contract (Honored by All A.x)

- The public ledger fully follows EIP-20.
- `totalSupply() == Σ public balances + shieldedSupply()`, and `shieldedSupply()` is public.
- Only the existing ERC-20 selectors `transfer(address,uint256)` and `transferFrom(address,address,uint256)` are used. Additional data (the payload) is placed after the ABI parameters: `transfer` reads from `msg.data[68:]`, `transferFrom` from `msg.data[100:]`.
- **The interpretation of `to` / `from` is determined by the payload type**; the protocol does not attempt to judge whether a 20-byte value is a wallet address or a confidential id. Without a payload, everything goes through the public ledger.
- The first byte of the payload is the type, the second byte is flags; type numbers are unified at the Track level: `0x01` confidential→confidential, `0x02` stealth, `0x03` public→confidential, `0x04` confidential→public.
- Authorization for `transferFrom`: when `from` is a public account it is the standard allowance; when `from` is a confidential id it is defined by the Variant (A.1: zero-knowledge proof), and `msg.sender` is not checked.
- For confidential transfers the `amount` slot carries a handle whose most significant bit is 1; all types emit the standard `Transfer` event.
- Calls without additional data can execute confidential operations via a prior `prepare(payload)` registration (fallback path).
- The Track A interface id and Variant id are exposed via ERC-165.

## Variants

| Variant | Core | Payer / recipient | Amount | Regulator | Status |
| --- | --- | --- | --- | --- | --- |
| [A.1](variant-1/README.md) | twisted ElGamal encrypted accounts + SNARK, account = public key | Pseudonymous (id stable and linkable) | Hidden | Third ciphertext, cryptographically enforced | 0.4.0-draft |
