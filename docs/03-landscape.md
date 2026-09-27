English | [中文](03-landscape.zh-cn.md)

# 03 Landscape

Status: `Draft`

This document gives a categorized overview of existing on-chain privacy solutions on the EVM. Detailed research on an individual solution goes into the `research/` directory, with a link added at the corresponding place in this document.

> Note: the descriptions of the solutions in this document are based on a preliminary understanding of public material; the source code has not yet been checked one by one. Entries marked `to be verified` need to be updated after deeper research.

## Classification Dimensions

| Dimension | Values |
| --- | --- |
| Privacy scope | Amount / payer and payee identity / transaction linkage |
| State model | Account model / UTXO (note) model / encrypted account model |
| Core technique | Mixer / ZK proof / FHE / stealth address / TEE |
| Relationship to ERC-20 | Native token / wrapping an existing token / extending an existing token |
| Trust assumption | Trustless / trusted setup / relayer / threshold network / hardware |
| Compliance capability | None / viewing key / association set proof / whitelist |

## Solution Categories

### A. Mixers / Shielded Pools

Deposit tokens into a pool to obtain a commitment (note), then withdraw or transfer within the pool with a zero-knowledge proof.

- **Tornado Cash**: fixed denominations, deposit and withdraw only, no in-pool transfers. Amount privacy relies on the fixed denominations.
- **Railgun**: a general-purpose ERC-20 shielded pool with a UTXO model, supporting in-pool transfers and calls to external contracts (via relay adapt). `to be verified`
- **Privacy Pools**: adds "association set proofs" on top of Tornado, allowing users to prove that the source of their funds does not belong to some blacklist set, accommodating compliance. `to be verified`
- **Zcash / Sapling circuits**: not EVM, but its note commitment + nullifier model is the common ancestor of the solutions above.

Characteristics: strong privacy, but assets must "enter the pool"; tokens inside the pool are no longer standard ERC-20, and composability is limited.

### B. Stealth Addresses

The sender derives a one-time new address for the receiver; only the receiver can discover it and spend from it with their private key.

- **ERC-5564**: the Ethereum stealth address standard interface.
- **ERC-6538**: stealth meta-address registry.
- **Umbra**: an early stealth address implementation.

Characteristics: hides only the receiver's identity, not the amount; fully compatible with ERC-20 and requires almost no changes to the token contract; but the source of gas when the receiver later spends causes linkage leakage.

### C. Encrypted Account Model (Confidential Token)

Balances are stored as ciphertexts in an account model, and transfers perform operations on the ciphertexts.

- **Zama fhEVM / Confidential ERC-20**: based on fully homomorphic encryption; balances and amounts are FHE ciphertexts, decrypted by a threshold network. `to be verified`
- **ERC-7984 (Confidential Fungible Token)**: a confidential fungible token interface proposal. `to be verified`
- **Pedersen commitments + range proofs (Bulletproofs style)**: a variant of the Monero RingCT idea applied to the account model.

Characteristics: retains the account model, with good compatibility; strong amount privacy, but payer and payee identities usually remain public; FHE solutions carry additional trust assumptions (threshold decryption network) and higher cost.

### D. Privacy L2s / Private Execution Environments

- **Aztec**: a zk-rollup with private state; private functions execute on the client and produce proofs.
- **TEE-based solutions**: contracts execute inside trusted hardware, with encrypted state.

Characteristics: the most complete privacy capability, but tokens must be bridged into that environment, leaving the ERC-20 ecosystem of the original chain.

### E. Other Related Proposals

- **ERC-7503 (Zero-Knowledge Wormholes)**: private transfer by "proving a burn". `to be verified`
- **ERC-4337 / Paymaster**: account abstraction and sponsored gas; usable to mitigate the gas linkage problem of category B solutions.
- **Semaphore**: anonymous signaling / group membership proofs; usable as an identity-layer component.

## Relationship to This Project

This project is concerned with the **"extending an existing ERC-20"** column, and maps the routes above onto the Track / Variant structure of the protocol family:

| External solution category | Corresponding position in the family | Notes |
| --- | --- | --- |
| Category C encrypted accounts (Zether, Solana Confidential Transfer) | **Track A / A.1** (mainline) | Account model + homomorphic ciphertexts + ZK; on top of this, the project adds "account = public key, public key not on chain" and cryptographically enforced regulator ciphertexts |
| Category A note-model shielded pools (Zcash Sapling, Railgun) | Track A / A.x or Track B / B.x | Payer and payee hidden; an alternative Variant |
| Category C FHE (Zama, ERC-7984) | Track A / A.x or Track C | No user keys but depends on a threshold network; research only |
| Category B stealth addresses (ERC-5564) | A.1's `0x02` stealth type | Accounts are already decoupled from addresses; the payer only needs to derive a one-time public key |

See ADR-0002, A1-0001 and A1-0002 for the rationale behind these choices.

## Topic: Which Systems Have No pending (2026-09-26)

A.1's confidential account is split into two ciphertexts, `available` / `pending` (A1-0004). This structure is not unique to this project; it is the inevitable result of three premises stacked together: **account model** + **balance is a homomorphic ciphertext** + **the user produces the proof that "the balance is sufficient"**. The proof is bound to the payer's current ciphertext and nonce; if a third party (a depositor) could modify that ciphertext, the payer's transaction in the mempool would be invalidated, and sending 1 unit per block would be enough to make it impossible for them to ever transfer out (the front-running problem described in the Zether paper). Therefore "state only the owner can modify" (available) and "state written by others" (pending) must be separated.

Remove any one premise and pending disappears. The three known routes:

| Route | Premise removed | Representatives | Why pending is unnecessary | Cost |
| --- | --- | --- | --- | --- |
| note / UTXO model | Account | Zcash, Aztec, Railgun, Tornado | No balance ciphertext; each receipt is an independent note, and spending = destroying old notes and creating new notes. Notes created by others do not touch existing notes, so proofs are not invalidated | The receiver must trial-decrypt every note on the chain to know which ones belong to them (a heavier dependence on history than the account model); no single balance, a set of notes must be managed; change requires a new note |
| Contract decides on ciphertexts by itself | User-side proof | Zama fhEVM / ERC-7984 (FHE), Inco, Fhenix; Oasis Sapphire, Secret Network SNIP-20 (TEE) | `balance ≥ amount` is computed by the contract directly on FHE ciphertexts (homomorphically zeroed if insufficient), or computed in plaintext inside an enclave. With no user proof there is no "proof bound to old state" problem, and receipts go directly into available | Security is no longer purely cryptographic: FHE depends on a threshold decryption network (even a user viewing their own balance needs its re-encryption), TEE depends on hardware; gas and latency are one to two orders of magnitude higher; regulator decryption is authorized by the network rather than by an independent key |
| Proof against historical state | (formally keeps all three) | Variant discussed in the Zether paper | The user proves `b_old ≥ v` against some historical ciphertext `C_old`, and the contract applies the difference homomorphically to the current ciphertext. Others can only add funds, so the real balance ≥ `b_old` and there is no overdraft | The contract must verify that `C_old` really is a historical state of that account (Merkle root of historical commitments), and needs a nonce to prevent the owner from reusing the same `C_old` for two transfers. The nonce increments only when the owner spends, so `C_old` can only be "the state after the owner's last spend" — the contract must store it, and that is exactly available; receipts after it are pending. Only the name has changed |

Conclusion: under the "account + user proof" model, the contract must necessarily remember "the last state the owner knew"; the only difference is whether it is called checkpoint / current or available / pending. Zether's epochs, Solana Token-2022 Confidential Transfer's pending / available (which requires an explicit `ApplyPendingBalance`), and A.1's lazy fold are three manifestations of the same structure. A.1 chose account + proof for the sake of ERC-20 semantics (one address, one balance; direct reuse of `transfer`) and purely cryptographic security; pending is the cost of that choice, not additional complexity.

A related practical consequence: the available plaintext can be read directly from the on-chain `decryptable` copy, whereas the pending plaintext can only be reconstructed from the event memos since the owner's last fold, so accounts that receive for a long time without spending depend on the RPC's log retention depth (see track-a/variant-1/03-deployments).

## Research Backlog

- [ ] Railgun: contract structure, note format, relay adapt mechanism
- [ ] Privacy Pools: circuit and contract interface of association set proofs
- [ ] Zama Confidential ERC-20 and ERC-7984: interface design, decryption flow, trust assumptions
- [ ] ERC-5564 / ERC-6538: minimal changes needed to integrate with the token contract
- [ ] Aztec: note design of private tokens, as a comparison
- [ ] Zether: details of the epoch mechanism and front-running handling, compared item by item with A.1's lazy fold
- [ ] Solana Token-2022 Confidential Transfer: interface and cost of pending / available and `ApplyPendingBalance`
- [ ] Actual gas cost of each solution on mainnet
