English | [中文](README.zh-cn.md)

# Track A: encrypted accounts

Status: `Draft`. Structure per [ADR-0008](../../adr/0008-modules.md): Track, Variant, optional modules.

## Definition

| | |
| --- | --- |
| **State model** | Each confidential account id owns one balance on chain, stored as a homomorphic ciphertext. A transfer names the payer's id and the payee's id and updates their ciphertexts |
| **Trust base** | Keys are held by users and proofs are made on the client. No external network holds keys or computes on ciphertexts |

What is hidden is the amount and the balance. What stays visible, in every A.x, is the pair of ids of each transfer and therefore the transfer graph between ids. A route that hides the graph has a different state model and is a different Track ([Track B](../track-b/README.md)).

## How a Track A token is put together

```
Track A        the state model and the trust base
  └─ Variant   one set of circuits: the cryptographic core (A.1)
       └─ Modules   contract-level options on unchanged circuits (public ledger, role issuance, Wrapper port)
```

The base of every Variant is a **privacy-only ledger**. Whether a token also has public balances at its own address, how it is issued, and whether it can be wrapped are modules ([07 §13](../../07-family-conventions.md)). Two tokens of this Track can therefore differ in what `balanceOf` and a payload-less `transfer` do. Integrators read the module probe; they do not infer it from the letter A.

## Integrator contract (honoured by every A.x, with any modules)

- Only the existing ERC-20 selectors `transfer(address,uint256)` and `transferFrom(address,address,uint256)` are used. The payload follows the ABI parameters: `transfer` reads from `msg.data[68:]`, `transferFrom` from `msg.data[100:]`.
- The first byte of the payload is the type, the second is the flags. Type numbers are the family's (07 §2).
- **The meaning of `to` / `from` is determined by the payload type.** The protocol does not judge whether a 20-byte value is a wallet address or a confidential id.
- A confidential account is addressed by a 20-byte id. How the id is derived is defined by the Variant.
- `0x01`, confidential to confidential: `transferFrom(id, id, handle)`. It is authorised as the Variant defines (A.1: a zero-knowledge proof); `msg.sender` is not checked.
- For confidential transfers the amount slot carries a handle whose top bit is 1. Every type emits the standard `Transfer` event; a confidential transfer also emits a Variant-defined event that names both ids and carries what the payee and the regulator need.
- Calls that cannot carry extra data can run a confidential operation registered beforehand with `prepare` (07 §6).
- The state of any account id can be read as ciphertext through a Variant-defined view.
- `pep()` and the module probe are exposed through ERC-165 (07 §10, §13).
- The regulator interface is that of 07 §9.

## What the modules change for integrators

| | Without the module | With the module |
| --- | --- | --- |
| **Public ledger** | `balanceOf` is 0 for every address. A payload-less `transfer` reverts `NoPublicLedger()`. `totalSupply()` is the confidential supply | Standard ERC-20 balances at the token's address. `0x03` and `0x04` move value between the two ledgers in one call. `totalSupply()` is public balances plus `shieldedSupply()` |
| **Role issuance** | No mint | A minter role issues by public amount; holders burn by public amount |
| **Wrapper port** | The token cannot be wrapped | The family Wrapper can issue a plain ERC-20 `wTOKEN` for it |

## Variants

| Variant | Core | Payer / recipient | Amount | Regulator | Modules declared | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [A.1](variant-1/README.md) | ElGamal on Baby Jubjub + Groth16, account = public key | Pseudonymous: ids are stable and linkable | Hidden | Third ciphertext in every transfer, enforced in the circuit | 0.5.0 declares: public ledger, role issuance, Wrapper port | Design 0.5.0-draft; two compositions deployed on BSC testnet (0.4.0 and the former B.1 0.2.0) |
