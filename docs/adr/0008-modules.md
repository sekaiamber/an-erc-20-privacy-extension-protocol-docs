English | [中文](0008-modules.zh-cn.md)

# 0008 Track, Variant and module: the public ledger is a module, not a Track

- Status: Accepted (structure decided; the contracts are not restructured yet, see Transition)
- Date: 2026-10-12
- Scope: Family (amends items 1–4 of [ADR-0002](0002-track-variant-structure.md), items 2 and 3 of [ADR-0007](0007-track-definition.md) and the wording of [ADR-0005](0005-family-wrapper.md))

## Context

Tracks A and B were split by one question: does the token have a public ledger. Three things showed that this is the wrong place to cut.

- **The split fails the first test of ADR-0007.** B.1 has no circuits of its own. Its contract imports A.1's verifier interfaces and curve library and runs on the same three circuits (transfer, unshield, fold). What separates the two contracts can be delivered inside one Track without touching a circuit.
- **The public ledger and the Wrapper port stand on the same pair of primitives.** One credits a public amount to a confidential account, with no proof (the degenerate ciphertext `(amount·G, 0)`). The other debits a public amount under an unshield proof that binds the amount and the public recipient. `0x03` / `0x04` in A.1 and `wrapperMint` / `wrapperBurn` in B.1 are two users of that pair.
- **The same option appears inside every route.** When the note model was walked through, "with or without a public ledger" came up as a choice inside it. An option that exists in every Track cannot be what separates Tracks.

Putting the option into the numbering does not work either. As a Variant number it drifts: the public-ledger form would be A.2 in one Track and B.3 in another. As a suffix it multiplies with every new property that all Tracks share.

## Decision

1. **Three layers.**

   | Layer | What it is | What changing it costs |
   | --- | --- | --- |
   | **Track** | The state model and the trust base | Every family tool is adapted; a family ADR under ADR-0007 |
   | **Variant** | One set of circuits: the cryptographic core and what it hides | New verifiers, a new trusted setup, a new security review |
   | **Module** | A contract-level option that reuses the Variant's circuits unchanged | A contract change only |

   A feature (ADR-0007) remains what needs no contract change.

2. **The base of every Variant is a privacy-only ledger; the public ledger is a module.**

   - Track A is redefined as **encrypted accounts**: one homomorphic-ciphertext balance per account, keys held by users, proofs made on the client, no external network.
   - The former Track B is withdrawn. The two shipped contracts are two compositions of the same Variant, A.1.
   - The letter B is released. Item 4 of ADR-0007 applies to it again.

3. **Two kinds of module.**

   | Kind | How it joins the token | Use it when |
   | --- | --- | --- |
   | **Compile-time module** | Inherited into the token contract; the bytecode changes | It reads or writes confidential state, changes how an existing function behaves, or is a small check on every operation |
   | **Runtime module** | An external contract plugged into a **port**; the port itself is a small compile-time module | It has its own state, is large, needs nothing but the port, or can be written once for the whole family |

   Anything that needs a circuit change is a Variant, not a module. The regulator ciphertext is enforced inside the transfer circuit, so "with or without a regulator" is not a module. Who holds the regulator key (one party or a committee) is a deployment parameter.

4. **Rules for runtime modules.**

   - **Ports only.** A runtime module is reached with an ordinary call and never runs in the token's storage.
   - **Fixed at deployment, or set once.** There is no installing or removing afterwards. A module added later could mint through its port, which would be an upgrade path.
   - **The token does not trust the module.** Every port carries a limit that the token enforces. B.1's `wrappedOut` is the first such limit: the Wrapper can credit back only what left through it.
   - **No general hooks.** The token does not call out before or after a transfer. Amounts are ciphertexts, so a hook would see only ids, and a hook that can make a transfer fail is a freeze power, which [07 §9](../07-family-conventions.md) excludes.

5. **Module registry.** Modules are registered in [07 §13](../07-family-conventions.md), once for the family. The implementation is written per Variant. A Variant states which modules it supports; an unsupported module is simply not implemented and the probe does not report it.

   | Module | Kind | Adds | Today |
   | --- | --- | --- | --- |
   | Public ledger | Compile-time | Standard ERC-20 balances at the token's address; `0x03` shield and `0x04` unshield; `shieldedSupply()` | In `ConfidentialERC20A1` |
   | Role issuance | Compile-time | `mint` by `MINTER_ROLE` with a public amount: into the public ledger when it is present, otherwise into a confidential account, with the `0x81` burn | In both contracts |
   | Wrapper port | Port and runtime module | `IPEPWrappable`, used by the family `PEPWrapper`; limit: `wrappedOut` | In `ConfidentialERC20B1` |
   | Custody issuance | Port and runtime module | A vault that locks a plain ERC-20 and issues the privacy token | Not designed; on hold |

   The Wrapper and a custody vault can share the port interface, because both credit a public amount and debit one under a proof. They cannot share the limit: the Wrapper only returns what left, a vault issues against what it locked. The limit therefore belongs to the port, not to the interface.

6. **Composing compile-time modules.**

   - The inheritance order is fixed for the family: core, public ledger, issuance, ports. Two modules that override the same internal function then always combine the same way.
   - A composition has at least one source of supply.
   - The public ledger and the Wrapper port can coexist, since both use the same primitives. No use for that composition is known, so it is not built.

7. **Probe.** A token reports its modules through one view, in addition to ERC-165.

   ```solidity
   interface IPEPModules {
       struct Module { bytes4 id; address at; }
       /// `at == address(this)`: compiled in. Another non-zero address: the runtime module plugged into
       /// this port. Zero: the port exists and nothing is plugged in.
       function pepModules() external view returns (Module[] memory);
   }
   ```

   `id` is the ERC-165 interface id of the module's interface, and `supportsInterface(id)` is true for it. Like `pep()`, the list is self-declared. Front ends pick the page from `pep()` and switch features on from the modules. This interface is a draft until the contracts are restructured.

8. **Numbers and versions.**

   - A Variant number is the order of opening inside its Track. Numbers do not correspond across Tracks.
   - A composition has no number and no suffix. It is described by its modules.
   - The `pep()` format `"<track>:<variant>:<version>"` is unchanged. One version covers a Variant's core and its compile-time modules. A runtime module has its own version.

9. **What stays.** Variants remain independent of one another: code is shared inside a Variant and through family runtime modules, not between Variants. Item 5 of ADR-0002 stands.

10. **The first test of ADR-0007 gains a clause.** A route is substitutable if its defining property can be delivered inside an existing Track by adding a payload type, replacing a circuit, adding a client-side convention, **or adding or leaving out a module**.

## Transition

The documents describe the structure above from now on. The code does not yet.

| Today | In the new structure |
| --- | --- |
| `ConfidentialERC20A1`, `pep()` = `A:1:0.4.0` | A.1 with the public ledger and role issuance |
| `ConfidentialERC20B1`, `pep()` = `B:1:0.2.0` | A.1 privacy-only, with role issuance and the Wrapper port |

- Until the contracts are restructured, "B.1" remains the name of the second contract. Its documents stay under `docs/tracks/track-b/variant-1/`. Deployment records and security-review ids (`B1-F1` and so on) keep their names for good.
- The restructuring is a separate step that needs the owner's go-ahead: a shared core with modules in the contracts, one version, both testnet tokens redeployed with `A:1:…`, the dApp routed by modules, and the two document directories merged. The letter B is free after it.

## Alternatives

- **Keep Tracks A and B split by the public ledger.** Rejected: the split fails the first test of ADR-0007, and the same option would have to be split again inside every later Track.
- **Number each form as a Variant and compare them in a table.** Rejected: the numbers of equal forms drift apart across Tracks.
- **A suffix per shared property** (`A.1L`). Rejected: every new shared property adds a suffix to every name.
- **Runtime modules only, with one base bytecode.** Rejected: a public ledger at the token's own address would need the token to forward every ERC-20 call and emit events on the module's behalf, and every new kind of port would mean a new base for all tokens.
- **Compile-time modules only.** Rejected: large state that only needs a port (the registry of wrapped tokens) would sit in the token, and the Wrapper would be rewritten for every Variant.
- **Modules that run in the token's storage.** Rejected: one faulty module could rewrite every confidential balance.
- **Modules installable after deployment.** Rejected: see item 4.

## Consequences

- Positive: equal forms can no longer end up with different numbers; a new property shared by all Tracks is one registry row and one interface, with no renaming; the Wrapper is written once; the token contract stays small.
- Positive: the code already shared between A.1 and B.1 gets a home. It contradicted item 3 of ADR-0002 while they were separate Tracks.
- Negative: integrators must probe. Two tokens of the same Track can differ in what `balanceOf` and a payload-less `transfer` do. "Variants of a Track behave identically to integrators" narrows to "tokens of a Track share the state model and the trust base".
- Negative: compile-time modules reach storage directly, so their interactions are harder to reason about than ports. They are kept few, and a security review covers each module and each composition that is actually shipped.
- Negative: the contracts and the dApp must be restructured and both testnet tokens redeployed. The versions 0.4.0 and 0.2.0 merge into one.
- Size: the two contracts are 17,060 and 17,195 bytes against a limit of 24,576. A composition with every module has not been measured. The curve library is compiled into the token today and can become a separately deployed linked library if space runs short.
