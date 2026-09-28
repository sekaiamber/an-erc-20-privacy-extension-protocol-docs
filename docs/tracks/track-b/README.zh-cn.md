[English](README.md) | 中文

# Track B：纯机密隐私机制

状态：`Prototype`——B.1 已于 2026-09-27 部署到 BSC testnet（同日启动，起因是「能否隐藏被机密化的总量」——在 Track A 里不可能，见 A.1 03-deployments 与威胁模型）

## 集成方契约

Track B 代币**没有公开账本**。不存在任何明文「持有」代币的地址，所以「有多少代币在机密状态」这个问题根本不存在：唯一公开的数字是 `totalSupply`。

| ERC-20 表面 | Track B 行为 |
| --- | --- |
| `totalSupply()` | 公开：铸造 − 销毁。铸造与销毁金额按设计公开。 |
| `balanceOf(addr)` | 恒为 `0`（下文决定 B-1）。余额只以密文形式存在于机密 id 之下。 |
| **不带 payload** 的 `transfer(to, x)` / `transferFrom(from, to, x)` | revert `NoPublicLedger()`。没有任何公开的东西可以转。 |
| `transferFrom(id, id, handle)` + payload `0x01` | 机密转账，证明即授权（家族约定 §1–§5）。 |
| `transferFrom(id, id, handle)` + payload `0x80` | 折叠（Variant 私有类型，同 A.1）。 |
| `transferFrom(id, 0x0, amount)` + payload `0x81` | **销毁**，金额公开：代币离开机密账本的唯一途径。`totalSupply` 减少。 |
| `mint(id, amount)` | 仅 MINTER 角色；公开金额以退化密文 `(amount·G, 0)` 记入机密 id 的 pending。`totalSupply` 增加。 |
| `approve` / `allowance` | 为接口完整性保留；不授权任何事（没有公开余额）。 |
| `Transfer(from, to, x)` | 每个操作都发：铸造 `Transfer(0x0, id, amount)`，销毁 `Transfer(id, 0x0, amount)`，机密转账 `Transfer(id, id, handle)`。 |

对集成方的后果：

- 钱包里每个地址的余额都显示 0；真实余额只有懂该 Variant 的钱包（dapp）能看到。
- 无法接入任何 DEX、借贷、桥：没有公开的东西可以入池。
- 区块浏览器看到固定的供应量、一组机密 id、以及它们之间的转账**事件**（金额隐藏）。`Σ balanceOf == totalSupply` 这类供应校验必然失败——这是隐藏总量的代价。

## Variants

| Variant | 内核 | 收款方 | 金额 | 监管 | 状态 |
| --- | --- | --- | --- | --- | --- |
| [B.1](variant-1/README.zh-cn.md) | A.1 的机密账本（ElGamal 加密账户 + Groth16，0.4 起为普通 ElGamal）去掉公开账本 | 化名（稳定 id） | 隐藏 | 第三份密文，密码学强制 | 0.2.0（原型） |

## Track 层已定决策

- **B-1 `balanceOf` 返回 0**，而不是句柄。句柄放进 `balanceOf` 会被所有钱包显示成一个无意义的 77 位数字，还会破坏任何做余额求和的工具；0 是诚实的（「这里没有公开的东西」）且便宜。Variant 可通过自己的视图暴露密文。
- **B-2 铸造 / 销毁金额公开。** `totalSupply` 必须有意义；隐藏发行量需要机密供应量证明，超出本 Track 范围。
- **B-3 无 payload 的调用 revert**，而不是静默无事，让发普通 `transfer` 的钱包立刻知道这不是公开 ERC-20。
