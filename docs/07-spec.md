# 07 规范草案

状态：`Draft`

> 本文只给出接口层面的占位框架，具体参数、编码与语义在架构选型完成后填充。

## 接口命名

暂定扩展接口名为 `IERC20PrivacyExtension`，与 `IERC20` 并列实现于同一合约，或由独立扩展合约实现并持有代币。

## 扩展接口（草案）

```solidity
interface IERC20PrivacyExtension {
    /// 把公开余额转入隐私状态
    function shield(bytes calldata shieldData) external;

    /// 隐私状态内转账
    function privateTransfer(bytes calldata proof, bytes calldata publicInputs) external;

    /// 把隐私余额转回公开状态
    function unshield(bytes calldata proof, bytes calldata publicInputs, address to, uint256 amount) external;

    /// 当前隐私池托管的代币总量（用于总量守恒验证）
    function shieldedSupply() external view returns (uint256);

    event Shielded(address indexed from, uint256 amount, bytes32 commitment);
    event PrivateTransfer(bytes32 indexed nullifier, bytes32 commitment);
    event Unshielded(address indexed to, uint256 amount, bytes32 nullifier);
}
```

事件字段的取舍本身就是隐私设计的一部分，例如 `PrivateTransfer` 事件是否应包含任何 indexed 字段，将在威胁模型评审后决定。

## 不变量

| 编号 | 不变量 |
| --- | --- |
| I1 | `shieldedSupply() == Σ shield 金额 − Σ unshield 金额` |
| I2 | `totalSupply() == Σ balanceOf(公开地址) + shieldedSupply()` |
| I3 | 每个 nullifier 最多被使用一次 |
| I4 | 每次 privateTransfer 的输入 note 总额等于输出 note 总额 |

## 数据结构（待定）

- Note / 承诺格式
- 加密 note 的封装格式（供接收方与查看密钥解密）
- 证明的公开输入布局

## 版本

规范采用语义化版本，`0.x` 期间接口可随时变动。
