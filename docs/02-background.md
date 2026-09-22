# 02 背景知识

状态：`Draft`

## ERC-20 回顾

ERC-20（[EIP-20](https://eips.ethereum.org/EIPS/eip-20)）定义了同质化代币的最小接口：

```solidity
function totalSupply() external view returns (uint256);
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 amount) external returns (bool);
function allowance(address owner, address spender) external view returns (uint256);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);

event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
```

隐私相关的关键观察：

- `balanceOf` 是公开的 view 函数，余额对所有人可见。
- `Transfer` 事件把 `from`、`to`、`value` 三个字段全部写入日志，且 `from`/`to` 是 indexed，方便索引器按地址检索。
- 账户模型（而非 UTXO 模型）意味着一个地址的全部历史天然关联在一起。

## 隐私泄露的层次

在 EVM 上，一笔 ERC-20 转账至少泄露以下信息：

| 层次 | 泄露内容 | 观察者 |
| --- | --- | --- |
| 交易本身 | 发送方 EOA、目标合约、calldata（含 `to`、`amount`） | 所有节点、区块浏览器 |
| 合约状态 | `balanceOf` 的变化 | 任何读取状态的人 |
| 事件日志 | `Transfer(from, to, value)` | 索引器、分析公司 |
| Gas 支付 | 谁为交易付费（通常等于发送方） | 所有节点 |
| 网络层 | 交易广播来源 IP | 对等节点、mempool 观察者 |

隐私扩展协议主要处理前四层；网络层不在范围内（见 [01 概述](01-overview.md)）。

## 隐私的三个维度

后续文档中会反复用到这三个维度：

1. **金额隐私（Amount privacy）**：隐藏转账金额与账户余额。
2. **身份隐私（Sender / Receiver privacy）**：隐藏收付双方的链上身份，或至少切断它们与真实身份的关联。
3. **关联隐私（Linkability）**：隐藏同一用户多笔交易之间的关联，防止图分析。

不同的技术手段覆盖的维度不同，例如：

- 隐匿地址（stealth address）主要解决接收方身份隐私，不隐藏金额。
- 同态加密（FHE）或 Pedersen 承诺主要解决金额隐私。
- 零知识证明 + 承诺集合（如 Zcash 风格的 shielded pool）可以同时覆盖三个维度。

## 相关基础密码学原语

以下原语会在方案调研与设计中出现，术语表见 [glossary.md](glossary.md)：

- 承诺（Commitment）：Pedersen 承诺、哈希承诺
- 零知识证明：Groth16、PLONK 系列、STARK
- Merkle 树 / 增量 Merkle 树
- 全同态加密（FHE）
- 椭圆曲线 Diffie-Hellman（用于 stealth address）
