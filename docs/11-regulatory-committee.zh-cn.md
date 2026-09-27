[English](11-regulatory-committee.md) | 中文

# 11 家族工具：监管委员会

状态：`Draft`（2026-09-27）。决策记录：[ADR-0006](adr/0006-regulatory-committee.zh-cn.md)。与 [10-wrapper](10-wrapper.zh-cn.md) 并列的第二个家族工具，但**按项目或团队部署**，策略由团队自选。

## 1. 问题

现在的监管方是一把 Baby Jubjub 密钥：持有 `s_reg` 的人能解开该密钥下的所有转账金额（A.1 §2.4、家族约定 §9）。密码学原语是对的，运营形态是错的：一个秘密放在一处，没有成员、没有策略、没有「谁看过什么」的审计痕迹。

owner 的要求：*一个合约作为监管解密能力的保管方，随时能增减成员，成员按某种策略进行查看——多数票，或指定票 + 额外票且指定票自己不能解密；多种策略并存。*

## 2. 一个硬事实：合约保不住秘密

链上一切公开，任何合约都存不了 `s_reg`。合约能保管的是一把**没有人完整拥有的钥匙**：门限密钥。监管私钥拆成份额 `s_1 … s_n`；代币看到的是群公钥 `pk_reg`；解密需要 `t` 个成员各自贡献一份*部分解密*，合成过程中没有人得到 `s`。

我们的密文本来就门限友好。机密转账的金额由

```
v·G = C_amt − s·D_reg
```

恢复，而 `s·D_reg = Σ λ_i · (s_i·D_reg)`，对任意 `t` 份份额取 Lagrange 系数 `λ_i`：每个成员用自己的份额乘一个公开点，合成只是点加。没有成员需要 `s`。（memo 路径需要一处协议修订，见 §7。）

## 3. 委员会合约的职责

| 职责 | 链上 | 链下 |
| --- | --- | --- |
| **密钥保管** | `groupKey()`（= 代币的 `pk_reg`）、`epoch()`、当前分享的 Feldman 承诺 | 份额 `s_i` 在成员钱包中（按成员派生，从不导出） |
| **成员管理** | 成员集合、权重 / 角色、门限、策略合约、epoch 历史 | 成员间的分布式密钥生成与重分享协议 |
| **访问策略** | 什么样的审批足够：可插拔的 `IViewPolicy` | — |
| **申请与审计** | `request(scope, purpose)`、`approve(requestId, partial)`、`combined(requestId)`；每一步都是事件 | 部分解密的合成（免费）以及监管界面里真正的解密与余额重建 |
| **代币治理** | 持有代币的 `REGULATOR_ADMIN_ROLE`：`rotateRegulatorKey` 只经委员会 epoch 触发 | — |

代币不需要改动：保留家族约定 §9 的 `regulatorKey(keyId)` / `activeRegulatorKeyId` / `rotateRegulatorKey`；委员会只是持有 admin 角色、并把 `groupKey()` 登记为当前密钥的那个地址。

## 4. 协议

### 4.1 分布式密钥生成（DKG）

初始 `n` 个成员、门限 `t`，在 Baby Jubjub 标量域上做 Pedersen / Feldman DKG：

1. 每个成员 `i` 随机取一个 `t − 1` 次多项式 `f_i`，把各系数的 Feldman 承诺 `f_i(k)·H` 上链（`commit(epoch, i, C_i[])`），并把 `f_i(j)` 用成员 `j` 的钱包密钥加密后链下发给 `j`。
2. 每个成员用承诺校验收到的份额（客户端每个系数一次标量乘），上链 `ack` / `complaint`。
3. 确认窗口结束后，`s_i = Σ_j f_j(i)` 即成员 `i` 的份额，`pk_reg` 由链上承诺聚合得到（配合 §7 改为 `pk = s·H`，聚合就是点加）。合约据承诺计算 `groupKey()`——没有可信分发者，没有人见过 `s`。

Gas：每个成员 `t` 个点的承诺（一次性）；对投诉的链上裁决可选（投诉靠公开争议份额解决，只对作弊的分发者有意义）。

### 4.2 增减成员：重分享

任意 `t` 个现有成员发起一轮重分享：各自把份额 `s_i` 按新成员集 `n'`、新门限 `t'` 重新切成多项式，上链承诺、链下分发子份额；新份额是子份额的 Lagrange 加权和。**`pk_reg` 不变**，所以：

- 没有任何代币需要轮换密钥，所有历史密文对新委员会仍可解；
- 被移除成员的旧份额随分享多项式的更换而作废。免费得到前向 / 主动安全。

轮换 `pk_reg`（新 DKG + 各代币 `rotateRegulatorKey`）留给「份额疑似泄露、且团队希望历史密文只对旧委员会可解」的情形。

### 4.3 查看请求 → 审批 → 合成

```
request(token, scope, purposeHash)                 // scope：某个 id、一组交易或一段区块范围
approve(requestId, epoch, partial[])               // 成员 i 对 scope 中每个 D 提交 s_i·D（或其哈希）
combine(requestId) -> (s·D)[]                      // 策略满足后任何人可合成；链上或链下
```

部分解密附 **Chaum–Pedersen 证明**：`partial = s_i·D` 且与该成员已承诺的公开份额 `s_i·H` 一致（链上每份约两次标量乘，或链下验证、链上存哈希）。合成为 `Σ λ_i·partial_i`。全程留痕：谁申请、看什么、谁批、何时——这正是监管方自己通常必须保存的审计记录。

成本模型：链上验证每份 ≈ 2 × 8k gas 的点加（A.1 曲线库）加约两次标量乘（通用 `mul` 约 550k；给每个成员建固定基窗口表后约 80k）。批量查看时部分解密与证明走链下、链上只锚定哈希；逐笔链上验证留给高风险请求。

## 5. 策略 = 访问结构

合约调用可插拔的 `IViewPolicy.satisfied(requestId)`；**密码学结构必须与策略结构一致**，否则审批够了却解不开，或没审批够就能解。

| 策略 | 访问结构 | 分享方式 |
| --- | --- | --- |
| 多数票（`n` 中 `t`） | 门限 | 标量域上的 Shamir |
| 指定票 + 额外票，指定票自己不能解 | `s = a + b`；指定方持 `a`，其余成员对 `b` 做 `t`-of-`n` | 两个独立的 Shamir 实例；合成时把两个恢复出的点相加 |
| 加权 / 部门制 | 一般单调访问结构 | 线性秘密分享（LSSS）或复制分享；同一套 `approve` / `combine` 接口 |

团队在部署时选策略（或通过重分享升级到新结构）。多种策略的委员会并存；一个代币在任一时刻通过当前 `keyId` 绑定到恰好一个委员会。

## 6. 接口草图

```solidity
interface IRegulatorCommittee {
    function groupKey() external view returns (BabyJubjub.Point memory);   // = 代币当前的 pk_reg
    function epoch() external view returns (uint64);
    function isMember(address) external view returns (bool);
    function threshold() external view returns (uint32);                    // 或策略特有
    function policy() external view returns (address);                      // IViewPolicy

    function request(address token, bytes calldata scope, bytes32 purposeHash) external returns (uint256 requestId);
    function approve(uint256 requestId, bytes calldata partialsOrHash, bytes calldata proof) external;
    function combined(uint256 requestId) external view returns (bool ready);

    event MemberSetChanged(uint64 indexed epoch, address[] members, uint32 threshold);
    event ViewRequested(uint256 indexed requestId, address indexed token, address indexed by, bytes scope, bytes32 purposeHash);
    event ViewApproved(uint256 indexed requestId, address indexed member, uint64 epoch);
    event ViewReady(uint256 indexed requestId);
}
```

首批两个实现：`RegulatorCommittee`（Shamir）与 `RegulatorCommitteeDesignated`（两层），都放在 `contracts/contracts/family/`，与 wrapper 并列。

## 7. 需要的协议修订：memo 密钥改由 `r·H` 派生

A.1 的 memo 多用一个 ECDH 点 `E = e·H`，密钥流由 `e·pk = s⁻¹·E` 派生。打开它要算 `s⁻¹·E`——对共享秘密做*除法*，无法拆到份额上。改法（A.1 v0.4、B.1 v0.2）：

- 两份 memo 的密钥流都由 **`r·H`** 派生：发送方知道 `r`；收款方算 `s_recv·D_recv = r·H`；监管方算 `s_reg·D_reg = r·H`（门限友好）；
- 删掉 `E`、`e` 及相关约束与公开输入：转账电路少一次 251 位标量乘，公开输入 15 → 13，payload 少 64 字节；
- 同时把密钥约定改为 `pk = s·H`（普通 ElGamal / 标准 Baby Jubjub 密钥），DKG 聚合就是点加；解密仍是 `C − s·D`（twisted 形式只是把求逆挪了个位置）。

两份 memo 于是承载相同明文 `(v, r)`、密钥流来自同一个点；这是有意的（双方本来就该得到完全相同的信息），而 `r` 每笔新鲜，密钥流仍是一次性的。

## 8. 监管界面

dapp 的监管视图分两种模式：**单密钥**（粘贴 `s_reg`，全部解开，即现设计）与**委员会**（成员用钱包登录、派生自己的份额，为某个请求提交部分解密，或把已提交的部分解密合成为解密表）。按 id 重建余额的代码两种模式共用。

## 9. 待决

- 链上 Chaum–Pedersen 验证是强制还是按请求可选（草案：可选，默认只锚定哈希）。
- 份额派生：像账户密钥一样由成员钱包 EIP-712 派生（草案：是，成员永远不必保存文件），DKG 记录可由链上数据 + 成员钱包重建。
- 委员会是否也可持有 Track B 代币的 `MINTER_ROLE`（草案：否——发行与监督分离）。
