[English](README.md) | 中文

# Track A：加密账户

状态：`Draft`。结构按 [ADR-0008](../../adr/0008-modules.zh-cn.md)：Track、Variant、选配模块。

## 定义

| | |
| --- | --- |
| **状态模型** | 每个机密账户 id 在链上有一份余额，以同态密文保存。一笔转账要写出付款方的 id 和收款方的 id，并更新它们的密文 |
| **信任基础** | 密钥由用户持有，证明在客户端生成。没有任何外部网络持有密钥或在密文上计算 |

隐藏的是金额和余额。在所有 A.x 里始终可见的，是每笔转账的两个 id，因而也包括 id 之间的转账关系图。隐藏关系图的路线用的是另一种状态模型，属于另一个 Track（[Track B](../track-b/README.zh-cn.md)）。

## 一个 Track A 代币是怎么组成的

```
Track A        状态模型与信任基础
  └─ Variant   一套电路：密码学内核（A.1）
       └─ 模块  电路不变前提下的合约层选配（公开账本、角色铸造、Wrapper 端口）
```

每个 Variant 的基底都是**纯隐私账本**。代币在自己的地址上有没有公开余额、怎么发行、能不能被包装，都是模块（[07 §13](../../07-family-conventions.zh-cn.md)）。所以本 Track 的两个代币，`balanceOf` 和不带 payload 的 `transfer` 可能表现不同。集成方要读模块探针，不能从字母 A 推断。

## 集成方契约（所有 A.x 都遵守，与带哪些模块无关）

- 凡是移动价值的操作，都用 ERC-20 已有的 `transfer(address,uint256)` 与 `transferFrom(address,address,uint256)` 选择器。payload 放在 ABI 参数之后：`transfer` 从 `msg.data[68:]`、`transferFrom` 从 `msg.data[100:]` 读取。
- payload 第一字节是类型，第二字节是 flags。类型编号用家族统一的（07 §2）。
- **`to` / `from` 的含义由 payload 类型决定。** 协议不判断一个 20 字节值是钱包地址还是机密 id。
- 机密账户用一个 20 字节的 id 寻址。id 怎么派生由 Variant 定义。
- `0x01`，机密到机密：`transferFrom(id, id, handle)`。授权方式由 Variant 定义（A.1：零知识证明）；不检查 `msg.sender`。
- 机密转账的金额槽里放句柄，最高位为 1。凡是移动价值的操作都发标准 `Transfer` 事件；机密转账另发一个 Variant 定义的事件，写出两个 id，并携带收款方和监管方需要的内容。
- 不移动价值的操作是 Variant 自己的函数，不是转账（07 §1）。对无法携带附加数据的调用没有兜底：`prepare` 已撤销（07 §6）。
- 任何账户 id 的状态都可以通过 Variant 定义的视图以密文形式读出。
- `casata()` 与模块探针通过 ERC-165 暴露（07 §10、§13）。
- 监管接口同 07 §9。

## 模块对集成方意味着什么

| | 没有该模块 | 有该模块 |
| --- | --- | --- |
| **公开账本** | `balanceOf` 对所有地址返回 0。不带 payload 的 `transfer` 回退 `NoPublicLedger()`。`totalSupply()` 就是机密供应量 | 代币地址上有标准的 ERC-20 余额。`0x03` 与 `0x04` 一次调用即可在两个账本之间划转。`totalSupply()` 是公开余额加 `shieldedSupply()` |
| **角色铸造** | 不能铸造 | 铸造角色按公开金额发行；持有人按公开金额销毁 |
| **Wrapper 端口** | 代币不能被包装 | 家族 Wrapper 可以为它发行普通 ERC-20 的 `wTOKEN` |

## Variants

| Variant | 内核 | 收付方 | 金额 | 监管 | 声明支持的模块 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| [A.1](variant-1/README.zh-cn.md) | Baby Jubjub 上的 ElGamal + Groth16，账户 = 公钥 | 化名：id 稳定、可关联 | 隐藏 | 每笔转账的第三份密文，在电路里强制 | 0.6.0 声明支持：公开账本、角色铸造、Wrapper 端口 | 0.6.0；两种组合已部署到 BSC testnet |
