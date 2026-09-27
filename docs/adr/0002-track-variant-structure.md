English | [中文](0002-track-variant-structure.zh-cn.md)

# 0002 Organize the protocol family by Track / Variant

- Status: Accepted
- Date: 2026-09-23

## Context

The trade-offs between different privacy mechanisms (ledger topology, cryptographic core, trust assumptions) cannot be ranked without experimental data. As a research project, we need an organizational scheme that lets multiple routes coexist, evolve independently, and never block one another.

## Decision

1. **Track**: divided by the interface contract and ledger topology as seen by integrators (wallets, DEXes, explorers). Track A is dual ledger; Track B is purely confidential.
2. **Variant**: a concrete mechanism implementation under a Track, numbered `A.1`, `A.2`, ..., each with its own independent version number `a.b.c`.
3. **Variants are self-contained**: code and documentation are written separately for each; no shared modules are extracted for reuse; similarities are simply cross-referenced in the documentation.
4. **The family level keeps documentation only**: ERC-20 surface conventions, threat model and privacy goals, regulatory access principles.
5. **Discipline**: only the mainline Variant has an implementation; other Tracks / Variants are allowed only a one-page design sketch until the mainline runs end to end and produces gas data.

Current mainline: A.1.

## Alternatives

- Divide Tracks by cryptographic core, then distinguish ledger topology by Profile: rejected, because integrators care about the interface, not the core.
- Extract a Core module shared across Tracks: rejected, because premature abstraction during the research phase would make every detail change ripple through multiple abstraction layers that differ only slightly.

## Consequences

- Positive: no dependencies between routes; any single route can be added, deprecated, or upgraded at any time without affecting the others.
- Negative: pushing multiple routes forward simultaneously would dilute effort; this is held in check by discipline rule 5.
