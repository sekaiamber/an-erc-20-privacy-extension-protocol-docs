# Tracks

协议家族按 **Track / Variant** 组织：

- **Track**：集成方（钱包、DEX、浏览器）看到的接口契约与账本拓扑。同一 Track 下的所有 Variant 对集成方表现一致。
- **Variant**：Track 之下的一种具体机制实现，各自自包含，互不依赖。每个 Variant 独立版本号 `a.b.c`。

| Track | 机制 | Variant | 状态 |
| --- | --- | --- | --- |
| [A](track-a/README.md) | 双账本：公开账本 + 机密账本 | [A.1](track-a/variant-1/README.md) ElGamal 加密账户 + SNARK | **主线，设计中** |
| [B](track-b/README.md) | 纯机密：无公开账本 | — | 占位 |

纪律：只有主线 Variant 有实现。其它 Track / Variant 在主线端到端跑通并给出 Gas 数据前，只允许存在一页纸设计草图。
