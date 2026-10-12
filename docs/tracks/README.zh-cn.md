[English](README.md) | 中文

# Tracks

协议家族按 **Track / Variant / 模块** 组织（[ADR-0008](../adr/0008-modules.zh-cn.md)）：

- **Track**：一种状态模型加一种信任基础。一条路线只有在无法靠改 payload 类型、电路、客户端约定或模块在其它 Track 内做到，并且改变了集成方、用户或监管方必须知道的前提时，才是 Track（[ADR-0007](../adr/0007-track-definition.zh-cn.md)）。
- **Variant**：Track 之下的一套电路，也就是一个密码学内核以及它隐藏了什么。Variant 之间互不依赖，各自有独立版本号 `a.b.c`。Variant 序号表示它在所属 Track 内的开设顺序；不同 Track 的序号没有对应关系。
- **模块**：Variant 上的合约层选配，不改电路，例如公开账本或 Wrapper 端口。模块在 [07 §13](../07-family-conventions.zh-cn.md) 里全家族统一登记。一个代币就是一个 Variant 加一组模块，并通过探针报告它们。

| Track | 状态模型与信任基础 | Variant | 状态 |
| --- | --- | --- | --- |
| [A](track-a/README.zh-cn.md) | 加密账户：每个账户一份同态密文余额，用户持有密钥，证明在客户端生成 | [A.1](track-a/variant-1/README.zh-cn.md) Baby Jubjub 上的 ElGamal + Groth16 | **主线**；两种组合已上 BSC testnet |

A.1 已部署的组合：

| 组合 | 公开账本 | 角色铸造 | Wrapper 端口 | 目前的合约与描述符 | 文档 |
| --- | --- | --- | --- | --- | --- |
| 带公开账本 | 有 | 有，铸到公开账本 | 无 | `ConfidentialERC20A1`，`A:1:0.4.0` | [track-a/variant-1](track-a/variant-1/README.zh-cn.md) |
| 纯隐私 | 无 | 有，铸到机密账户 | 有 | `ConfidentialERC20B1`，`B:1:0.2.0` | [track-b/variant-1](track-b/variant-1/README.zh-cn.md) |

第二种组合当初是作为「Track B / B.1」开设的。在合约重构完成之前（ADR-0008「过渡」），它在合约、dApp 和文档目录里沿用这个名字。字母 B 目前没有分配给任何路线。

纪律：只有主线 Variant 有实现。其它 Track / Variant 在主线端到端跑通并给出 Gas 数据前，只允许存在一页纸设计草图。
