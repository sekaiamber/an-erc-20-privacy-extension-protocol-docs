[English](0011-project-name-casata.md) | 中文

# 0011 项目定名 Casata；缩写 PEP 停用

- 状态：Accepted（2026-10-13；同日已在文档、合约和 dApp 里实现；测试网上的三个代币尚未重新部署，仓库尚未改名）
- 日期：2026-10-13
- 范围：家族（只改名字，不改行为。与 [ADR-0010](0010-erc20-surface-tradeoffs.zh-cn.md) 一起实现）

## 背景

项目最初叫「ERC-20 Privacy Extension Protocol」，缩写 PEP。此后有两件事变了。

项目是什么。它已经不是一个协议，而是一个研究团体：维护一族隐私代币合约，把它们公开出来，并定期把研究结果加进这个家族。任何人都可以基于家族发行代币，也可以拿它作基础自己定制。它不是发币项目，也不是融资项目（owner，2026-10-13）。

缩写撞了什么。「PEP」是 Python Enhancement Proposal；在反洗钱实务里，它是「政治公众人物」（politically exposed person）。本项目的代币在设计上就向监管方开放（[ADR-0004](0004-regulatory-access-principles.zh-cn.md)），第二个重名尤其尴尬。

这个缩写现在出现在每个代币都会回答的两个函数选择器里，出现在源码的五个接口名和一个合约名里，也出现在派生密钥所用的 EIP-712 域里。一旦真的有代币发行，选择器和域名就改不了了。ADR-0010 本来就要求两个 Variant 各出一个新版本，并重新部署测试网上的三个代币，所以现在改名代价最小。

## 决策

1. **项目定名 Casata。** 这是意大利语，指作为世系的「家」：一个跨代延续、守着一份家业的家族。对应的形象是文艺复兴时期维护着收藏和作坊的家族，不是帮派。

2. **全称是 Casata Segreta**（「隐秘之家」）。在需要完整名字的地方使用，例如页面标题或介绍文字。正文和标识符用简称。

3. **这个名字指项目，也指它维护的家族。** 文档里的「家族」就是 Casata 的家族。Track、Variant、模块的含义和名字都不变。这个名字不引入新概念。

4. **「ERC-20 Privacy Extension Protocol」不再是项目的名字**，「PEP」不再用于任何新东西。名字旁边的说明语是「隐私代币合约世家」（英文：a family of privacy token contracts for ERC-20）。

5. **向导定名 Cicerone。** cicerone 是带访客参观收藏、逐件讲解的向导。在 dApp 里，它是把用户从「我想要一个隐私代币」带到部署的那一部分：讲解 Track、Variant 和模块，推荐一种组合，并准备好由用户自己的钱包发出的交易。它只讲解和推荐，不持有密钥，不持有资金，也不自己部署任何东西。Cicerone 是 dApp 一项功能的名字，不是家族级概念。这项功能现在是各 Variant 各自的部署页；跨 Variant 的统一向导还没有做。

6. **标识符跟随简称。**

   | 现在 | 改为 |
   | --- | --- |
   | `IPEP`、`pep()` | `ICasata`、`casata()` |
   | `IPEPModules`、`pepModules()` | `ICasataModules`、`casataModules()` |
   | `IPEPPublicLedger`、`IPEPRoleIssuance`、`IPEPWrappable` | `ICasataPublicLedger`、`ICasataRoleIssuance`、`ICasataWrappable` |
   | `PEPWrapper` | `CasataWrapper` |
   | `PEP_DESCRIPTOR` | `CASATA_DESCRIPTOR` |
   | EIP-712 域名 `"PEP"` | `"Casata"` |
   | dApp：`lib/pep.ts`、`PEP_ABI`、`IPEP_INTERFACE_ID` | `lib/casata.ts`、`CASATA_ABI`、`ICASATA_INTERFACE_ID` |
   | 仓库 `an-erc-20-privacy-extension-protocol-docs` / `-contracts` / `-dapp` | `casata`、`casata-contracts`、`casata-dapp` |

   不变的部分：描述符格式 `"<track>:<variant>:<version>"`；Variant 合约的名字（`A1Core`、`B1NoteToken` 等）；payload 类型登记表；事件和错误；模块接口里的函数。

7. **链上有两个 ERC-165 标识因为改名而变。**

   | 接口 | 函数 | 现在的标识 | 改名后的标识 |
   | --- | --- | --- | --- |
   | `ICasata` | `casata()` | `0xace237f5` | `0x75118339` |
   | `ICasataModules` | `casataModules()` | `0xad5ad25b` | `0xf71c7351` |

   ERC-165 标识由函数选择器算出，与接口的名字无关。公开账本模块和 Wrapper 端口模块的标识不变。角色发行模块的标识会变，原因是 ADR-0010，不是本 ADR。

8. **改名与 ADR-0010 落在同一批 Variant 版本里。** A.1 和 B.1 各出一个新版本，不是各出两个。更早版本的代币继续回答 `pep()`，dApp 不打开这类代币。

9. **由钱包签名派生的密钥随域名改变。** 这包括 A.1 和 B.1 的持有人密钥、在 dApp 里派生的监管密钥，以及委员会成员密钥。在 `"PEP"` 域下派生的密钥对当初使用它们的代币仍然有效；新的 dApp 不再派生它们。

10. **生成元 `H` 保留它的派生标签。** `H` 由 `hash-to-curve("PEP/A.1/H/v1")` 派生，是 A.1 和 B.1 电路里的常量。换一个标签就是换一个点，电路、验证合约和查找表都会跟着变。这是密码学上的改动，不是改名，所以这个标签保留下来，作为一个已有常量如何产生的记录。客户端的标签 `"PEP/A.1/decryptable"` 改为 `"Casata/A.1/decryptable"`；这没有代价，因为持有人密钥本来就要变（第 9 条）。

11. **BSC 测试网上已部署的 Wrapper 继续使用。** 它的行为与名字无关：它检查的是 Wrapper 端口接口，这个接口的标识不变。它的部署记录保留部署时的名字。

12. **已有的记录不改写。** ADR-0001 到 ADR-0010 以及各部署记录，保留写下时使用的名字。规范性文档（01 到 11，以及各 Track 和 Variant 的文档）在本 ADR 实现时改用新名字。

13. **本 ADR 不决定的事**：GitHub 组织、域名、商标、标志。仓库改名由 owner 在 GitHub 上操作；子模块的地址随之更新。

## 备选方案

- **保留「PEP」。** 被否决：两个重名都还在；而且这个名字仍然把一个由团体维护的家族叫作「协议」。
- **项目改名，链上保留 `pep()`。** 这样不会有接口标识变化。被否决：此后发行的每个代币都会永久带着已经停用的缩写；而现在三个代币本来就要重新部署，改的代价最低。
- **中性的标识符**，例如 `family()` 和 `IFamily`，以后再改名也不受影响。被否决：dApp 靠这个选择器识别代币，通用的名字更容易被无关的合约声明。
- **在 Casata 的标签下重新派生 `H`。** 被否决：两个 Variant 的电路都要变，安全性上没有任何收益；而 ADR-0010 不动电路。
- **其它全称**：Casata Privata、Discreta、Incognita、Cifrata。owner 选了 Segreta。
- **向导的其它名字。** Consigliere：难拼，而且已有一个 BSV 索引器在用。管家类的名字（Maestro di Casa、Majordomo、Fattore）：管家是替主人打理事务的人，容易让人想到托管，而这个工具不保管任何东西。单独的「Maestro」是一个很有名的交易机器人。
- **更早几轮的名字**：Studiolo、Arboretum、Sodalizio、Cenacolo。Tacit、Envelop、Cloister 已被其它加密项目使用。

## 后果

- 正面：名字说的就是项目本身，两个重名都没有了。
- 正面：名字在任何东西真正发行之前定下来，并且和 ADR-0010 需要的重新部署合在一起。
- 负面：「segreta」读起来是「秘密」，容易让人以为是对监管隐瞒。家族做的恰恰相反（[ADR-0004](0004-regulatory-access-principles.zh-cn.md)），所以名字旁边的说明文字必须写明监管接入是内置的。
- 负面：测试网上现有的三个代币回答的是 `pep()`，以后也是。重新部署之后，它们上面的余额只能用脚本或更早的 dApp 构建访问。
- 负面：这个名字背后的核查只是快速的网页搜索。没有做商标和域名检索，这个短语也没有请意大利语母语者看过。GitHub 账号 `casata` 已被占用；`casata-labs` 和 `casata-segreta` 在 2026-10-13 还是空的。
- 接下来要做的事，目前都没有开始。它们与 ADR-0010 列出的工作一起做，先改文档：

  | 位置 | 改动 |
  | --- | --- |
  | 文档 | 三个 README 和 `docs/README` 的标题与介绍；06、07、10、11 以及各 Track 和 Variant 文档里的 `pep()` / `IPEP*` / `PEPWrapper`；在 ADR 索引里注明更早的 ADR 使用旧名字 |
  | 合约 | 第 6 条列出的接口、函数、常量和合约；测试；导出脚本；Ignition 模块；包名 |
  | dApp | `lib/pep.ts` 及其调用方；五处 EIP-712 域；`decryptable` 标签；`i18n/` 里的界面文字；Cicerone 做出来之后的页面 |
  | 仓库 | 由 owner 改名；`.gitmodules` 和各 README 里的链接随之更新 |
