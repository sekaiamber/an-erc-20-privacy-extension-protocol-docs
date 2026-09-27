English | [中文](README.zh-cn.md)

# Documentation index

This directory contains all research and design documents of the "ERC-20 Privacy Extension Protocol" project. Reading in numbered order is recommended.

| No. | Document | Contents |
| --- | --- | --- |
| 01 | [Overview](01-overview.md) | Project motivation, goals, scope and non-goals |
| 02 | [Background](02-background.md) | Review of the ERC-20 standard; where privacy problems on the EVM come from |
| 03 | [Landscape](03-landscape.md) | Survey and classification of existing on-chain privacy schemes |
| 04 | [Design goals](04-design-goals.md) | Properties the protocol must satisfy and the trade-offs |
| 05 | [Threat model](05-threat-model.md) | Assumed attacker capabilities, information to protect, information out of scope |
| 06 | [Family architecture](06-family-architecture.md) | The three-layer structure of family conventions / Track / Variant and the evolution rules |
| 07 | [Family conventions](07-family-conventions.md) | Normative: selectors and payload, type registry, handles, authorization, events, key derivation, regulator interface, ERC-165 |
| 08 | [Roadmap](08-roadmap.md) | Phase plan and milestones |
| — | [Tracks](tracks/README.md) | Track / Variant directory of the protocol family; the mainline A.1 design lives here |
| 09 | [Development guide](09-development.md) | How to use the repository, submodules and the contract environment |
| 09 | Family tool: the generic Wrapper (the standard DeFi path for Track B tokens) |
| — | [Glossary](glossary.md) | Definitions of terms used in the project |
| — | [References](references.md) | Links to EIPs, papers and code repositories |
| — | [ADR](adr/README.md) | Architecture decision records |
| — | [Research notes](research/README.md) | Detailed research on individual external schemes |

## Document status markers

Each document is marked with a status at the top:

- `Draft`: draft, contents may change substantially
- `Review`: contents are largely stable, awaiting review
- `Stable`: finalized, changes must go through an ADR
