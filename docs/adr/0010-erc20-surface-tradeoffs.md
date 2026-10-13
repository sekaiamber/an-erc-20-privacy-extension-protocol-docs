English | [中文](0010-erc20-surface-tradeoffs.zh-cn.md)

# 0010 ERC-20 compatibility is decided item by item; transfer stays the shared verb

- Status: Proposed (draft of 2026-10-13, second revision after the owner's review of the open points; no code or other document has been changed for it)
- Date: 2026-10-13
- Scope: Family (amends items 1, 6 and 7 of [ADR-0003](0003-erc20-surface-conventions.md); affects [07](../07-family-conventions.md) §1, §5, §6, §7 and §13.1, the fold entry point of [A1-0006](a1-0006-fold-and-received-block.md), and decision M1 of the [A.1 module specification](../tracks/track-a/variant-1/04-modules.md))

## Context

ADR-0003 set one goal: let existing wallets and contracts reach confidential functions without a new ABI. It did so by reusing `transfer` / `transferFrom` with a payload after the arguments, and by giving every token the full ERC-20 surface.

Three tokens are now deployed, and the ERC-20 surface means different things on each:

| Token | `balanceOf` | `transfer` without payload | `approve` |
| --- | --- | --- | --- |
| A.1 with the public ledger | Real balances | Real transfer | Real allowance |
| A.1 privacy-only | 0 for everyone | Reverts | Returns true, authorises nothing |
| B.1 | Only the token's own address has a balance | Reverts | Returns true, authorises nothing |

What happened to the goal:

- No wallet builds a proof or a payload. Every confidential operation so far was sent by this project's dApp or scripts.
- A contract that calls `transferFrom` without knowing the protocol receives a handle where it expects an amount.
- The fallback path for such callers (`prepare`, then a bare call) is not used by the dApp, was not built for B.1, and accounts for four findings and two denial-of-service entries in the A.1 security review (F2, F3, F4, F10, D3, D6).

What the reuse does deliver, observed on BscScan testnet on 2026-10-13 for the privacy-only A.1 token:

- A confidential transfer is shown as an ordinary BEP-20 transfer from `A` to `id(B)`, with the handle displayed as an amount of about seventy digits ([transaction](https://testnet.bscscan.com/tx/0x5578642b080f4b831e35dc7ec8f2181cd668fd4ede8f1b81e766dd2b279d2c62)).
- The token is recognised as BEP-20 with the right supply (750) and the right number of transfers (5). Holders: 0, and the holder list is empty; it is not filled with balances computed from handles.

The owner's position (2026-10-13): compatibility with ERC-20 is not to be abandoned and not to be pursued at any price. It is weighed item by item, by convenience, by what it costs to build, and by whether it makes the design attractive. Transfer in particular should stay one behaviour and one event across the family.

## Decision

1. **Three questions decide each item.**

   | Question | If the answer is no |
   | --- | --- |
   | Is what the token says true? | Do not offer it. A function that returns a false result is worse than a missing one |
   | Is it cheap? | It needs the third question |
   | Does anyone use it, or does it make the design easier to explain? | Do not build a mechanism for it |

   An item is kept when it is true and either free, or cheap with a user or a story behind it.

2. **Transfer is the one verb the family shares with ERC-20.** Every operation that moves value goes through `transfer` / `transferFrom`, with a trailing payload when a confidential side is involved, and emits the standard `Transfer` event.

   | Operation | Call | `Transfer` event |
   | --- | --- | --- |
   | Confidential to confidential | `transferFrom(from, to, handle)` + payload | `(from, to, handle)` |
   | Public to confidential (public-ledger module) | `transfer(to, amount)` + payload | `(from, token, amount)` |
   | Confidential to public (public-ledger module) | `transferFrom(from, to, amount)` + payload | `(token, to, amount)` |
   | Burn of a public amount | `transferFrom(from, 0x0, amount)` + payload | to the zero address |
   | Track B | The same calls, with the token's own address where there is no account to name | `(token, token, handle)`, or from / to the zero address |

   Issuance is a transfer from the zero address and has its own entry (item 10). The Wrapper port keeps its functions. Both emit `Transfer` from and to the zero address as they do today.

3. **The handle stays in the amount slot** (ADR-0003, item 5, unchanged). Explorers show it as a very large amount. That is accepted: it reads as "this amount is not public", and the transfer is still listed.

4. **The trailing payload stays the family's extension mechanism** (ADR-0003, item 2, unchanged), with one rule about where it is used:

   - A function whose signature is fixed by someone else takes its payload after the arguments. That covers the ERC-20 functions and the functions of the family's module interfaces, which every Track shares.
   - A function a Variant defines for itself takes `bytes payload` as an ordinary argument.
   - A call without a payload behaves exactly as the standard function does.

5. **An operation that moves no value does not use the transfer verb.** The fold of A.1 (`0x80`) is a tidying operation with no counterpart in ERC-20, and becomes a function of its own. Its signature, including whether it keeps a handle, is set in the A.1 specification.

6. **The read surface is kept everywhere**: `name`, `symbol`, `decimals`, `totalSupply`, `balanceOf`. They are true on every token. On a token without the public ledger, `balanceOf` reports the public balance, which is zero for a user.

7. **`approve` reverts on a token without the public ledger**, with `NoPublicLedger()`. `allowance` returns 0. Today `approve` returns true and authorises nothing, which is a false answer.

8. **The fallback path is withdrawn** (ADR-0003, item 7). `prepare` and `cancel` leave the family conventions. No Variant has to implement them, new Variants do not, and A.1 removes them in its next version.

9. **Clients explain the handle before a signature.** Before a wallet is asked to sign a call that carries a handle, the interface states that the wallet will show a very large number and that it is a handle, not an amount.

10. **Issuance uses `mint(address to, uint256 amount)`, by the same rule as transfer.** ERC-20 defines no mint function; it only says that creating tokens should emit `Transfer` from the zero address, which every token of the family already does. `mint(address,uint256)` is the signature existing tools know, so the family uses it and lets the payload decide what `to` means:

    | Call | Meaning |
    | --- | --- |
    | `mint(to, amount)` without payload | Public issuance to the address `to`. Reverts `NoPublicLedger()` on a token without the public ledger |
    | `mint(id, amount)` + payload | Issuance of a public amount to the confidential id (Track A) |
    | `mint(token, amount)` + payload | Issuance of a public amount into notes; the owner of the note is inside the payload (Track B) |

    This replaces `mintConfidential`. It differs from what A.1 did before decision M1: then the meaning of `mint` depended on which composition the token was; now it depends on the payload, as it does for a transfer. The interface `IPEPRoleIssuance` and its ERC-165 id change with it.

11. **Supply figures are a recommendation, not a requirement.** A token should report figures from which anyone can compute its confidential supply: `totalSupply()` equals what is issued and not burned at the token, and the public part can be subtracted from it. How a Variant presents this, including whether the token's own address holds the confidential supply in `balanceOf` as B.1 does, is the Variant's choice. Whether a token may hide its supply is not decided; no Variant does so.

What ADR-0003 still says after this ADR: items 2, 3, 4 and 5 unchanged. Item 1 holds for transfers: they get no new selector. Item 6 reads "every operation that moves value emits the standard `Transfer`".

## Alternatives

- **Leave ADR-0003 as it is.** Rejected: `approve` keeps answering falsely, and the fallback path keeps costing review effort for a caller that has not appeared.
- **Move every confidential operation to functions of its own and drop the ERC-20 selectors for them.** Proposed first and rejected by the owner: the standard event is where existing tools meet the token, the cost of sharing the transfer verb turned out small, and the explorer displays the result acceptably.
- **Issue through `transferFrom(0x0, to, amount)`**, so that mint literally uses the transfer verb. Rejected: a `transferFrom` from the zero address that a role authorises is not what any reader expects, and tools that know how to mint call `mint(address,uint256)`.
- **Keep `mintConfidential` beside a public `mint`** (decision M1 of A.1). Superseded by item 10: one function whose payload decides, as for a transfer.
- **Emit the standard `Transfer` with value 0 for confidential transfers.** Rejected: explorers and wallets treat zero-value token transfers as address poisoning and hide them by default.
- **Remove `balanceOf` from tokens without the public ledger.** Rejected: its answer is true, it costs nothing, and explorers use it to recognise a token.

## Consequences

- Positive: the family has a rule for the next compatibility question, in place of a blanket promise.
- Positive: transfer stays one behaviour and one event in every Track, and existing explorers keep listing confidential transfers.
- Positive: A.1 loses the prepared-entry state, three functions and their events, and with them a class of review findings.
- Negative: a tool that adds up `Transfer` values will count handles as amounts. BscScan does not; other indexers have not been checked.
- Negative: a wallet shows the handle as an amount at signing time. Item 9 is a mitigation in our own client and does nothing for other clients.
- Negative: on a token with the public ledger, a `mint` to a confidential id sent without its payload creates a public balance that nobody controls. This is the rule transfers already follow (ADR-0003, item 4); it now applies to the minter as well.
- Negative: ERC-2771 forwarders remain unsupported, as in ADR-0003.
- Work that follows once this is accepted, none of it started:

  | Where | Change |
  | --- | --- |
  | 07 | Reword §1 and §7; add the `approve` rule to §5; remove §6; role issuance in §13.1 |
  | Family interface | `IPEPRoleIssuance` becomes `mint(address,uint256)`; its ERC-165 id changes |
  | A.1, a new version | Fold as its own function; `approve` reverts without the public ledger; `prepare` / `cancel` removed; `mint` with the payload rule in place of `mintConfidential`; M1 in the module specification revised |
  | B.1, a new version | `approve` reverts; `mint(token, amount)` + payload in place of `mintConfidential` |
  | dApp | Fold call; mint calls; the notice of item 9 |
  | Tests, redeployment of the three tokens | |
