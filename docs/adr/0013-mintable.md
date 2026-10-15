English | [中文](0013-mintable.zh-cn.md)

# 0013 Mintable: issuance after deployment is a module; the initial supply and the burn belong to the core

- Status: Accepted (owner, 2026-10-15; to be implemented in A.1 0.7.0 and B.1 0.3.0)
- Date: 2026-10-15
- Scope: Family (amends items 5 and 6 of [ADR-0008](0008-modules.md), and [07](../07-family-conventions.md) §3, §5, §7, §13 and §14)

## Context

Up to A.1 0.6.0 and B.1 0.2.0, every token issues through the **role-issuance** module: `mint(to, amount)` for whoever holds `MINTER_ROLE`, and a burn of a public amount by the holder. Nothing else creates supply. The core only moves value that exists, the public ledger only swaps public and confidential balances, and the Wrapper port only returns what left through it. So 07 §13.2 needs a rule that "a composition has at least one source of supply", and every composition without role issuance is an empty token. The dApp's module simulator showed what that means: four of A.1's eight subsets of modules are not tokens at all.

The owner looked at what the module actually gives (2026-10-15). It is not "a role that mints"; it is **the right to issue after deployment**. A token without it would be one whose initial supply can never grow, which is what most issuing platforms offer and what holders of such tokens rely on. A token with it is what some businesses need: an issuer that keeps minting, or a contract that mints against something it holds, such as an existing ERC-20 locked in it.

Two smaller points came up with it.

- **The burn.** The module also carries the holder's burn (`0x81`). On an ordinary ERC-20 a burn is optional: ERC-20 has none, `ERC20Burnable` adds one, and most projects send tokens to a dead address instead, which token statistics exclude from the circulating supply. In a privacy token that does not work. A confidential transfer to an id nobody controls hides its amount, so nobody can exclude it. A burn with a public amount is the only way to reduce the supply that others can verify, and every token, minted once or many times, may need it.
- **Custody issuance.** 07 §13.1 reserves the name "custody issuance" for a vault that locks a plain ERC-20 and issues the privacy token, and ADR-0008 item 5 sketched it as a port with a limit of its own. With issuance as a role, the vault is simply a contract that holds the role; its way out is the exit the Wrapper port already has.

## Decision

1. **The role-issuance module is renamed Mintable.** Chinese: 可增发. Code id `mintable`, interface `ICasataMintable`. The interface has one function, `mint(address,uint256)`, so its ERC-165 id stays `0x40c10f19`, and tokens deployed under the old name are recognised as having this module. `MINTER_ROLE` keeps its name. The module adds `mint` and nothing else.

2. **The initial supply belongs to the core.** Every token fixes an initial supply and its recipient at deployment.
   - The recipient follows the rule of `mint` (07 §3): a public account on a token with the public ledger when no issuance type is given, otherwise what the Variant's issuance type says (A.1: a confidential id; B.1: a note).
   - How the Variant makes the initial issuance is its own matter, as long as it happens once and as part of the deployment. A.1 credits it in the constructor. B.1 needs a proof for a mint (B.1 01-design D6), and its document says how that proof reaches the constructor.
   - The initial supply may be zero only on a token with Mintable. A token without it and with nothing issued could never hold anything, so the deployment reverts.
   - It emits `Transfer` from the zero address and the Variant's issuance event (A.1, B.1: `Minted`), like any issuance (07 §7). The Variant names the error for an empty token (A.1: `NoSupply()`).

3. **The holder's burn belongs to the core.** Every token lets a holder destroy a public amount of their own balance under their own proof: `transferFrom(from, 0x0, amount)` with the Variant's burn type (`0x81` in A.1 and B.1). It needs no role. It reuses the exit the core already has, so it costs no circuit.

4. **The supply rule changes.** "A composition has at least one source of supply" is replaced by: every token issues its initial supply at deployment; Mintable is the only module that issues afterwards; a port returns at most what left through it. With this, every subset of a Variant's declared modules has a supply, and 07 §13.2's "any subset" holds without a second rule. Other rules of a Variant may still exclude a subset (A.1 up to 0.6.0: the public ledger together with the Wrapper port, see [A1-0007](a1-0007-exit-kind-binding.md)).

5. **Custody issuance is withdrawn as a reserved module name.** Locking an existing ERC-20 and issuing the privacy token against it is done by the family's **gateway** ([14](../14-gateway.md)), a runtime contract that a token reaches through two modules it already has:
   - Mintable: the gateway holds `MINTER_ROLE` and mints what it receives.
   - The Wrapper port: the gateway is the token's `wrapper()`. Its way out is `wrapperBurn`, whose proof binds the recipient, and it releases the locked ERC-20 to that recipient.

   The token's own limit on the gateway is only the supply cap, since what is locked lives outside the token. That the supply is backed is a property of the gateway and of the roles: the gateway must be the only holder of `MINTER_ROLE`, the admin must have renounced the right to grant it, and the initial supply must be zero. A front end checks these before it calls such a token backed (14 §4).

6. **Versions.** The core changes, so each Variant takes a new version that declares Mintable: A.1 0.7.0 and B.1 0.3.0. Earlier versions keep their declared lists, in which the same module appears under the name role issuance; their tokens are unchanged.

## Alternatives

- **Keep the name role issuance.** Rejected by the owner: it names who mints, not what the module gives, and it makes "no issuance" read as "no token".
- **A fixed-supply module** that issues once at deployment, beside role issuance. Proposed on 2026-10-15 and withdrawn the same day: an initial supply is what every token has, so it belongs to the core, and a module for it would make the absence of a module mean nothing.
- **Keep the burn in Mintable.** Rejected by the owner: a token minted once may need to burn too, and in a privacy token a burn is the only way to reduce the supply visibly.
- **A custody-issuance port with its own limit** (ADR-0008 item 5). Rejected: it would be a third port and a fourth interface for what a role and an existing port already do, and its limit could not be checked by the token anyway, because the locked asset is held elsewhere.
- **A deposit port**, the Wrapper port's reverse. Proposed on 2026-10-15 and withdrawn the same day for the same reason.

## Consequences

- Positive: every subset of a Variant's modules is a token, and the core alone is a fixed-supply privacy token. A fixed supply removes the trust a holder has to place in an issuer.
- Positive: the registry gets shorter (one reserved name fewer) and the case it reserved is covered by existing modules.
- Positive: every token can reduce its supply in a way anyone can check.
- Negative: the core changes in both Variants. Both need a new version, a review of the constructor and the burn, new testnet deployments, and changes in the dApp (module names, the simulator, the deploy forms).
- Negative: a gateway-backed token is only as sound as its roles. The token does not enforce the backing, so integrators must check the role holders (item 5).
- Negative: B.1's deployment gets heavier, because the initial issuance carries a proof.
