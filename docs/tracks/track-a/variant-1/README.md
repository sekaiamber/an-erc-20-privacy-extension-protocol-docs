English | [中文](README.zh-cn.md)

# A.1: ElGamal Encrypted Accounts + SNARK

Version: `0.3.0-draft`. Status: `Draft`.

| Document | Contents |
| --- | --- |
| [01-design.md](01-design.md) | Detailed design: account model, payload types, execution flow, circuits, gas, scope and open questions |
| [02-security-review.md](02-security-review.md) | Round-one security self-review: findings, fixes, trust assumptions |
| [03-deployments.md](03-deployments.md) | Deployment record (BSC testnet) |

## In One Sentence

On top of the Track A dual ledger, the confidential ledger uses an **account model**: a confidential account is a Baby Jubjub public key (only its hash id is visible on-chain; the public key itself never goes on-chain), the balance is a twisted ElGamal ciphertext, spending is authorized by a zero-knowledge proof that also guarantees conservation and non-negativity, and every confidential transfer simultaneously encrypts the amount to the regulator public key. Payers and recipients appear as stable pseudonyms; amounts and balances are hidden.
