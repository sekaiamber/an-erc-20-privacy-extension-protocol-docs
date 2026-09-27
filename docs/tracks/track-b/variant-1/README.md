English | [中文](README.zh-cn.md)

# B.1: A.1's confidential ledger, without the public ledger

Version: `0.1.0-draft`  Status: `Draft`

| Document | Content |
| --- | --- |
| [01-design.md](01-design.md) | Initial design: what is inherited from A.1, what is removed, the ERC-20 surface, payload types, flows, circuits, evaluation, open decisions |

## In one sentence

B.1 takes the A.1 confidential ledger verbatim (account = Baby Jubjub public key, twisted ElGamal balances, Groth16 proof-as-authorization, memos, regulator ciphertext, lazy fold and `0x80`) and deletes the public ledger: tokens are minted straight into confidential accounts with a public amount, move only as ciphertexts, and leave only by a public-amount burn. The only public aggregate is `totalSupply`.
