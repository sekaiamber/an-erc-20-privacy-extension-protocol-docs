[English](README.md) | 中文

# Tracks

协议家族按 **Track / Variant / 模块** 组织（[ADR-0008](../adr/0008-modules.zh-cn.md)）：

- **Track**：一种状态模型加一种信任基础。一条路线只有在无法靠改 payload 类型、电路、客户端约定或模块在其它 Track 内做到，并且改变了集成方、用户或监管方必须知道的前提时，才是 Track（[ADR-0007](../adr/0007-track-definition.zh-cn.md)）。
- **Variant**：Track 之下的一套电路，也就是一个密码学内核以及它隐藏了什么。Variant 之间互不依赖，各自有独立版本号 `a.b.c`。Variant 序号表示它在所属 Track 内的开设顺序；不同 Track 的序号没有对应关系。
- **模块**：Variant 上的合约层选配，不改电路，例如公开账本或 Wrapper 端口。模块在 [07 §13](../07-family-conventions.zh-cn.md) 里全家族统一登记。一个代币就是一个 Variant 加一组模块，并通过探针报告它们。

| Track | 状态模型 | Variant | 状态 |
| --- | --- | --- | --- |
| [A](track-a/README.zh-cn.md) | 加密账户：每个账户一份同态密文余额 | [A.1](track-a/variant-1/README.zh-cn.md) Baby Jubjub 上的 ElGamal + Groth16 | **主线**；0.5.0，两种组合已上 BSC testnet |
| [B](track-b/README.zh-cn.md) | note 模型：一棵承诺树和一个作废符集合，没有账户 | [B.1](track-b/variant-1/README.zh-cn.md) Poseidon note，一个 join-split 电路，Groth16 | 合约与电路已在本地实现，尚未部署（[ADR-0009](../adr/0009-track-b-notes.zh-cn.md)） |

两个 Track 的信任基础相同：用户持有密钥，证明在客户端生成，不依赖外部网络。

## 各 Variant 版本声明支持的模块

| 模块 | A.1 0.5.0（设计） | B.1 0.1.0（设计） |
| --- | --- | --- |
| 公开账本 | 支持 | 不支持 |
| 角色铸造 | 支持 | 支持 |
| Wrapper 端口 | 支持 | 支持 |

这份清单是版本的一部分。以后登记的模块，这些版本都不支持；要支持就得给该 Variant 出新版本（07 §13.2）。A.1 0.5.0 已实现并部署；B.1 0.1.0 已在本地实现并通过测试，尚未部署。

## 已部署的组合

| 组合 | 公开账本 | 角色铸造 | Wrapper 端口 | 合约与描述符 | 文档 |
| --- | --- | --- | --- | --- | --- |
| A.1 带公开账本 | 有 | 有，铸到公开账本 | 无 | `A1LedgerToken`，`A:1:0.5.0` | [track-a/variant-1](track-a/variant-1/README.zh-cn.md) |
| A.1 纯隐私 | 无 | 有，铸到机密账户 | 有 | `A1PrivateToken`，`A:1:0.5.0` | [track-a/variant-1](track-a/variant-1/README.zh-cn.md) |

地址见 [A.1 部署记录](track-a/variant-1/03-deployments.zh-cn.md)。两个代币自报的描述符相同，靠 `pepModules()` 区分。

第二种组合当初是作为「Track B / B.1」开设的，在 2026-10-13 之前一直以这个名字发布，描述符为 `B:1:0.2.0`。那段时间的记录在 [track-a/variant-1-privacy-only](track-a/variant-1-privacy-only/README.zh-cn.md)。它不是上表里的 Track B。

纪律（ADR-0002 第 5 条）：在主线端到端跑通并给出 gas 数据之前，主线之外只允许一页纸草图。A.1 0.4.0 起这个条件已经满足（ADR-0009「背景」）。
