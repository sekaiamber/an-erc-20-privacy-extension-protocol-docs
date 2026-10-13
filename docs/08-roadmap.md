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
- [x] Privacy-only composition of A.1, opened as "Track B / B.1": design and prototype (2026-09-27, 0.1.0, BSC testnet) → `tracks/track-a/variant-1-privacy-only/`
- [x] Family-level Wrapper design and prototype (2026-09-27) → `10-wrapper.md`, ADR-0005, `contracts/family/`
- [ ] Regulatory Committee design (2026-09-27, draft) → `11-regulatory-committee.md`, ADR-0006; requires A.1 v0.4 / B.1 v0.2 memo amendment
- [x] Family restructured into Track / Variant / module; the public ledger is a module and the former Track B is a composition of A.1 (2026-10-12) → ADR-0007, ADR-0008, `07-family-conventions.md` §13
- [x] Track A documents restructured as Track / Variant / modules: A.1 0.5.0-draft, core in `01-design.md`, modules and compositions in `04-modules.md` (2026-10-13)
- [x] Contracts restructured to A.1 0.5.0 (2026-10-13): `A1Core` with the public-ledger, role-issuance and Wrapper-port modules, `IPEPModules` probe, one version; tests pass, gas unchanged
- [x] dApp follows A.1 0.5.0 (page from `pep()`, features from the modules) and both testnet tokens are redeployed (2026-10-13) → `tracks/track-a/variant-1/03-deployments.md`
- [x] A.1 0.5.0: both tokens run end to end on chain (2026-10-13) → `tracks/track-a/variant-1/03-deployments.md`
- [ ] A.1 0.5.0: exercise the dApp pages in a browser; add `mintConfidential` and the `0x81` burn to the page of the token with the public ledger
- [x] Track B opened for the note model; B.1 design, 0.1.0-draft (2026-10-13) → ADR-0009, `tracks/track-b/`
- [x] B.1: on-chain Poseidon tree measured locally (2026-10-13): 696k to 943k gas per transaction at depth 24 → `tracks/track-b/variant-1/01-design.md` §12
- [x] B.1: tree depth 24, updated on chain in the transaction (D1, D7; 2026-10-13)
- [x] B.1: join-split circuit (2026-10-13): 55,343 constraints, about 2.9 s to prove in Node; the on-chain Poseidon is fixed by the Variant (D8)
- [x] B.1: token contract `B1NoteToken` with role issuance and the Wrapper port (2026-10-13): about 1.37M gas per operation, measured locally
- [x] B.1: dApp page `/tracks/b/1` (2026-10-13): key, history walk, notes, proofs in the browser; client library checked against the circuit offline
- [x] B.1 deployed on BSC testnet (2026-10-13); all five operations run on chain → `tracks/track-b/variant-1/02-deployments.md`
- [x] ADR-0010 (accepted 2026-10-13, done the same day): reword 07 §1, §5, §6, §7 and §13.1; new versions of A.1 and B.1 (`mint` by the transfer rule, fold as its own function, `approve` reverting without the public ledger, no `prepare` / `cancel`); dApp; redeploy
- [ ] ADR-0011 (accepted 2026-10-13): the project is named Casata (long form Casata Segreta), the guide Cicerone; `pep()` / `IPEP*` / `PEPWrapper` and the EIP-712 domain are renamed in the same Variant versions as ADR-0010. Done except for renaming the repositories, which the owner does on GitHub
- [x] ADR-0010 and ADR-0011 in the documents (2026-10-13): 07, A.1 0.6.0 (01-design, 04-modules), B.1 0.2.0, 06, 10, 11, the indexes and the READMEs
- [x] A.1 0.6.0 and B.1 0.2.0 in the contracts and the dApp (2026-10-13): Casata names, `fold(id, payload)`, `mint` by the payload rule, no `prepare` / `cancel`, `approve` reverting without the public ledger, the handle notice before a signature; 70 contract tests pass
- [x] The three testnet tokens redeployed as A.1 0.6.0 and B.1 0.2.0 and run end to end on chain (2026-10-13) → `tracks/track-a/variant-1/03-deployments.md`, `tracks/track-b/variant-1/02-deployments.md`
- [ ] B.1: browser pass of the dApp page; B.1 decoder for the regulator view; deploy form in the dApp
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
