# A1-0004 available / pending 拆分与惰性折叠

- 状态：Accepted
- 日期：2026-09-24
- 范围：A.1

## 背景

花费证明绑定付款账户的余额密文。若他人的入账直接修改该密文，本人在途的证明会失效。最初设计用本人调用 `applyPending()` 折叠待入账；账户与地址解耦后，该函数失去了 `msg.sender` 授权：开放调用可被用来反复改 `nonce` 打断本人证明（griefing），加证明则要 ~200k gas 做一件本应 40k 的事。

## 决策

1. 每个账户维护 `available`（只被本人的证明修改）与 `pending`（只被他人写入）。
2. **删除 `applyPending`**。每次花费（`0x01` / `0x04`）后合约自动 `available += pending; pending = 0`。本人通过 memo 与事件已知每笔入账。
3. 证明默认只绑定 `available`，永不因他人入账失效。
4. flags 位 `includePending`：证明绑定 `available + pending`，用于 `available` 为零的新账户。此时上链前若有新入账，证明失效需重做；这是用户的选择，协议不兜底。
5. 两种情况下合约状态更新公式相同，仅公开输入中的前状态不同。

## 备选方案

- 保留 `applyPending` 并开放给任何人：griefing。
- 保留 `applyPending` 并要求证明：Gas 不成比例。
- 取消 `pending`，入账直接进 `available`：证明频繁失效。

## 后果

- 正面：函数表面减少一个；无 griefing 面；常规花费永不遇到并发失效。
- 负面：`pending` 中的资金在本人下一次花费前不可用；新账户首次花费承担一次竞争风险。
- 负面：`pending` 的明文不在链上状态中，本人需从上次折叠之后的事件 memo 重建；长期只收不花的账户依赖 RPC 的日志保留深度。

## 修订

- 2026-09-26（0.2.5）：账户增加 `foldedAtBlock`，每次花费记录 `block.number`，与 `nonce` 同槽打包、零额外 gas。客户端由此得到重建 pending 的精确事件窗口 `[foldedAtBlock, latest]`，不再需要猜测扫描深度。不改变决策本身。
