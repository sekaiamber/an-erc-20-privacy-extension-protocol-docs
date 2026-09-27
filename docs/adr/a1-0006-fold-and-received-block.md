English | [中文](a1-0006-fold-and-received-block.zh-cn.md)

# A1-0006 Pure fold `0x80` and `lastReceivedAtBlock`

- Status: Accepted
- Date: 2026-09-26
- Scope: A.1 (`lastReceivedAtBlock` is explicitly **not** promoted to a family convention)

## Context

A1-0004 piggybacked folding on spending. Two consequences surfaced during testnet trials:

1. The payee's reconstruction of the pending plaintext depends on event memos since the last fold; for an account that only receives and never spends, the window grows without bound, and the log retention of public RPCs (publicnode, roughly 90k blocks) quickly becomes insufficient. Folding itself produces no knowledge, but it can store already-derived knowledge (`decryptable`) on-chain and advance the window's start point, provided that folding is possible without transferring.
2. Security self-review F1: a new account's first spend must use `includePending`; an attacker sending 1 unit every block can keep the proof permanently invalid.

At the same time, the client's event window has only a start point (0.2.5's `foldedAtBlock`) and no end point; an account that received long ago and never received again has to scan an entire empty span.

## Decision

1. Add the A.1-private payload type `0x80`: the circuit proves only "holds the private key of `from`" and binds `(from, nonce, contract, chainId)`; the contract executes the same fold update as a spend (`available += pending − folded`, `nonce++`, `foldedAtBlock`, optionally writing `decryptable`), moves no funds, and does not support `prepare`.
2. The account gains `lastReceivedAtBlock`, written in `_addPending`, in the same storage slot as `nonce` / `foldedAtBlock`. The client's event window tightens to `[foldedAtBlock, lastReceivedAtBlock]`.
3. `lastReceivedAtBlock` is restricted to A.1. Rationale: A.1's receive events already expose `to` (plaintext id) and the block, so recording another copy in state adds no information; but in any variant that hides the recipient (stealth-style), "recording the receive block per id" would re-link transactions to accounts, so it must not become a family convention.

## Alternatives

- Add only `lastReceivedAtBlock` without a pure fold: the window is bounded but still grows with "time without spending"; F1 remains.
- Let anyone call fold (without a proof): already rejected in A1-0004; it can be used to scramble the owner's nonce.
- Write receive memos into storage to escape the event dependency: about +44k per transfer, and the owner still has to decrypt; not adopted.

## Consequences

- Positive: F1 is closed; accounts that "receive often, spend rarely" can fold periodically to reset the window to zero; a window with an end point lets the dapp estimate the request volume before scanning and refuse an excessively large span.
- Negative: the contract has one more verifier (deployed once, shared); every receive incurs one more warm write of 2.9k (22.1k on the first receive, but this offsets one cold write on that account's first spend); the fold itself is a transaction of about 250k gas (about 450k the first time).
- Folding still does not replace "knowing the amount": writing a correct `decryptable` requires the owner to have already derived the pending total (via memo or local discrete logarithm).
