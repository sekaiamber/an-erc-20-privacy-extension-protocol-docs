[English](10-wrapper.md) | 中文

# 10 家族工具：通用 Wrapper

状态：`Draft`（2026-09-27）。决策记录：[ADR-0005](adr/0005-family-wrapper.zh-cn.md)。

## 1. 它是什么

一个家族级的单一合约，让**没有公开账本的隐私代币**（Track B 以及将来任何形态不像 ERC-20 的 Variant）拥有一张面向 DeFi 的标准 ERC-20 面孔。它为每个底层代币发行一个普通 ERC-20 的*包装代币*（`wTOKEN`）；wrap 把价值从机密账本移到公开的包装代币，unwrap 移回去。

它是**工具，不是要求**：Track A 代币自带公开账本，永远用不到它；一个永远不需要进 DeFi 的 Track B 代币也不必注册。它与底层代币的关系就像 WETH 与 ETH。

## 2. 控制反转

Wrapper 定义接口；隐私代币通过实现接口并把 `WRAPPER_ROLE` 授予 wrapper 来接入。

```solidity
/// 想被包装的隐私代币实现此接口。`recipient` 对 wrapper 是不透明的：
/// 账户模型 Variant 传机密 id，note 模型 Variant 传 note / stealth 输出。
interface IPEPWrappable {
    /// Wrapper -> 代币。把公开金额 `amount` 记入机密 `recipient`。仅限已注册的 wrapper。
    function wrapperMint(bytes calldata recipient, uint256 amount) external;

    /// Wrapper -> 代币。验证 `payload`（Variant 定义的证明：`from` 的所有者放弃 `amount` 并指定公开地址 `to`），
    /// 扣减机密账本。`to` 与 `amount` 必须绑定在证明内（见 A.1 安全自审 F14）。仅限已注册的 wrapper。
    function wrapperBurn(address from, address to, uint256 amount, bytes calldata payload) external;

    function wrapper() external view returns (address);
}
```

```solidity
/// 每条链部署一份。不持有密钥、不持有机密状态、不可升级。
contract PEPWrapper {
    mapping(address token => WrappedERC20) public wrapped;     // 首次使用时创建（最小 ERC-20，只有 wrapper 能铸销）

    /// 机密 -> 公开。任何人可代为提交；wTOKEN 发给证明里绑定的 `to`。
    function wrap(address token, address from, address to, uint256 amount, bytes calldata payload) external {
        IPEPWrappable(token).wrapperBurn(from, to, amount, payload);   // 证明不通过或 msg.sender != wrapper 则 revert
        _wrapped(token).mint(to, amount);
        emit Wrapped(token, from, to, amount);
    }

    /// 公开 -> 机密。调用者销毁自己的 wTOKEN。
    function unwrap(address token, bytes calldata recipient, uint256 amount) external {
        _wrapped(token).burnFrom(msg.sender, amount);
        IPEPWrappable(token).wrapperMint(recipient, amount);
        emit Unwrapped(token, msg.sender, recipient, amount);
    }
}
```

`WrappedERC20` 是最小的 OpenZeppelin ERC-20：`name = "Wrapped " + 底层.name()`，`symbol = "w" + 底层.symbol()`，`decimals = 底层.decimals()`，`mint` / `burnFrom` 仅限 wrapper。没有 owner、没有钩子。

## 3. 为何是销毁-铸造而不是托管

合约不可能拥有一个机密账户：它没有私钥，也生成不了证明。所以 wrapper 无法像 WETH 锁 ETH 那样「锁住」机密代币。取而代之：wrap 在机密侧**销毁**并铸出凭证代币；unwrap 销毁凭证并在机密侧**铸回**（公开金额的铸造，与 Track A 的 shield 完全一样：退化密文 `(amount·G, 0)` 不需要密钥）。因此：

- `底层.totalSupply()` 只计机密部分；`wTOKEN.totalSupply()` 计公开部分；已发行总量 = 两者之和。两个数字都公开——已接受（ADR-0005 后果）。
- Wrapper 对代币唯一的特权是 `wrapperMint`，而 `wTOKEN.totalSupply() == Σ wrapperBurn − Σ wrapperMint` 是任何人都能从事件核对的不变量。

## 4. 对代币侧的安全要求

| # | 要求 | 原因 |
| --- | --- | --- |
| W1 | 销毁证明绑定 `to` 与 `amount`（以及一贯的 `from`、nonce、代币地址、链 id） | 否则中继者可改写收款地址（A.1 F14） |
| W2 | `wrapperMint` / `wrapperBurn` 检查 `msg.sender == wrapper()` | wrapper 是唯一允许铸造的一方 |
| W3 | `wrapper()` 由代币 admin 设置一次（或在构造时设置），变更需经 Variant 文档规定的时间锁 | 换 wrapper 等于换铸币者 |
| W4 | 两个方向的 `amount` 都遵守 Variant 的单笔与供应上限 | wrapper 自身不做范围检查 |

## 5. 信任与影响面

Wrapper 是共享的，它的一个 bug 就是所有注册代币的 bug。缓解：无 admin、无升级路径、除了两个接口函数和自己的 `WrappedERC20` 外无任何外部调用、范围小到一个下午能审完。想隔离的代币可以自己部署一份相同字节码的实例；接口不关心这一点。

## 6. 与两条 Track 的关系

| | Track A | Track B（+ wrapper） |
| --- | --- | --- |
| DeFi 看到的资产 | 代币本身 | wrapper 发行的 `wTOKEN` |
| 公开 ↔ 机密 | 内置 `0x03` / `0x04` | `unwrap` / `wrap` |
| 外部特权方 | 无 | wrapper（铸造） |
| 隐藏的内容 | 机密余额与金额 | 同；机密聚合量即 `底层.totalSupply()` |

两者是不同的集成方契约，这正是 Track 的边界（ADR-0002）。互不取代。

## 7. 待决

- `wrap` 是否也接受*已登记*的 payload（家族 §6），让拼不了 calldata 的钱包也能用。草案：接受——先调 `token.prepare`，再由 `wrap` 执行登记项。
- 中继者的费用钩子（它们为 `wrap` 付 gas）。草案：0.1 不做；中继费用链下结算或由 `to` 地址支付。
