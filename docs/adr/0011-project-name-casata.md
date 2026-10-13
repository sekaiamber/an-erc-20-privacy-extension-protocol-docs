English | [中文](0011-project-name-casata.zh-cn.md)

# 0011 The project is named Casata; the acronym PEP is retired

- Status: Accepted (2026-10-13; not implemented yet: documents, contracts and the dApp keep the old names until the work listed under Consequences is done)
- Date: 2026-10-13
- Scope: Family (names only; no behaviour changes. Implemented together with [ADR-0010](0010-erc20-surface-tradeoffs.md))

## Context

The project started as "ERC-20 Privacy Extension Protocol", shortened to PEP. Two things have changed since.

What the project is. It is no longer one protocol. It is a research group that maintains a family of privacy token contracts, publishes them, and adds research results to the family over time. Anyone may issue a token from the family or use it as a base for their own. It is not a token launch and not a fundraising project (owner, 2026-10-13).

What the acronym collides with. "PEP" is the Python Enhancement Proposal, and in anti-money-laundering practice it is the "politically exposed person". The second collision is awkward for a project whose tokens give a regulator access by design ([ADR-0004](0004-regulatory-access-principles.md)).

The acronym is today in two function selectors that every token answers, in five interface names and one contract name in the source, and in the EIP-712 domain that keys are derived from. Once tokens are issued for real, the selectors and the domain are frozen. ADR-0010 already requires new versions of both Variants and a redeployment of the three testnet tokens, so a rename costs the least now.

## Decision

1. **The project is named Casata.** It is the Italian word for a house in the sense of a lineage: a family that lasts across generations and keeps a body of work. The picture is a Renaissance family that maintains a collection and a workshop, not a gang.

2. **The long form is Casata Segreta** ("the secret house"). It is used where a fuller name is wanted, such as a page title or an introduction. Running text and identifiers use the short form.

3. **The name refers to the project and to the family it maintains.** "The family" in the documents is the family of Casata. Track, Variant and module keep their meaning and their names. The name adds no concept.

4. **"ERC-20 Privacy Extension Protocol" is no longer the project's name**, and "PEP" is not used for anything new. The descriptive line beside the name is "a family of privacy token contracts for ERC-20" (Chinese: 隐私代币合约世家).

5. **The guide is named Cicerone.** A cicerone is a guide who walks a visitor through a collection and explains each piece. In the dApp it is the part that takes a user from "I want a privacy token" to a deployment: it explains Tracks, Variants and modules, recommends a composition, and prepares the transactions that the user's own wallet sends. It explains and recommends. It holds no keys and no funds, and it deploys nothing by itself. Cicerone is the name of a dApp feature, not a family-level concept. Today that feature is the per-Variant deploy pages; a single guide across Variants is not built.

6. **Identifiers follow the short name.**

   | Today | Becomes |
   | --- | --- |
   | `IPEP`, `pep()` | `ICasata`, `casata()` |
   | `IPEPModules`, `pepModules()` | `ICasataModules`, `casataModules()` |
   | `IPEPPublicLedger`, `IPEPRoleIssuance`, `IPEPWrappable` | `ICasataPublicLedger`, `ICasataRoleIssuance`, `ICasataWrappable` |
   | `PEPWrapper` | `CasataWrapper` |
   | `PEP_DESCRIPTOR` | `CASATA_DESCRIPTOR` |
   | EIP-712 domain name `"PEP"` | `"Casata"` |
   | dApp: `lib/pep.ts`, `PEP_ABI`, `IPEP_INTERFACE_ID` | `lib/casata.ts`, `CASATA_ABI`, `ICASATA_INTERFACE_ID` |
   | Repositories `an-erc-20-privacy-extension-protocol-docs` / `-contracts` / `-dapp` | `casata`, `casata-contracts`, `casata-dapp` |

   What does not change: the descriptor format `"<track>:<variant>:<version>"`; the names of Variant contracts (`A1Core`, `B1NoteToken` and the rest); the payload type registry; events and errors; the functions inside the module interfaces.

7. **On chain, two ERC-165 ids change because of the name.**

   | Interface | Function | Id today | Id after |
   | --- | --- | --- | --- |
   | `ICasata` | `casata()` | `0xace237f5` | `0x75118339` |
   | `ICasataModules` | `casataModules()` | `0xad5ad25b` | `0xf71c7351` |

   An ERC-165 id is computed from function selectors, not from the interface's name. The public-ledger and Wrapper-port modules keep their ids. The role-issuance id changes because of ADR-0010, not because of this ADR.

8. **The rename ships in the same Variant versions as ADR-0010.** There is one new version of A.1 and one of B.1, not two. A token of an earlier version keeps answering `pep()`. The dApp does not open such tokens.

9. **Keys derived from a wallet signature change with the domain name.** This covers holder keys in A.1 and B.1, the regulator key derived in the dApp, and committee member keys. Keys derived under `"PEP"` stay valid for the tokens they were made for; the new dApp does not derive them.

10. **The generator `H` keeps its derivation label.** `H` is derived as `hash-to-curve("PEP/A.1/H/v1")` and is a constant of the A.1 and B.1 circuits. A different label gives a different point, and with it different circuits, verifiers and tables. That is a cryptographic change, not a rename, so the label stays as the record of how an existing constant was made. The client-side label `"PEP/A.1/decryptable"` becomes `"Casata/A.1/decryptable"`; it costs nothing, because holder keys change anyway (item 9).

11. **The Wrapper deployed on BSC testnet stays in use.** Its behaviour does not depend on the name: it checks the Wrapper-port interface, whose id is unchanged. Its deployment record keeps the name it was deployed under.

12. **Earlier records are not rewritten.** ADR-0001 to ADR-0010 and the deployment records keep the names in use when they were written. The normative documents (01 to 11 and the Track and Variant documents) move to the new names when this ADR is implemented.

13. **Not decided here**: a GitHub organisation, domains, trademarks, a logo. Renaming the repositories is done by the owner on GitHub; the submodule URLs follow.

## Alternatives

- **Keep "PEP".** Rejected: both collisions stay, and the name still says "protocol" for something that is a family maintained by a group.
- **Rename the project and keep `pep()` on chain.** No interface id would change. Rejected: every token issued from now on would carry the retired acronym for good, and the cost of changing it is lowest now, while all three tokens are being redeployed anyway.
- **Neutral identifiers** such as `family()` and `IFamily`, which would survive another rename. Rejected: the dApp recognises a token by this selector, and a generic name is more likely to be declared by an unrelated contract.
- **Derive `H` again under a Casata label.** Rejected: it changes the circuits of both Variants for no gain in security, and ADR-0010 leaves the circuits untouched.
- **Other long forms**: Casata Privata, Discreta, Incognita, Cifrata. The owner chose Segreta.
- **Other names for the guide.** Consigliere: hard to spell, and a BSV indexer uses it. Steward names (Maestro di Casa, Majordomo, Fattore): a steward manages things on the owner's behalf, which suggests custody, and the tool keeps nothing. A bare "Maestro" is a well-known trading bot.
- **Earlier name rounds**: Studiolo, Arboretum, Sodalizio, Cenacolo. Tacit, Envelop and Cloister are already used by other crypto projects.

## Consequences

- Positive: the name describes what the project is, and the two collisions are gone.
- Positive: the name is fixed before anything is issued for real, in the same redeployment that ADR-0010 needs.
- Negative: "segreta" reads as "secret", which can suggest hiding from authorities. The family does the opposite ([ADR-0004](0004-regulatory-access-principles.md)), so the descriptive text beside the name has to say that regulator access is built in.
- Negative: the three testnet tokens deployed today answer `pep()` and stay that way. After the redeployment their balances are reachable only with the scripts or an earlier build of the dApp.
- Negative: the checks behind the name were quick web searches. No trademark or domain search was done, and no native Italian speaker has reviewed the phrase. The GitHub account `casata` is taken; `casata-labs` and `casata-segreta` were free on 2026-10-13.
- Work that follows, none of it started. It is done together with the work listed in ADR-0010, documents first:

  | Where | Change |
  | --- | --- |
  | Documents | Titles and introductions of the three READMEs and `docs/README`; `pep()` / `IPEP*` / `PEPWrapper` in 06, 07, 10, 11 and the Track and Variant documents; a note in the ADR index that earlier ADRs use the old names |
  | Contracts | The interfaces, functions, constant and contract of item 6; tests; export script; Ignition modules; package name |
  | dApp | `lib/pep.ts` and its callers; the five EIP-712 domains; the `decryptable` label; interface text in `i18n/`; a page for Cicerone when it is built |
  | Repositories | Renamed by the owner; `.gitmodules` and the links in the READMEs follow |
