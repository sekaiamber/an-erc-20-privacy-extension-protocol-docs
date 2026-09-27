English | [中文](0001-use-hardhat3-for-contracts.zh-cn.md)

# 0001 Use Hardhat 3 as the contract development environment

- Status: Accepted
- Date: 2026-09-22

## Context

The contract repository needs a general-purpose, easy-to-pick-up EVM development environment that supports compilation, testing, a local simulated chain, and deployment. Node.js is already present in the team environment; Foundry is not yet installed.

## Decision

Adopt the official **Hardhat 3** `mocha-ethers` template as the foundation of the contract repository:

- TypeScript integration tests (mocha + ethers v6 + chai)
- Foundry-compatible Solidity unit tests (forge-std)
- Hardhat Ignition for deployment
- OpenZeppelin Contracts v5 as the base library

## Alternatives

- **Foundry**: faster compilation and testing, pure Solidity tests; but it requires installing an additional toolchain, and the later client / proof-generation scripts will most likely be written in TypeScript, so Hardhat makes it easier to keep everything unified. Hardhat 3 already supports forge-std style Solidity tests, narrowing the gap between the two.
- **Hardhat 2**: mature ecosystem, but it has entered maintenance mode and is no longer recommended for new projects.

## Consequences

- Positive: a single repository supports both Solidity and TypeScript tests; deployment and network configuration are unified.
- Negative: Hardhat 3 is relatively new, and some third-party plugins may not yet be adapted; ESM-only imposes compatibility requirements on certain toolchains.
- If the proof-system toolchain later depends heavily on Foundry, Foundry can be introduced in parallel within the submodule without conflicting with this decision.
