[English](03-security-review.md) | 中文

# B.1 安全自审（第一轮）

日期：2026-09-27。范围：`ConfidentialERC20B1`、`B1Payload`、`PEPWrapper`、`WrappedERC20`，以及 B.1 对 A.1 电路的使用。B.1 从 A.1 复制的一切（账户模型、密文、惰性折叠、证明绑定、F1–F14）由 [A.1 自审](../../track-a/variant-1/02-security-review.zh-cn.md) 覆盖，此处不重复。

## 发现

| # | 严重度 | 位置 | 发现 | 处理 |
| --- | --- | --- | --- | --- |
| B1-F1 | **中** | `mint`、wrapper | **供应上限没有计入已 wrap 出去的代币。** 上限检查只看 `totalSupply`（机密部分）。序列：铸到上限，wrap 出一半，再铸到上限；此时已发行量超过 2⁶⁴ − 1，之后每次 `unwrap` 都在上限检查处 revert——持有 wTOKEN 的人回不来，直到机密侧缩减。是活性问题，不是盗窃。 | **已修复（0.1.1）**：`wrappedOut` 记录 `wrapperBurn − wrapperMint`；`issuedSupply() = totalSupply + wrappedOut`；MINTER 的上限检查按已发行量。unwrap 不改变已发行量，因此永远碰不到上限。 |
| B1-F2 | **中** | `wrapperMint` | **wrapper 曾是无上限的铸币者。** 控制 `wrapper()` 的人可向任意 id 记入任意金额。被攻破或有 bug 的 wrapper 是全家族风险（10-wrapper §5）。 | **已修复（0.1.1）**：`amount > wrappedOut` 时 `wrapperMint` revert `ExceedsWrappedOut`。wrapper 只能铸回它拿出去的量；最坏情况是把该代币未回流的 wrap 量记错账户，绝不会增发。测试：用 EOA 充当 wrapper。 |
| B1-F3 | 低 | `PEPWrapper.unwrap` | 对从未 wrap 过的底层代币调用 `unwrap`，会先创建 wTOKEN 再在销毁处失败；任何人可以花 gas 往 wrapper 里塞空的 `wTOKEN` 合约。 | **已修复（0.1.1）**：`unwrap` 要求 wTOKEN 已存在（`NothingWrapped`）。 |
| B1-F4 | 低 | 事件 | `wrapperMint` / `wrapperBurn` 曾发 `Minted` / `Burned`，索引器无法区分发行与 unwrap、销毁与 wrap。 | **已修复（0.1.1）**：`WrapperMinted` / `WrapperBurned`；`Minted` 仅用于发行；四种情况都发零地址的 `Transfer`（ERC-20 索引器的预期）。 |
| B1-F5 | 信息 | `wrap` 中继 | 任何人可代提交 wrap payload。中继者换 `to` 重发会被拒绝（`to` 在证明里：A.1 F14 修复，电路复用）。同 `to` 重发无害（中继者付 gas）。 | 接受；有回归测试。 |
| B1-F6 | 信息 | `wrap` 与直接 `0x81` | 为 wrapper 造的 payload（`to` = wTOKEN 收款人）不能走直接路径（要求 `to == 0`），反之亦然：同一个字段决定两条路。 | 无需处理；两个方向都有测试。 |
| B1-F7 | 信息 | `PEPWrapper` | 恶意「代币」重入：wrapper 不持有资金，只碰该代币自己的 `wTOKEN`；敌意底层只能增发自己的包装代币，碰不到别人的。每个 `wTOKEN` 在创建时绑定一个底层。 | 接受：影响面按代币隔离。 |
| B1-F8 | 信息 | 信任 | `wrapper()` 只设一次，可以是任何地址，包括 EOA。注册错 wrapper 是 admin 的责任；B1-F2 之后损失以 `wrappedOut` 为界。 | 已写入文档（10-wrapper W3）。 |
| B1-F9 | 信息 | 骚扰 | `unwrap`（如同 A.1 的 shield）允许任何人向任意 id 塞入账；新账户锁定（A.1 F1）已由 `0x80` 折叠关闭，B.1 有它。 | 无需处理。 |
| B1-F10 | 信息 | ERC-20 表面 | `approve` 发 `Approval` 但无效果；`transfer` 恒 revert；`balanceOf` 为 0。用 `eth_call` 预检 `transfer` 的钱包会看到 revert——这正是 Track B 想给的信号（B-3）。 | 接受。 |

## 测试未覆盖

- 2⁶⁴ − 1 上限边界本身（到达它需要 > 6.5 万次铸造）；该算术只有一行，由 `issuedSupply` / `wrappedOut` 访问器间接验证。

## 信任假设（在 A.1 之外）

- 已注册的 wrapper 诚实；即便不诚实，损失以 `wrappedOut` 为界（B1-F2）。
- MINTER 角色是发行方；发行金额按设计公开（Track B 决定 B-2）。
