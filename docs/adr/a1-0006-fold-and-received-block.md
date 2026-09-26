# A1-0006 纯折叠 `0x80` 与 `lastReceivedAtBlock`

- 状态：Accepted
- 日期：2026-09-26
- 范围：A.1（`lastReceivedAtBlock` 明确**不**升为家族约定）

## 背景

A1-0004 把折叠搭在花费上。两个后果在测试网试用中暴露：

1. 收款方重建 pending 明文依赖上次折叠之后的事件 memo；只收不花的账户窗口无限增长，公共 RPC 的日志保留（publicnode 约 9 万块）很快就不够。折叠本身不产生知识，但能把已经解出的知识（`decryptable`）存进链上、推进窗口起点——前提是能在不转账的情况下折叠。
2. 安全自审 F1：新账户首次花费必须 `includePending`，攻击者逐块打 1 单位即可让证明永远失效。

同时，客户端事件窗口只有起点（0.2.5 的 `foldedAtBlock`）没有终点，收款很久以前、之后再没收过的账户要空扫一整段。

## 决策

1. 新增 A.1 私有 payload 类型 `0x80`：电路只证明「持有 `from` 的私钥」并绑定 `(from, nonce, contract, chainId)`；合约执行与花费相同的折叠更新（`available += pending − folded`，`nonce++`，`foldedAtBlock`，可选写 `decryptable`），不移动任何资金，不支持 `prepare`。
2. 账户增加 `lastReceivedAtBlock`，在 `_addPending` 中写入，与 `nonce` / `foldedAtBlock` 同一存储槽。客户端事件窗口收紧为 `[foldedAtBlock, lastReceivedAtBlock]`。
3. `lastReceivedAtBlock` 仅限 A.1。理由：A.1 的收款事件本来就公开 `to`（明文 id）与区块，状态中再记一份不增加信息；但任何隐藏收款人的变体（stealth 类）里，「按 id 记录收款区块」会把交易重新和账户连起来，因此不得作为家族约定。

## 备选方案

- 只加 `lastReceivedAtBlock`、不做纯折叠：窗口有界但仍随「不花费的时间」增长；F1 仍在。
- 让任何人可调用折叠（无证明）：A1-0004 已否——可被用来打乱本人 nonce。
- 收款 memo 写入存储以摆脱事件依赖：每笔约 +44k，且仍需本人解密；不采用。

## 后果

- 正面：F1 关闭；「收款频繁、花费很少」的账户可定期折叠把窗口归零；有终点的窗口让 dapp 能在扫描前判断请求量并拒绝过大的跨度。
- 负面：合约多一个验证器（部署一次，共享）；每笔收款多一次热写 2.9k（首次收款 22.1k，但抵消了该账户首次花费的一次冷写）；折叠本身是一笔约 250k gas 的交易（首次约 450k）。
- 折叠仍不替代「知道金额」：写入正确的 `decryptable` 需要本人已经解出 pending 总额（memo 或本地离散对数）。
