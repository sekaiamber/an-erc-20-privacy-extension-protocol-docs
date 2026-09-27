English | [中文](a1-0004-pending-lazy-fold.zh-cn.md)

# A1-0004 available / pending split and lazy fold

- Status: Accepted
- Date: 2026-09-24
- Scope: A.1

## Context

The spend proof binds to the paying account's balance ciphertext. If incoming transfers from others modified that ciphertext directly, the owner's in-flight proof would be invalidated. The initial design had the owner call `applyPending()` to fold pending funds; once accounts were decoupled from addresses, that function lost its `msg.sender` authorization: an open call could be used to repeatedly change the `nonce` and interrupt the owner's proofs (griefing), while requiring a proof would cost ~200k gas for something that should cost 40k.

## Decision

1. Each account maintains `available` (modified only by the owner's proofs) and `pending` (written only by others).
2. **Remove `applyPending`**. After every spend (`0x01` / `0x04`), the contract automatically performs `available += pending; pending = 0`. The owner already knows every incoming transfer through memos and events.
3. By default the proof binds only to `available` and is never invalidated by others' incoming transfers.
4. The flags bit `includePending`: the proof binds to `available + pending`, used for new accounts whose `available` is zero. In this case, if a new incoming transfer arrives before the transaction lands, the proof is invalidated and must be redone; this is the user's choice, and the protocol provides no fallback.
5. In both cases the contract's state update formula is identical; only the prior state in the public inputs differs.

## Alternatives

- Keep `applyPending` and open it to anyone: griefing.
- Keep `applyPending` and require a proof: disproportionate gas.
- Drop `pending` and credit incoming transfers directly into `available`: proofs invalidated frequently.

## Consequences

- Positive: one fewer function on the surface; no griefing surface; regular spends never encounter concurrent invalidation.
- Negative: funds in `pending` are unavailable until the owner's next spend; a new account bears a one-time race risk on its first spend.
- Negative: the plaintext of `pending` is not in on-chain state; the owner must reconstruct it from event memos since the last fold; an account that only receives and never spends for a long time depends on the RPC's log retention depth.

## Revisions

- 2026-09-26 (0.2.5): the account gains `foldedAtBlock`; every spend records `block.number`, packed in the same slot as `nonce` at zero extra gas. The client thereby obtains the exact event window `[foldedAtBlock, latest]` for reconstructing pending and no longer needs to guess the scan depth. Does not change the decision itself.
