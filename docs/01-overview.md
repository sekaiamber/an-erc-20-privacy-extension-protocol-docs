English | [中文](01-overview.zh-cn.md)

# 01 Project Overview

Status: `Draft`

## Motivation

ERC-20 is the most widely used token standard in the EVM ecosystem, but its account model is fully transparent: anyone can read the balance of any address, as well as the sender, receiver and amount of every transfer. This is an obvious privacy deficiency for individual users, corporate finance, DAO treasuries, market makers and similar scenarios.

Most existing on-chain privacy solutions (mixer pools, privacy L2s, privacy chains) require users to **leave the native way of using ERC-20**: either lock the tokens into a separate pool, or migrate to another chain. This weakens composability and raises the barrier to use.

The question this project studies is:

> Can we design an **extension protocol** that gives an ERC-20 token optional privacy capabilities while keeping it compatible with the standard interface?

The answer is not a single protocol but a **protocol family**: Tracks are divided by the interface contract seen by integrators, Variants by privacy guarantees and cryptographic core; the routes coexist and evolve independently (see [06 Family Architecture](06-family-architecture.md)).

## Goals

1. **Compatibility**: existing wallets, DEXes, bridges and other infrastructure can use the token's "public mode" without modification.
2. **Optional privacy**: users can choose on their own to move assets from the public state into the private state, and complete transfers in the private state.
3. **Verifiability**: the total supply and conservation of tokens in the private state can be publicly verified, without introducing additional trust assumptions.
4. **Implementability**: deployable and usable on mainstream EVM chains at acceptable gas cost.

## Scope

- Ethereum mainnet and mainstream EVM-compatible chains (L2 rollups, sidechains).
- Fungible tokens (ERC-20). ERC-721 / ERC-1155 are out of scope for this phase.
- Protocol-level design and contract implementation, together with the necessary client-side (proof generation) research.

## Non-goals

- No research on network-layer privacy (IP addresses, node correlation).
- No research on new consensus mechanisms or new chains.
- No commitment to satisfy the compliance requirements of any specific jurisdiction, but "optional compliance" is treated as one of the design considerations (see [04 Design Goals](04-design-goals.md)).

## Deliverables

- Family-level conventions, Track definitions, and the design and specification of each Variant (`docs/` in this repository).
- Reference implementation of the mainline Variant: contracts, circuits, client library, tests (`contracts/` sub-repository).

## Current Mainline

**Track A (dual ledger) / A.1 (ElGamal encrypted accounts + Groth16)**. The prototype has been run end-to-end on a local network; see [tracks/track-a/variant-1/01-design.md](tracks/track-a/variant-1/01-design.md).
