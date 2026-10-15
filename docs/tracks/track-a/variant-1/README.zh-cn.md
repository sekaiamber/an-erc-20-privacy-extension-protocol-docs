[English](README.md) | 中文

# A.1：ElGamal 加密账户 + Groth16

版本：`0.8.0`（已实现，2026-10-15 部署到 BSC testnet：金额 `< 2¹²⁸`，小数位在部署时选，[ADR-0014](../../../adr/0014-eighteen-decimals.zh-cn.md)；见 04-modules §9.3）。`0.7.0`（已实现，2026-10-15 部署到 BSC testnet；[ADR-0013](../../../adr/0013-mintable.zh-cn.md)、[A1-0007](../../../adr/a1-0007-exit-kind-binding.zh-cn.md)）。`0.6.0` 自 2026-10-13 起仍部署在链上（内核加模块，见 [ADR-0008](../../../adr/0008-modules.zh-cn.md)）　状态：`Draft`

0.7.0 实现为八个生成的合约，模块的每个子集一个；它的两个参考代币 `A1LedgerToken` 与 `A1PrivateToken` 于 2026-10-15 部署到 BSC testnet，与 2026-10-13 的 0.6.0 代币并存（[03-deployments](03-deployments.zh-cn.md)）。早于模块结构的两个独立合约 `ConfidentialERC20A1` 0.4.0 与 `ConfidentialERC20B1` 0.2.0 仍留在链上，dApp 已不再打开它们。

## 一句话

机密账户就是一把 Baby Jubjub 公钥。链上只出现公钥的哈希，即账户 id；公钥本身永不上链。余额是一份 ElGamal 密文。花费由零知识证明授权，证明同时保证守恒与非负；每笔机密转账还把金额加密给监管公钥。收付方以稳定的化名出现，金额与余额隐藏。

## 结构

| 部分 | 是什么 | 规格在哪里 |
| --- | --- | --- |
| **内核** | 纯隐私账本：账户、初始发行、`0x01` 转账、`fold`、`0x81` 销毁、监管密钥、三个电路 | [01-design.md](01-design.zh-cn.md)；初始发行和销毁见 [04-modules.md](04-modules.zh-cn.md) §3 与 §4.0 |
| **公开账本**（模块） | 代币地址上的标准 ERC-20 余额；`0x03` shield、`0x04` unshield | [04-modules.md](04-modules.zh-cn.md) §4.1；流程见 01-design §4.1 与 §4.4 |
| **可增发**（模块） | 部署后由角色发行，金额公开。到 0.6.0 为止叫角色铸造，那时销毁也在其中 | [04-modules.md](04-modules.zh-cn.md) §4.2 |
| **Wrapper 端口**（模块） | 给家族 Wrapper 或家族网关（[14](../../../14-gateway.zh-cn.md)）用的 `ICasataWrappable` | [04-modules.md](04-modules.zh-cn.md) §4.3 |

A.1 0.7.0 与 0.5.0、0.6.0 一样，声明支持且只支持这三个模块；以后登记的模块需要新的 A.1 版本才能支持（07 §13.2）。从 0.7.0 起，它们的每个子集都是代币：只有内核就是一个固定供应的隐私代币。

各部分怎么组合、供应量怎么跨模块记账、每个版本改变什么，见 [04-modules.md](04-modules.zh-cn.md)。

## 组合

下表是 0.6.0 已发布的组合。0.7.0 让模块的八个子集都成为代币；它为每个子集发布一个由脚本生成的合约（04-modules §6，M10）。

| 组合 | 模块 | 目前的部署形式 | 记录 |
| --- | --- | --- | --- |
| 带公开账本 | 公开账本、角色铸造（0.7.0 起叫可增发） | `A1LedgerToken`，`A:1:0.6.0` | [02-security-review.md](02-security-review.zh-cn.md)、[03-deployments.md](03-deployments.zh-cn.md) |
| 纯隐私 | 角色铸造（0.7.0 起叫可增发）、Wrapper 端口 | `A1PrivateToken`，`A:1:0.6.0` | [03-deployments.md](03-deployments.zh-cn.md)；0.5.0 之前那个独立合约的记录见 [variant-1-privacy-only](../variant-1-privacy-only/README.zh-cn.md) |

## 隐私评估（家族约定 §12）

| 目标 | 达成 | 说明 |
| --- | --- | --- |
| P1 金额隐藏 | `0x01` 完全隐藏 | 初始发行、铸造、销毁、shield、unshield、wrap、unwrap 的金额公开 |
| P2 收款方 | 化名 | 一个稳定的 id；背后的公钥永不上链 |
| P3 付款方 | 化名 | 同 P2 |
| P4 交易关联 | 可关联 | 同一个 id 的全部活动都能关联起来。保留的 `0x02` 一次性 id 只能让收款之间无法关联 |
| P5 划转关联 | 取决于模块 | 带公开账本时，每一次 `0x03` / `0x04` 都是钱包与 id 之间的一条公开的边。纯隐私组合里只有发给 id 的发行、wrap、unwrap 是，用网关时还有存入和取回 |
| S1–S5 | 满足 | 范围证明与余额证明；nonce 与单写者密文；花费需要私钥；公开账本是未经修改的 ERC-20；没有冻结或没收接口 |

## 文档

| 文档 | 内容 |
| --- | --- |
| [01-design.md](01-design.zh-cn.md) | 内核的细节：参数、账户与状态、payload、流程、电路、事件、客户端流程、gas |
| [04-modules.md](04-modules.zh-cn.md) | 模块与组合：原语、供应量记账、各个模块、各组合的 ERC-20 表面、探针、0.5.0、0.6.0、0.7.0 和 0.8.0 各改变什么 |
| [02-security-review.md](02-security-review.zh-cn.md) | 带公开账本的组合的第一轮安全自审 |
| [03-deployments.md](03-deployments.zh-cn.md) | 部署记录（BSC testnet）：0.5.0 起包含两种组合，之前只有带公开账本的组合 |
| [variant-1-privacy-only](../variant-1-privacy-only/README.zh-cn.md) | 纯隐私组合以原名 B.1 留下的记录 |
