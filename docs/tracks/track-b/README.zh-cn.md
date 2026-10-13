[English](README.md) | 中文

# Track B：note 模型

状态：`Draft`。由 [ADR-0009](../../adr/0009-track-b-notes.zh-cn.md) 于 2026-10-13 开设。只有设计，没有任何实现。

> 2026-10-12 之前，「Track B」指的是没有公开账本的代币。它现在是 A.1 的一种组合（[ADR-0008](../../adr/0008-modules.zh-cn.md)），文档在 [track-a/variant-1-privacy-only](../track-a/variant-1-privacy-only/README.zh-cn.md)。已部署的、自报 `B:1:0.2.0` 的合约属于那种组合，不属于本 Track。

## 定义

| | Track A，加密账户 | Track B，note 模型 |
| --- | --- | --- |
| **状态模型** | 每个账户 id 一份密文余额 | note：一棵承诺树和一个作废符集合。没有账户 |
| **信任基础** | 用户持有密钥，证明在客户端生成，不依赖外部网络 | 相同 |

两个 Track 的信任基础相同，区别在状态模型。

## 各外部方必须知道什么

| 外部方 | 相对 Track A 的变化 |
| --- | --- |
| **集成方** | `from` 和 `to` 不携带任何信息。没有任何事件写出付款方或收款方。没有按账户的视图，连密文也没有 |
| **用户** | note 由钱包保存。钱包要处理该代币的每一笔交易才能找到它们，换设备要从部署区块开始重扫。收款码是一把永不上链的公钥 |
| **监管方** | 还原的单位是所有者公钥，不是 id。一次查看覆盖一个区块区间内的全部交易，无法事先收窄到某一把公钥 |

## 集成方契约（所有 B.x 都遵守）

家族约定 §1–§12 适用，并作如下收窄。

| ERC-20 表面 | Track B 的行为 |
| --- | --- |
| 带 note 转账 payload 的 `transferFrom(from, to, x)` | `from` 和 `to` 必须是代币自身的地址；`x` 是句柄。由证明授权，不检查 `msg.sender` |
| 按公开金额销毁 | `transferFrom(token, 0x0, amount)`，带 Variant 自定义的 payload；找零以 note 的形式返回 |
| `Transfer` 事件 | note 转账发出 `Transfer(token, token, handle)`。价值进入（铸造、unwrap）时发出 `Transfer(0x0, token, amount)`；价值离开（销毁、wrap）时发出 `Transfer(token, 0x0, amount)` |
| `balanceOf(a)` | 代币自身地址返回 `totalSupply()`，其它地址返回 0；带公开账本模块时除外 |
| 不带 payload 的 `transfer` / `transferFrom` | 回退 `NoPublicLedger()`；带公开账本模块时除外 |
| 专用事件 | 每个 Variant 定义一个事件，携带作废符、承诺和 memo，没有任何能识别用户的索引字段 |
| 监管接口 | 约定 §9 不变；其中的「账户」在这里指「所有者公钥」 |

全部价值都在代币自身的地址上，所以各地址 `balanceOf` 之和等于 `totalSupply()`。

## 模块

与家族里的任何代币一样，一个 Track B 代币是一个 Variant 加若干模块（[07 §13](../../07-family-conventions.zh-cn.md)）。每个 Variant 写明它支持哪些模块。

## 家族工具

| 工具 | 对 Track B 要做什么 |
| --- | --- |
| Wrapper（[10](../../10-wrapper.zh-cn.md)） | 原样使用。`recipient` 里放一份创建 note 的 payload；`from` 是零地址 |
| 监管视图 | 需要一个解码器，把交易还原成 note 表，再按所有者公钥汇总 |
| 监管委员会（[11](../../11-regulatory-committee.zh-cn.md)） | 合约不变。密码学也不变：每笔交易一个 `D`。申请没有账户过滤，总是覆盖整个区块区间 |

## Variants

| Variant | 内核 | 付款方 / 收款方 | 金额 | 监管 | 状态 |
| --- | --- | --- | --- | --- | --- |
| [B.1](variant-1/README.zh-cn.md) | Poseidon 承诺与作废符，一个 join-split 电路（两进两出），Groth16 | 隐藏 | 隐藏 | 每笔交易都有 memo，在电路里强制 | 0.1.0-draft，仅设计 |
