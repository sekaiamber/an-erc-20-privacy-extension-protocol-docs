[English](0005-family-wrapper.md) | 中文

# 0005 家族级 Wrapper 是工具，不取代 Track A

- 状态：Accepted
- 日期：2026-09-27
- 范围：家族

## 背景

Track B 代币没有公开账本，因此进不了任何 DeFi 协议。owner 要求一个通用机制，把这类代币（以及将来任何形态不像 ERC-20 的 Variant）映射成公开 ERC-20，并做控制反转：机制定义接口、代币接入，全家族只写一次。

两个事实决定了方案。合约无法持有机密账户（没有密钥、出不了证明），所以包装只能是销毁-铸造，不能是托管。而任何公开面孔都会重新引入公开聚合量：`wTOKEN.totalSupply()` 加上底层的 `totalSupply()` 就暴露了供应量如何划分——与 Track A 暴露的信息相同。

## 决策

1. 新增 [10-wrapper](../10-wrapper.zh-cn.md)：代币实现接口 `IPEPWrappable`（`wrapperMint`、`wrapperBurn`、`wrapper`）；每条链一份 `PEPWrapper` 合约，为每个底层代币发行一个最小的 `WrappedERC20`。
2. Wrapper 是**家族工具**。Track A 保留内置的 `0x03` / `0x04`，不注册到 wrapper。Track B 的 Variant 在自己的设计里说明其 `IPEPWrappable` 实现（B.1 §13）。
3. `wrapperBurn` 用的销毁证明必须绑定公开收款地址与金额（安全自审 F14）。Variant 可以复用已经做到这点的现有电路（B.1 复用 A.1 的 unshield 电路）。
4. 包装带来的公开聚合量已接受；它与 Track A 的暴露相同，是进 DeFi 的代价。需要隐藏聚合量的代币不 wrap 即可。

## 备选方案

- 用 wrapper 取代 Track A 的内置划转：否——DeFi 会看到每种资产两个地址，每个 Track A 代币都多一个外部特权铸币者，而且已验证的 A.1 划转路径被白白丢掉，隐私上没有任何收益。
- 每个代币各自一份 wrapper 合约：允许（相同字节码、自行部署），供需要隔离的代币使用；共享实例仍是默认。
- 托管模型（wrapper 持有机密代币）：不可能，见背景。

## 后果

- 多一份家族文档（10），实现后在 `contracts/contracts/family/` 多两个小合约。
- Track B 代币获得 DeFi 通道，代价是公开聚合量与对 wrapper `wrapperMint` 的信任。
- 共享合约就是共享影响面：wrapper 必须保持最小、无 admin、不可升级。
