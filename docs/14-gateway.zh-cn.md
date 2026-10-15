[English](14-gateway.md) | 中文

# 14 家族工具：网关

状态：`Prototype`（2026-10-15）。决策记录：[ADR-0013](adr/0013-mintable.zh-cn.md) 第 5 条。实现：`contracts/contracts/family/CasataGateway.sol`，已在本地针对 A.1 0.7.0 测试（`test/family/CasataGateway.ts`：用 view 核对 §4 的设置，一次铸造路径和一次 `wrapperMint` 路径的存入，一次取回到证明绑定的收款人，gas 584,500，以及 unshield 证明在网关被拒）。尚未部署。它需要可增发模块和 Wrapper 端口，所以服务 A.1 0.7.0 和 B.1 0.3.0。B.1 的路径也已测试（`test/track-b/variant-1/B1Compositions.ts`：用存入者的 join-split 存入，取回到证明绑定的收款人）。

## 1. 它是什么

一个家族合约，用来做**已有 ERC-20 的隐私版本**。用户把已有代币（*底层代币*，例如 USDT）锁进网关，得到等额的一个 Casata 代币的机密余额。任何持有机密余额的人都可以再把它取出来：网关销毁这笔机密余额，把底层代币放给持有人证明里绑定的收款人。

代币通过两个已有的模块接入网关（[07 §13.1](07-family-conventions.zh-cn.md)）：

| 模块 | 网关拿它做什么 |
| --- | --- |
| 可增发 | 网关持有 `MINTER_ROLE`，收到多少就铸多少 |
| Wrapper 端口 | 网关是代币的 `wrapper()`。`wrapperBurn` 是它的出口，`wrapperMint` 是从它出去的价值回来的入口 |

按 [ADR-0008](adr/0008-modules.zh-cn.md) 的说法，它和 [Wrapper](10-wrapper.zh-cn.md) 一样是插在 Wrapper 端口上的运行时模块，同时还持有代币的铸造角色。它是工具，不是模块：没有为它登记模块，代币也不知道自己接的是网关。

**每对一个实例。** 每个网关只服务一个底层代币和一个 Casata 代币，两者都在构造函数里固定。它没有 owner、没有管理员、不能暂停、不能升级。Wrapper 不持有任何东西，一次部署服务链上所有代币；网关则**持有真实资产**，也就是锁进来的全部底层代币。把所有配对放进一个合约，就是把所有配对的抵押品放在同一个 bug 后面。想要网关的代币用家族的字节码部署自己的一个。

## 2. 接口

```solidity
/// 每个 (underlying, token) 部署一个。持有锁定的底层代币；没有 owner，不可升级。
contract CasataGateway {
    IERC20  public immutable underlying;
    address public immutable token;     // 一个 Casata 代币，它的 wrapper() 就是本合约
    uint256 public immutable scale;     // 10 ** (underlying.decimals() - token.decimals())

    /// 公开 -> 机密。`amount` 以代币单位计；网关拉取 `amount * scale` 的底层代币。
    /// `recipient` 是 Variant 记入的对象：A.1 是一个 id，B.1 是一个创建 note 的 join-split 载荷。
    function deposit(uint256 amount, bytes calldata recipient) external {
        uint256 before = underlying.balanceOf(address(this));
        underlying.safeTransferFrom(msg.sender, address(this), amount * scale);
        require(underlying.balanceOf(address(this)) - before == amount * scale);   // 不接受转账扣费
        if (amount <= ICasataWrappable(token).wrappedOut()) {
            ICasataWrappable(token).wrapperMint(recipient, amount);                // 从这里出去过的价值
        } else {
            _mint(recipient, amount);                                               // 新供应，可增发
        }
        emit Deposited(msg.sender, amount);
    }

    /// 机密 -> 公开。任何人都可以代为提交；款项付给证明里绑定的 `to`。
    function withdraw(address from, address to, uint256 amount, bytes calldata payload) external {
        ICasataWrappable(token).wrapperBurn(from, to, amount, payload);   // 证明没有绑定 `to` 和 `amount` 就回滚
        underlying.safeTransfer(to, amount * scale);
        emit Withdrawn(from, to, amount);
    }
}
```

- **金额以代币单位计。** 调用方给出代币要记入的数额，网关正好拉取 `amount × scale` 的底层代币。没有零头，所以不存在要退还或拒绝的余数。
- **转账扣费。** 网关量一下实际到账多少。不等于 `amount × scale` 就回滚。
- **走哪条记入路径。** 从网关出去过的价值可以经 `wrapperMint` 回来，上限是 `wrappedOut`；只有超出的部分才铸造。这样循环使用，`issuedSupply()`（已铸减已销毁，04-modules §3）不会随每一次往返增长，总量上限衡量的就是同一时刻锁定过的最大量，而不是累计流水。`wrappedOut()` 是两个 Variant 的 Wrapper 端口都有的 view，不在 `ICasataWrappable` 里，家族 Wrapper 用不到它。
- **`_mint` 因 Variant 而异。** 网关在构造函数里读 `casata()`，只接受它认识的 Variant：

  | Variant | `deposit` 的 recipient | 铸造调用 | `withdraw` |
  | --- | --- | --- | --- |
  | A.1 0.7.0、0.8.0 | 20 字节的 id | `mint(id, amount)`，载荷 `0x82 00` | `wrapperBurn(id, to, amount, payload)`；证明通过 `r` 绑定 `to`（[A1-0007](adr/a1-0007-exit-kind-binding.zh-cn.md)） |
  | B.1 0.3.0、0.4.0 | `v_pub_in = amount` 的 join-split 载荷 | `mint(token, amount)`，带这个载荷 | `wrapperBurn(0x0, to, amount, payload)`，`v_pub_out = amount` |

  两个 Variant 的 `wrapperMint` 都原样接收 recipient。以后新开的 Variant 需要一个认识它铸造编码的网关版本。
- **事件。** `Deposited(sender, amount)` 和 `Withdrawn(from, to, amount)`，另外还有代币自己的 `Transfer`、`Minted`、`WrapperMinted`、`WrapperBurned`。

## 3. 精度与上限

`scale = 10^(d − t)`，`d` 是底层代币的小数位，`t` 是代币的小数位。从 A.1 0.8.0 和 B.1 0.4.0 起，代币在部署时选小数位（[ADR-0014](adr/0014-eighteen-decimals.zh-cn.md)），所以网关代币按底层代币的小数位部署：`t = d`，`scale = 1`，不丢任何零头。A.1 到 0.7.0、B.1 到 0.3.0 为止都是 6 位小数（[A1-0005](adr/a1-0005-numeric-parameters.zh-cn.md)；B.1 01-design §2），所以 `scale = 10^(d − 6)`。

| 底层代币 | `d` | 代币 | `scale` | 最小存入 | 单笔最大 | 同一时刻最多锁定 |
| --- | --- | --- | --- | --- | --- | --- |
| BSC 上的 USDT | 18 | A.1 0.8.0 或 B.1 0.4.0，`t = 18` | 1 | 10⁻¹⁸ USDT | 即总量上限 | 约 3.4 × 10²⁰ USDT（上限 `2¹²⁸ − 1` 单位） |
| 以太坊上的 USDT、USDC | 6 | A.1 0.8.0 或 B.1 0.4.0，`t = 6` | 1 | 1 个单位 | 即总量上限 | 约 3.4 × 10³² |
| BSC 上的 USDT | 18 | A.1 0.7.0 或 B.1 0.3.0，`t = 6` | 10¹² | 0.000001 USDT | A.1 约 2.81 亿（`< 2⁴⁸` 单位）；B.1 即总量上限 | 约 18.4 万亿 USDT（上限 `2⁶⁴ − 1` 单位） |
| 以太坊上的 USDT、USDC | 6 | A.1 0.7.0 或 B.1 0.3.0 | 1 | 1 个单位 | A.1 约 2.81 亿；B.1 即总量上限 | 约 18.4 万亿 |

- **精度。** `scale > 1` 时，低于 `10^(−t)` 个代币的数额存不进去。钱包向下取整，把零头留在用户账户里，不会发给网关。
- **代币小数位多于底层代币。** 构造函数回滚：scale 会小于 1。从 0.8.0 起，部署者选 `t = d` 就能避开。小数位超过 18 的底层代币，用 `t = 18`，scale 大于 1。到 0.7.0 / 0.3.0 为止，这就是「底层代币少于 6 位小数」的情形，这样的底层代币很少（GUSD 是 2 位）。
- **A.1 的单笔上限**和任何公开金额一样适用于 `deposit` 与 `withdraw`（04-modules §2）：到 0.7.0 为止是 `< 2⁴⁸`，更大的数额由钱包拆开；从 0.8.0 起是 `< 2¹²⁸`，也就是总量上限。

## 4. 抵押与信任

**不变量。** `underlying.balanceOf(gateway) ≥ scale × token.totalSupply()`。

只要代币供应的每个单位都是经存入进来的，它就成立：

| 操作 | 网关持有量（代币单位） | `totalSupply()` |
| --- | --- | --- |
| `deposit`（任一记入路径） | `+x` | `+x` |
| `withdraw` | `−x` | `−x` |
| 机密转账、折叠、`0x03` / `0x04` | 0 | 0 |
| 持有人销毁（`0x81`，按 ADR-0013 属于核心） | 0 | `−x` |

持有人销毁就是放弃自己的索取权，对应的底层代币永远留在网关里，不变量于是带着余量成立。`wrappedOut` 不出现在不变量里：它只说明有多少可以经 `wrapperMint` 回来。

**条件**（ADR-0013 第 5 条）。不变量是网关和角色设置的性质，不是代币强制的：

| # | 条件 | 原因 |
| --- | --- | --- |
| G1 | `token.wrapper() == gateway` 且 `gateway.token() == token` | 出口必须放出底层代币 |
| G2 | 网关是 `MINTER_ROLE` 的唯一持有者 | 任何别的铸造者都能发行无抵押的供应 |
| G3 | 没有人持有 `DEFAULT_ADMIN_ROLE`（部署设置完成后放弃） | 管理员以后可以授予 `MINTER_ROLE` |
| G4 | 初始发行量为零 | 那部分不是存进来的 |

设置分四步：部署代币，带可增发和 Wrapper 端口，初始发行量为零，不设铸造者；部署网关；`setWrapper(gateway)` 并 `grantRole(MINTER_ROLE, gateway)`；`renounceRole(DEFAULT_ADMIN_ROLE)`。持有 `REGULATOR_ADMIN_ROLE` 的人保留它，仍能轮换监管密钥（07 §9）；放弃管理员之后，没有人能再授予或撤销这个角色。

**前端能检查什么。** A.1 0.7.0 和 B.1 0.3.0 用的是 OpenZeppelin `AccessControlEnumerable`，能列出一个角色的成员。更早的版本用 `AccessControl`，不能。

| 检查 | 方法 | 覆盖范围 |
| --- | --- | --- |
| G1 | `wrapper()`、`gateway.token()` | 完全，用 view |
| 当前的不变量 | `underlying.balanceOf(gateway)`、`scale`、`totalSupply()` | 到目前为止发行的全部，包括 G4 |
| G2、G3 | `getRoleMemberCount(MINTER_ROLE) == 1` 且 `getRoleMember(MINTER_ROLE, 0) == gateway`，以及 `getRoleMemberCount(DEFAULT_ADMIN_ROLE) == 0`。更早的版本：从代币部署的区块起重放 `RoleGranted` / `RoleRevoked` | A.1 0.7.0 和 B.1 0.3.0 起完全用 view 核对；之前要扫日志 |

三项都通过，前端才把代币称为*有抵押*。扫不了日志时，只单独显示不变量的检查结果。

**仍然存在的信任。**
- **底层代币的发行方。** USDT 和 USDC 可以冻结地址。网关的余额一旦被冻结，所有持有人同时失去抵押。网关无法防止这一点。对有黑名单的底层代币，前端要指出这个风险。
- **网关的代码。** 抵押品在它手里。它保持很小：两个函数，没有管理员，除了底层代币和代币本身不调用任何外部合约。

## 5. 带公开账本时

在带公开账本模块的代币上，持有人还可以 unshield 成这个 Casata 代币本身的公开余额。这样隐私版本有三种形态：底层代币、代币的公开余额、代币的机密余额。代币的公开余额可以像任何 ERC-20 一样进 DeFi。

在 A.1 上，这个组合有两个收款人非零的出口：`0x04` 和 `wrapperBurn`。它需要 0.7.0，那里的证明绑定了它是给哪个出口的（[A1-0007](adr/a1-0007-exit-kind-binding.zh-cn.md)）。没有这一条，中继者可以把持有人的 unshield 变成取出底层代币，或者反过来。B.1 没有公开账本。

## 6. 它不做什么

- **不收费。** 存入和取出只花 gas。代为提交 `withdraw` 的中继者在链下结算，和 Wrapper 一样（10 §7）。
- **不支持变基或转账扣费的底层代币。** 转账扣费在存入时会被拦下。变基余额拦不下，会破坏不变量。这类代币不支持。
- **不能暂停，没有白名单，没有回收。** 网关拦不住任何人；除了经 `withdraw`，谁也拿不走抵押品。

**隐私。** 存入是一条从钱包到 id（A.1）或到新 note（B.1）的公开边，取出是一条到钱包的公开边，两者的金额都公开。暴露程度和 wrap、unwrap 相同（A.1 01-design §2.1）。两者之间发生的事保持隐藏。钱包要提醒用户：存入后不久取出同样的数额，会把两者联系起来。

## 7. 与 Wrapper 的关系

| | Wrapper（[10](10-wrapper.zh-cn.md)） | 网关 |
| --- | --- | --- |
| 方向 | 机密价值出去成为公开的包装代币，再回来 | 已有的公开代币进来成为机密价值，再回来 |
| 持有资产 | 否：两边都是销毁加铸造 | 是：锁定的底层代币 |
| 部署 | 每条链一个，服务所有代币 | 每对（底层代币，代币）一个 |
| 需要代币的哪些模块 | Wrapper 端口 | Wrapper 端口和可增发 |
| 约束它的是什么 | `wrappedOut` | `wrapperMint` 受 `wrappedOut` 约束，`mint` 只受总量上限约束；抵押靠 G1 到 G4 |

两者插在同一个端口上，而一个代币只有一个 `wrapper()`，只能设一次。所以接网关的代币没有 `wTOKEN`。它也不需要：底层代币本来就是公开形态，带公开账本时代币本身也是。

## 8. dApp 里

两处，都于 2026-10-15 加入。

- **工坊里的工具**（`/tools/gateway`）。设置：读者给出一个 Casata 代币和一个已有的 ERC-20；页面检查代币是不是带可增发和 Wrapper 端口、端口还空着的 A.1 0.8.0 或 B.1 0.4.0（发布之前，dApp 只支持最新版本），为这一对部署一个网关，然后把 §4 的步骤一项一项列出来，每项按链上状态显示完成与否：把网关插进端口、授予它 `MINTER_ROLE`、收回其他人的这个角色、放弃管理员角色。核对：对任何网关地址，页面显示这一对代币、换算倍数、条件 G1 到 G4 和不变式，全部成立时才称代币有足额抵押。
- **代币页。** 代币 Wrapper 端口里的模块是网关时（它的 `token()` 就是这个代币），wrap 和 unwrap 两个标签页变成取回和存入底层代币。取回用的是 wrap 的证明，发给 `withdraw`；存入先授权底层代币，再用读者的 id（A.1）或给读者密钥的 join-split（B.1）调用 `deposit`。带公开账本的 A.1 页面没有 wrap 标签页，所以带公开账本的网关代币暂时不在页面上取回。

## 9. 待定

- **列出角色成员。** 2026-10-15 已定：A.1 0.7.0 和 B.1 0.3.0 使用 OpenZeppelin `AccessControlEnumerable`（A.1 04-modules M12，B.1 01-design D10），G2 和 G3 在这些版本上就是 view 调用（`getRoleMemberCount`、`getRoleMember`）。更早版本的代币仍需扫日志。
- **少于 6 位小数的底层代币。** 已由 ADR-0014 在 A.1 0.8.0 和 B.1 0.4.0 中解决：代币用底层代币的小数位（§3）。
- **每个 Variant 的铸造编码。** 网关得知道每个 Variant 怎么铸造（§2）。如果家族规定带载荷的 `mint` 接受和 `wrapperMint` 相同的 recipient 字节，网关就与 Variant 无关了。
- **一步完成设置。** 一个工厂合约可以在一笔交易里部署网关并配好角色。在那之前，前端检查最终状态（§4），而不是检查步骤。这个工厂不能在同一笔调用里部署 B.1 代币：B.1 的初始发行带一个绑定代币地址的证明，而 `CREATE2` 部署在自己的初始化代码确定之前无法知道这个地址（B.1 01-design D9）。
