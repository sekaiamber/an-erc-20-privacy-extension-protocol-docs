English | [中文](README.zh-cn.md)

# Track B: pure confidential

Status: `Prototype` — B.1 deployed on BSC testnet 2026-09-27 (started the same day, triggered by the question "can the shielded total be hidden?" — in Track A it cannot, see A.1 03-deployments and the threat model)

## The integrator contract

A Track B token has **no public ledger**. There is no address that "holds" tokens in the clear, so the question of how many tokens are in the confidential state does not exist: the only public number is `totalSupply`.

| ERC-20 surface | Track B behaviour |
| --- | --- |
| `totalSupply()` | Public: minted − burned. Mint and burn amounts are public by design. |
| `balanceOf(addr)` | Always `0` (decision B-1 below). Balances exist only as ciphertexts under a confidential id. |
| `transfer(to, x)` / `transferFrom(from, to, x)` **without payload** | Revert `NoPublicLedger()`. There is nothing public to move. |
| `transferFrom(id, id, handle)` + payload `0x01` | Confidential transfer, proof-as-authorization (family conventions §1–§5). |
| `transferFrom(id, id, handle)` + payload `0x80` | Fold (Variant-private type, as in A.1). |
| `transferFrom(id, 0x0, amount)` + payload `0x81` | **Burn** with a public amount: the only way tokens leave the confidential ledger. `totalSupply` decreases. |
| `mint(id, amount)` | MINTER role only; public amount credited to a confidential id's pending as the degenerate ciphertext `(amount·G, 0)`. `totalSupply` increases. |
| `approve` / `allowance` | Kept for interface completeness; they never authorise anything (no public balances). |
| `Transfer(from, to, x)` | Emitted for every operation: mint `Transfer(0x0, id, amount)`, burn `Transfer(id, 0x0, amount)`, confidential transfer `Transfer(id, id, handle)`. |

Consequences for integrators:

- Wallets show a balance of 0 for every address; the user's real balance is only visible in a wallet that speaks the Variant (the dapp).
- No DEX, lending or bridge integration is possible: nothing public to pool.
- Block explorers see a fixed supply, a set of confidential ids, and transfer *events* between them (amounts hidden). Supply-sum checks (`Σ balanceOf == totalSupply`) fail by construction; this is the price of hiding the aggregate.

## Variants

| Variant | Core | Recipient | Amount | Regulator | Status |
| --- | --- | --- | --- | --- | --- |
| [B.1](variant-1/README.md) | A.1's confidential ledger (twisted ElGamal accounts + Groth16) without the public ledger | Pseudonymous (stable id) | Hidden | Third ciphertext, cryptographically enforced | 0.1.0 (prototype) |

## Decisions taken at Track level

- **B-1 `balanceOf` returns 0**, not a handle. A handle in `balanceOf` would be displayed by every wallet as a meaningless 77-digit number and would break any tool that sums balances; 0 is honest ("nothing public here") and cheap. Variants may expose the ciphertext through their own views.
- **B-2 mint / burn amounts are public.** `totalSupply` must stay meaningful; hiding issuance would require a confidential supply proof, which is out of scope for this track.
- **B-3 no-payload calls revert** instead of silently doing nothing, so a wallet that sends a plain `transfer` learns immediately that the token is not a public ERC-20.
