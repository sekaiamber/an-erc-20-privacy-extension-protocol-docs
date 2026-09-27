English | [中文](08-roadmap.zh-cn.md)

# 08 Roadmap

Status: `Draft`

## Phase 0: Repository bootstrap (done, 2026-09)

- [x] Main repository and documentation skeleton
- [x] Contract repository (submodule) with a Hardhat 3 development environment
- [x] Standard ERC-20 token `Test` as the basis for later experiments

## Phase 1: Research

- [ ] Complete the research to-dos listed in [03 Landscape](03-landscape.md)
- [ ] Produce one `research/` note per scheme
- [ ] Measure mainnet gas costs of the mainstream schemes
- [ ] Produce a comparison table and update the landscape

## Phase 2: Design (in progress, 2026-09)

- [x] Organize the protocol family by Track / Variant → ADR-0002
- [x] Detailed design of mainline A.1 → `tracks/track-a/variant-1/01-design.md`
- [x] A.1 core decisions → ADR A1-0001 ~ A1-0005
- [x] Rewrite 01–05 in family terms; replace 06 / 07 with [Family architecture](06-family-architecture.md) and [Family conventions](07-family-conventions.md)
- [x] First round of A.1 security self-review → `tracks/track-a/variant-1/02-security-review.md`
- [x] A.1 0.3.0: `0x80` pure fold + `lastReceivedAtBlock` → ADR A1-0006
- [x] Track B / B.1 design and prototype (2026-09-27, 0.1.0, BSC testnet) → `tracks/track-b/variant-1/`
- [x] Family-level Wrapper design and prototype (2026-09-27) → `10-wrapper.md`, ADR-0005, `contracts/family/`
- [ ] Threat model review
- [ ] `Review` versions of the family conventions and the A.1 design

## Phase 3: Prototype (in progress, 2026-09)

- [x] A.1: BabyJubjub library, `0x01` / `0x04` circuits, `ConfidentialERC20A1`, Groth16 verifier contracts
- [x] TS client library (keys, encryption, memo, payload, proof inputs)
- [x] Hardhat end-to-end: shield → confidential transfer (submitted by a relayer) → unshield, including regulator decryption and negative cases
- [x] Gas measurements and two rounds of optimization (fixed-base window tables, public input packing) → design document §9
- [x] Steady-state gas optimization: pending is not zeroed (`0x01` steady state 467k)
- [ ] Projective coordinates for point addition
- [ ] In-browser proof generation time

## Phase 4: Evaluation and iteration

- [ ] Evaluate achievement against the design goals item by item
- [ ] Security self-review
- [x] Testnet deployment: BSC testnet, 2026-09-25 → `tracks/track-a/variant-1/03-deployments.md`
