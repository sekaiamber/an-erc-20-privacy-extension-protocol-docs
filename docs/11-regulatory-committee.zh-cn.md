[English](11-regulatory-committee.md) | 中文

# 11 家族工具：监管委员会

状态：`Prototype`（2026-09-29；设计于 2026-09-27）。合约、客户端、测试与 BSC testnet 实跑均已完成，见 §9。决策记录：[ADR-0006](adr/0006-regulatory-committee.zh-cn.md)。与 [10-wrapper](10-wrapper.zh-cn.md) 并列的第二个家族工具，但**按项目或团队部署**，策略由团队自选。

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
| **密钥保管** | `groupKey()`（= 代币的 `pk_reg`）、各届次、每届成员的委员会公钥、以 `Dealt` 事件形式存放的 Feldman 承诺与加密份额 | 份额：需要时由链上数据 + 成员钱包恢复（从不保存） |
| **成员管理** | 每届的分组（阈值 + 成员）、提案与投票、分发 / 确认 / 异议状态 | 分发与份额校验 |
| **访问策略** | 分组 AND：一次查看需要每组都有 `threshold(g)` 名成员 | — |
| **请求与审计** | `request`、`approve`、`ViewReady`；每一步都是事件，每次分发、批准、请求所在区块都记录在链上 | 部分解密（加密给请求人）、校验、合成与解密结果表 |
| **代币治理** | `bindToken`：用代币管理员授予的 `REGULATOR_ADMIN_ROLE` 把代币的监管公钥轮换为 `groupKey()` | — |

代币不需要改动：`regulatorKey(keyId)` / `activeRegulatorKeyId` / `rotateRegulatorKey` 与约定 §9 完全一致；委员会只是一个持有该管理角色、其 `groupKey()` 被设为当前密钥的地址。

## 4. 协议

记号：`H` 是密钥生成元（`pk = s·H`，普通 ElGamal，§7）。秘密 `s = Σ_g s_g`；第 `g` 组以阈值 `t_g` 持有 `s_g` 的 Shamir 分享。成员序号是其在组内的位置（从 1 开始）。每位成员有一把**委员会密钥** `(x, X = x·H)`，由成员钱包对域 `(PEP, 1, chainId, committee)`、用途 `"Regulator committee key"` 的 EIP-712 签名派生，并通过 `registerKey(X)` 登记。

**份额投递。** 分发者取随机 `k`，公布 `K = k·H`，对接收者 `j` 公布 `enc_j = f(j) + Poseidon(Poseidon(k·X_j), j) mod p`。接收者 `j` 用 `x_j·K` 算出同一个掩码。因此份额以密文形式存在链上；成员随时从钱包重新派生密钥并恢复份额。

### 4.1 创世：分布式密钥生成（DKG）

构造函数确定创世分组。第 1 届先等所有成员登记密钥（`Registering`），然后快照这些公钥并开始分发。

1. 第 `g` 组的每位成员 `d` 取一个 `t_g − 1` 次随机多项式 `f_d`，公布 Feldman 承诺 `f_d(k)·H` 以及发给本组的加密份额（`deal`）。合约把 `f_d(0)·H` 累加进组分量 `pk_g`。
2. 每组都分发完毕后，每位成员恢复 `x_j = Σ_d f_d(j)`，逐个核对子份额与对应承诺（`f_d(j)·H = Σ_k j^k·C_d[k]`），并检查所有承诺点都在素数阶子群内。然后 `ack`；或 `complain`，本届即失败，`restart()` 以相同配置在新届次号下重试。
3. 最后一个确认生效本届：`groupKey = Σ_g pk_g`，链上检查它是素数阶子群内的非单位元点。全程没有人持有 `s`。

### 4.2 成员变更：组公钥不变的重分享

1. 在任成员 `propose` 新分组（每个委员会的组数固定；被提名成员必须已登记密钥）。成员 `vote`；**当前每组的投票都达到阈值**时提案通过，与查看规则相同。新一届随即开始。
2. 每组由当前届的前 `t_g` 名成员分发：分发者 `d` 用一个符合新组次数的新多项式 `f_d` 重新分享自己当前的份额，`f_d(0) = x_d`。
3. 新成员 `j` 恢复 `x'_j = Σ_d λ_d · f_d(j)`（`λ_d` 为分发者旧序号上的 Lagrange 系数），校验每个子份额，并校验每位分发者的常数项承诺等于其旧公开份额 `x_d·H`（可由上一届承诺算出）。最后一个确认生效本届。

`groupKey()` 不变，代币无需轮换密钥，所有历史密文新委员会照样能解。旧届开出的请求不再接受批准。

**主动安全的边界。** 份额可由链上数据 + 钱包恢复，被移除的成员仍能重建自己在旧届的份额。因此旧届中（每组）任意 `t_g` 人合谋，仍可在链下解密。重分享把成员移出的是*受审计的流程*，而不是旧法定人数合谋的能力。怀疑泄露时应改用轮换：新建委员会（新 DKG）并在每个代币上 `bindToken`；过去的密文只在旧密钥下可读。

### 4.3 查看请求 → 批准 → 合成

```
request(token, fromBlock, toBlock, account, purpose)   // 任一在任成员；purpose 明文写入事件
approve(requestId, K, blob)                             // 请求所在届的成员，且该届仍在任
ViewReady(requestId)                                    // 每组都达到 t_g 份批准时
```

**范围。** `token` 在 `[fromBlock, toBlock]` 内所有 `regKeyId` 对应 `groupKey()` 的 `ConfidentialTransfer` 与 `ConfidentialTransferPrepared` 事件；可只取 `account` 为发送方或接收方的；按 `(block, logIndex)` 排序。每位成员都从链上数据自行推导这份列表 `D_1 … D_m`，没人能塞进非真实转账的点。

**部分解密。** 成员 `i` 计算 `P_ij = x_i·D_j`，并对所有 `j` 给出一个批量 Chaum–Pedersen 证明，证明 `log_H X_i = log_{D_j} P_ij`：随机权重 `ρ_j = Poseidon(seed, j)` 聚合出 `D* = Σ ρ_j D_j`、`P* = Σ ρ_j P_j`，一个 DLEQ 证明 `(c, z)` 覆盖全部。Fiat–Shamir 种子绑定 `(chainId, committee, requestId, X_i, D_1..m, P_1..m)`，证明无法挪到别的请求上。`X_i` 是成员的公开份额，任何人都能由该届承诺算出。

**部分解密绝不明文上链。** 如果每组 `t_g` 份明文部分解密都公开，任何人都能合成 `s·D_j` 读出金额。每位成员用 `k·X_requester` 派生的掩码逐字掩盖 `[P_1 … P_m, c, z]`，连同 `K = k·H` 一起上链。只有请求人能打开。

**合成（请求人，链下）。** 打开每份批准，按成员公开份额校验证明，每组保留 `t_g` 份通过的批准。然后 `s·D_j = Σ_g Σ_{i∈S_g} λ_i·P_ij`。每份 memo 用 `s·D_j` 派生的密钥流打开，每个金额都用 `C_reg − s·D_j = v·G` 核对。

线下，任何法定人数都能不经合约完成上述全部步骤。链上流程是诚实委员会的受审计路径，不是技术屏障。

## 5. 策略即访问结构

访问结构是**若干阈值的 AND**，分享结构按它构造，所以满足策略的批准恰好就是能解密的批准。

| 策略 | 分组 | 为何成立 |
| --- | --- | --- |
| 多数票（`n` 中 `t`） | 一组，阈值 `t` | 普通 Shamir |
| 指定票 + 额外票；指定人单独不能解密 | A 组 = {指定人}，阈值 1；B 组 = 其余成员，阈值 `t` | `s = s_A + s_B`：指定人持有 `s_A`，还需要 B 组 `t` 人得到 `s_B`；没有 A 的 B 组缺 `s_A` |
| 多部门（各部门都须同意） | 每个部门一组 | 每个部门贡献自己的分量 |

OR 结构（「合规组或法院任一即可」）和加权投票需要线性秘密分享，尚未实现。不同结构的多个委员会可以并存；代币通过当前 `keyId` 一次绑定一个。

## 6. 接口

`contracts/contracts/family/` 下的 `IRegulatorCommittee` / `RegulatorCommittee`：

```solidity
// 生命周期
constructor(string name, GroupConfig[] genesis);                 // GroupConfig = (uint32 threshold, address[] members)
function registerKey(Point pk) external;
function deal(uint64 epoch, Point[] commitments, Point K, uint256[] enc) external;
function ack(uint64 epoch) external;
function complain(uint64 epoch, address dealer, uint8 reason) external;
function restart() external;
function propose(GroupConfig[] groups) external returns (uint256 proposalId);
function vote(uint256 proposalId) external;
// 代币与查看
function bindToken(address token) external;
function request(address token, uint64 fromBlock, uint64 toBlock, address account, bytes purpose) external returns (uint256);
function approve(uint256 requestId, Point K, uint256[] blob) external;
// 只读
function groupKey() external view returns (Point memory);
function currentEpoch() / latestEpoch() / groupCount() / isMember(address);
function epochInfo(uint64) / groupOf(uint64, uint256) / slotOf(uint64, address) / memberKey(address) / memberKeyAt(uint64, address);
function dealtAt(uint64, address) / hasAcked(uint64, address) / proposal(uint256) / hasVoted(uint256, address);
function viewRequest(uint256) / approvedAt(uint256, address) / requestCount() / proposalCount();
// 事件：MemberKeyRegistered, EpochCreated, GroupConfigured, DealingStarted, Dealt, Acked, Complained,
//       EpochActivated, EpochFailed, Proposed, Voted, TokenBound, ViewRequested, ViewApproved, ViewReady
```

`dealtAt`、`approvedAt` 与 `ViewRequest.requestedAt` 记录了各事件所在区块，客户端只需对单个区块 `eth_getLogs`，不必扫区间。客户端库（`test/family/lib/committee.ts`，同步到 dapp 的 `lib/family/committee.ts`）实现分发、份额恢复与校验、部分解密与证明、掩码及合成。

**接口层级（ERC-165）。** 代币不依赖其中任何一项：它只保存一把监管公钥和一个有权换钥的角色。分层是为了让 dapp 能识别持钥方。

| 层级 | 接口（ERC-165 id） | 声明内容 | dapp 的处理 |
| --- | --- | --- | --- |
| 1 | `IRegulatorKeyHolder`（`0x96ca07c9`） | `name()`、`groupKey()` | 显示持钥方名称，与代币的公钥比对，通过离线任务单解密（§8） |
| 2 | `IRegulatorCommittee`（`0x5d0a3fce`，继承第 1 级） | 上述完整协议，以及 §4 的链下格式 | 完整驱动：管理、请求、批准、合成 |

自行设计的团队（其他分享方案、MPC 托管、多签）可以只声明第 1 级并使用离线任务单；实现第 2 级即可使用全部界面。什么都不声明也能通过离线任务单使用。


## 7. 需要的协议修订：普通 ElGamal，memo 密钥改由 `r·pk_X` 派生（已随 A.1 0.4.0 落地）

A.1 的 memo 多用一个 ECDH 点 `E = e·H`，密钥流由 `e·pk = s⁻¹·E` 派生。打开它要算 `s⁻¹·E`——对共享秘密做*除法*，无法拆到份额上。改法（A.1 v0.4、B.1 v0.2）：

- **注意**：不能同时要「`pk = s·H`」和「密钥流来自 `r·H`」——普通 ElGamal 下 `D = r·H` 是公开点。正确组合：密文改为一个共享 `D = r·H` 加每方一个 `C_X = v·G + r·pk_X`；各方的共享秘密是 **`r·pk_X`**（发送方知道 `r`；X 方算 `s_X·D`，门限友好），两份 memo 的密钥流各由自己的 `r·pk_X` 派生；
- 删掉 `E`、`e` 及相关约束与公开输入：转账电路少一次 251 位标量乘，公开输入 15 → 13，payload 少 64 字节；
- 密钥约定改为 `pk = s·H`（普通 ElGamal），DKG 聚合就是点加；解密仍是 `C_X − s·D`。twisted 形式的好处（共享承诺）在 Groth16 下没有收益。

两份 memo 承载相同明文 `(v, r)` 但密钥流不同（各自的 `r·pk_X`）；`r` 每笔新鲜，密钥流一次性。

## 8. 监管界面

解密永远只需要每笔受监管转账的 `s·D`，而且每个值都能自我校验：用它打开的 memo 必须复现监管密文（`C_reg − s·D = v·G`）。所以 dapp 不需要理解、也不需要信任监管方怎么保管密钥，只问 `s·D` 从哪里来。

**家族工具 → 监管视图**（`/tools/regulator`）：

1. **代币。** 选择 A.1 或 B.1 代币；页面列出它用过的全部监管公钥，并标注能识别的那些。
2. **`s·D` 的来源：**

| 来源 | 适用 | 做法 |
| --- | --- | --- |
| 私钥 | 密钥存为文件或放在保险库 | 粘贴 `s_reg`，本地计算 |
| 钱包 | 只有一个钱包的监管方 | `s = keccak256(EIP-712 签名) mod L`，域 `(PEP, 1, chainId)`，用途 `"Regulator key"`，带 `index`；不绑定代币，因此密钥可先于代币存在，并可监管多个代币 |
| 委员会 | 第 2 级合约（家族模板或兼容实现） | 请求、批准、合成（§4.3）；第 1 级合约转到离线任务单 |
| 离线任务单 | 其他一切：自建合约、MPC 托管、多签、离线机器 | 导出任务，持钥方用自己的方式算出 `s·D`，再导入结果 |

3. **结果。** 一张解密转账表，一张按机密 id 的净变化表（机密转账加上公开的转机密 / 转公开、铸造 / 销毁、wrap / unwrap 金额）。范围覆盖代币整个生命周期时即为余额。单次扫描受与代币页面相同的 RPC 预算限制。

**离线任务单格式。** 任务（`pep-regulator-job/1`）按顺序列出范围内各项，每项含 `D`、`C_reg` 和监管 memo，另附监管公钥与公开流水；`jobId` 是其规范 JSON 的 keccak256，被改动的任务会被拒绝。结果（`pep-regulator-result/1`）为 `{ jobId, sD: [[x, y], …] }`，每项一个点、顺序一致、十进制字符串。门限系统先自行合成部分解密再作答。错误的点会显示为校验失败。

**部署时设定公钥。** A.1 与 B.1 的部署表单可以从以下任一方式取监管公钥：生成或粘贴私钥、上述钱包派生、粘贴公钥、读取持钥方的 `groupKey()`。

**家族工具 → 委员会管理**（`/tools/committee`）运营第 2 级委员会：部署（预设多数票、指定票 + 额外票）、成员密钥、分发 / 校验 / 确认 / 异议 / 重启、成员投票、授权并绑定代币。

## 9. 实测开销（BSC testnet，2026-09-29）

四人委员会：指定人（1/1）加一个 2/3 组；一次成员变更。实跑委员会 `0xa1ca936E528fD907866a6939dcBCD877074b5d51`，测试币 CTT `0xd2D3Ebe235302D98C3321F084C937c0Fb08F4cb0`（现网 A.1 / B.1 代币的监管密钥未改动）。

| 步骤 | Gas |
| --- | --- |
| 部署 | 3,620,075 |
| `registerKey`（创世最后一把密钥还会快照公钥并开始分发） | 73,773–79,223（最后一次 290,810） |
| `deal`（阈值 2，三个接收者） | 113,801–165,280 |
| `ack`（创世最后一个确认还会检查组公钥的子群） | 58,084–75,184（最后一次 2,263,815） |
| `bindToken`（代币会检查新公钥的子群） | 2,275,294 |
| `request` | 146,473 |
| `approve`（范围内一笔转账） | 83,112–96,135 |
| `propose` / `vote`（最后一票开启新一届） | 348,030 / 66,520（最后一票 744,104） |
| 全流程，含一笔真实 0x01 转账 | 12,641,431 |

复现：在 `contracts/` 运行 `npx hardhat run scripts/family/committee-e2e-bsc.ts --network bscTestnet`，再在 `dapp/` 用 `scripts/check-regulator.mts` 校验 dapp 的读取路径。

## 10. 待决

- **活性。** 创世需要每位成员都分发，每一届都需要每位新成员都确认；缺一人就会卡住。剔除不响应者的超时机制尚未实现。
- **异议滥用。** 分发中的届次，任何成员都能让它失败。异议不在链上裁决；公开争议份额的裁决流程可以判定谁作弊。
- **DKG 的 rogue-key 偏置。** 最后一个分发者能看到其他人的承诺再分发，可以影响 `groupKey`。对监管密钥可接受；需要时用先承诺后揭示修正。
- **第三方审计部分解密。** 部分解密加密给请求人，只有请求人能核对。对有争议的批准公开 `k·X_requester` 即可让任何人验证。
- **委员会是否持有 `MINTER_ROLE`**：否。发行与监督分离。
