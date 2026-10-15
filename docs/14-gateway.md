English | [中文](14-gateway.zh-cn.md)

# 14 Family tool: the gateway

Status: `Prototype` (2026-10-15). Decision record: [ADR-0013](adr/0013-mintable.md), item 5. Implementation: `contracts/contracts/family/CasataGateway.sol`, tested locally against A.1 0.7.0 (`test/family/CasataGateway.ts`: the setup of §4 checked by views, a mint and a `wrapperMint` deposit, a withdrawal to the bound recipient at 584,500 gas, and an unshield proof refused at the gateway). Not deployed. It needs the Mintable module and the Wrapper port, so it serves A.1 0.7.0 and B.1 0.3.0. The B.1 path is tested too (`test/track-b/variant-1/B1Compositions.ts`: a deposit with the depositor's join-split, and a withdrawal to the bound recipient).

## 1. What it is

A family contract that makes a **privacy version of an existing ERC-20**. A user locks the existing token (the *underlying*, for example USDT) in the gateway and receives the same amount as a confidential balance of a Casata token. Anyone holding a confidential balance can take it out again: the gateway destroys it and releases the underlying to the recipient bound in the holder's proof.

The token reaches the gateway through two modules it already has ([07 §13.1](07-family-conventions.md)):

| Module | What the gateway uses it for |
| --- | --- |
| Mintable | The gateway holds `MINTER_ROLE`. It mints what it receives |
| Wrapper port | The gateway is the token's `wrapper()`. `wrapperBurn` is its way out, `wrapperMint` its way back in for value that left through it |

In the terms of [ADR-0008](adr/0008-modules.md) it is a runtime module on the Wrapper port, like the [Wrapper](10-wrapper.md), and it also holds the token's minter role. It is a tool, not a module: no module is registered for it, and the token does not know it is a gateway.

**One instance per pair.** Each gateway serves one underlying and one Casata token, both fixed in its constructor. It has no owner, no admin, no pause and no upgrade path. Unlike the Wrapper, which holds nothing and serves every token on the chain from one deployment, a gateway **holds real assets**: everything that was locked in it. Putting every pair in one contract would put every pair's collateral behind one bug. A token that wants a gateway deploys its own from the family bytecode.

## 2. Interface

```solidity
/// One deployment per (underlying, token). Holds the locked underlying; no owner, no upgradeability.
contract CasataGateway {
    IERC20  public immutable underlying;
    address public immutable token;     // a Casata token whose wrapper() is this contract
    uint256 public immutable scale;     // 10 ** (underlying.decimals() - token.decimals())

    /// public -> confidential. `amount` is in token units; the gateway pulls `amount * scale` of the underlying.
    /// `recipient` is what the Variant credits: an id in A.1, a note-creating join-split payload in B.1.
    function deposit(uint256 amount, bytes calldata recipient) external {
        uint256 before = underlying.balanceOf(address(this));
        underlying.safeTransferFrom(msg.sender, address(this), amount * scale);
        require(underlying.balanceOf(address(this)) - before == amount * scale);   // no fee-on-transfer
        if (amount <= ICasataWrappable(token).wrappedOut()) {
            ICasataWrappable(token).wrapperMint(recipient, amount);                // value that left through here
        } else {
            _mint(recipient, amount);                                               // new supply, Mintable
        }
        emit Deposited(msg.sender, amount);
    }

    /// confidential -> public. Anyone may relay; the payout goes to the `to` bound in the proof.
    function withdraw(address from, address to, uint256 amount, bytes calldata payload) external {
        ICasataWrappable(token).wrapperBurn(from, to, amount, payload);   // reverts unless the proof binds `to` and `amount`
        underlying.safeTransfer(to, amount * scale);
        emit Withdrawn(from, to, amount);
    }
}
```

- **Amounts are in token units.** The caller names the amount the token will credit, and the gateway pulls exactly `amount × scale` of the underlying. Nothing is left over, so there is no remainder to refund or reject.
- **Fee-on-transfer.** The gateway measures what arrived. If it is not `amount × scale`, the deposit reverts.
- **Which credit path.** Value that left through the gateway can come back through `wrapperMint`, which is bounded by `wrappedOut`. Only what exceeds it is minted. Recycling this way keeps `issuedSupply()` (minted minus burned, 04-modules §3) from growing with every round trip, so the supply cap measures the most that was ever locked at once, not the total volume. `wrappedOut()` is a view of the Wrapper port in both Variants; it is not part of `ICasataWrappable`, which the family Wrapper uses without it.
- **`_mint` depends on the Variant.** The gateway reads `casata()` in its constructor and accepts the Variants it knows:

  | Variant | `deposit` recipient | Mint call | `withdraw` |
  | --- | --- | --- | --- |
  | A.1 0.7.0, 0.8.0 | The 20-byte id | `mint(id, amount)` with the payload `0x82 00` | `wrapperBurn(id, to, amount, payload)`; the proof binds `to` through `r` ([A1-0007](adr/a1-0007-exit-kind-binding.md)) |
  | B.1 0.3.0, 0.4.0 | A join-split payload with `v_pub_in = amount` | `mint(token, amount)` with that payload | `wrapperBurn(0x0, to, amount, payload)` with `v_pub_out = amount` |

  `wrapperMint` takes the recipient as it is in both Variants. A Variant opened later needs a gateway version that knows its mint encoding.
- **Events.** `Deposited(sender, amount)` and `Withdrawn(from, to, amount)`, beside the token's own `Transfer`, `Minted`, `WrapperMinted` and `WrapperBurned`.

## 3. Decimals and limits

`scale = 10^(d − t)`, where `d` is the underlying's decimals and `t` the token's. From A.1 0.8.0 and B.1 0.4.0 a token chooses its decimals when it is deployed ([ADR-0014](adr/0014-eighteen-decimals.md)), so a gateway token is deployed with its underlying's: `t = d`, `scale = 1`, and nothing is lost. A.1 up to 0.7.0 and B.1 up to 0.3.0 have 6 decimals ([A1-0005](adr/a1-0005-numeric-parameters.md); B.1 01-design §2), so `scale = 10^(d − 6)`.

| Underlying | `d` | Token | `scale` | Smallest deposit | Largest single deposit | Most locked at once |
| --- | --- | --- | --- | --- | --- | --- |
| USDT on BSC | 18 | A.1 0.8.0 or B.1 0.4.0, `t = 18` | 1 | 10⁻¹⁸ USDT | the cap | about 3.4 × 10²⁰ USDT (cap `2¹²⁸ − 1` units) |
| USDT, USDC on Ethereum | 6 | A.1 0.8.0 or B.1 0.4.0, `t = 6` | 1 | 1 unit | the cap | about 3.4 × 10³² |
| USDT on BSC | 18 | A.1 0.7.0 or B.1 0.3.0, `t = 6` | 10¹² | 0.000001 USDT | A.1 about 281 million (`< 2⁴⁸` units); B.1 the cap | about 18.4 trillion USDT (cap `2⁶⁴ − 1` units) |
| USDT, USDC on Ethereum | 6 | A.1 0.7.0 or B.1 0.3.0 | 1 | 1 unit | A.1 about 281 million; B.1 the cap | about 18.4 trillion |

- **Precision.** With `scale > 1`, amounts below `10^(−t)` of a token cannot be deposited. A wallet rounds down and leaves the rest in the user's account; it never sends it to the gateway.
- **A token with more decimals than the underlying.** The constructor reverts: the scale would be below 1. From 0.8.0 the deployer avoids it by choosing `t = d`. An underlying with more than 18 decimals is served with `t = 18` and a scale above 1. Up to 0.7.0 / 0.3.0 this was the case of underlyings with fewer than 6 decimals, which are rare (GUSD has 2).
- **The A.1 per-operation bound** applies to `deposit` and `withdraw` as to any public amount (04-modules §2): `< 2⁴⁸` up to 0.7.0, where a larger amount is split by the wallet; `< 2¹²⁸` from 0.8.0, which is the cap.

## 4. Backing and trust

**Invariant.** `underlying.balanceOf(gateway) ≥ scale × token.totalSupply()`.

It holds if every unit of the token's supply entered through a deposit:

| Operation | Gateway holds (in token units) | `totalSupply()` |
| --- | --- | --- |
| `deposit` (either credit path) | `+x` | `+x` |
| `withdraw` | `−x` | `−x` |
| Confidential transfer, fold, `0x03` / `0x04` | 0 | 0 |
| Holder's burn (`0x81`, core under ADR-0013) | 0 | `−x` |

A holder who burns gives up their claim and leaves the underlying in the gateway for good. The invariant then holds with a margin. `wrappedOut` does not appear in it: it only says how much can come back through `wrapperMint`.

**Conditions** (ADR-0013 item 5). The invariant is a property of the gateway and the roles, not something the token enforces:

| # | Condition | Why |
| --- | --- | --- |
| G1 | `token.wrapper() == gateway` and `gateway.token() == token` | The way out must release the underlying |
| G2 | The gateway is the only holder of `MINTER_ROLE` | Any other minter can issue unbacked supply |
| G3 | Nobody holds `DEFAULT_ADMIN_ROLE` (renounced after setup) | The admin could grant `MINTER_ROLE` later |
| G4 | The initial supply is zero | It was not deposited |

Setup is four steps: deploy the token with Mintable and the Wrapper port, an initial supply of zero and no minter; deploy the gateway; `setWrapper(gateway)` and `grantRole(MINTER_ROLE, gateway)`; `renounceRole(DEFAULT_ADMIN_ROLE)`. Whoever holds `REGULATOR_ADMIN_ROLE` keeps it and can still rotate the regulator key (07 §9). After the renunciation nobody can grant or revoke it.

**What a front end can check.** A.1 0.7.0 and B.1 0.3.0 use OpenZeppelin `AccessControlEnumerable`, which lists a role's members. Earlier versions use `AccessControl`, which cannot.

| Check | How | Covers |
| --- | --- | --- |
| G1 | `wrapper()`, `gateway.token()` | Fully, by views |
| The invariant now | `underlying.balanceOf(gateway)`, `scale`, `totalSupply()` | Everything issued so far, G4 included |
| G2, G3 | `getRoleMemberCount(MINTER_ROLE) == 1` with `getRoleMember(MINTER_ROLE, 0) == gateway`, and `getRoleMemberCount(DEFAULT_ADMIN_ROLE) == 0`. On earlier versions: replay `RoleGranted` / `RoleRevoked` from the token's deployment block | Fully, by views from A.1 0.7.0 and B.1 0.3.0; by a log scan before |

A front end calls a token *backed* only when all three pass. It shows the result of the invariant check on its own when the log scan is not available.

**Trust that remains.**
- **The underlying's issuer.** USDT and USDC can freeze an address. If the gateway's balance is frozen, every holder loses the backing at once. The gateway cannot prevent this. A front end names the risk for underlyings that have a blacklist.
- **The gateway's code.** It holds the collateral. It is kept small: two functions, no admin, no external calls other than the underlying and the token.

## 5. With the public ledger

On a token with the public-ledger module, a holder can also unshield to a public balance of the Casata token itself. The privacy version then has three forms: the underlying, the token's public balance, and its confidential balance. The token's public balance can be used in DeFi like any ERC-20.

On A.1 this composition has two exits to a non-zero recipient, `0x04` and `wrapperBurn`. It needs 0.7.0, where the proof binds which exit it is for ([A1-0007](adr/a1-0007-exit-kind-binding.md)). Without that, a relayer could turn a holder's unshield into a withdrawal of the underlying, or the reverse. B.1 has no public ledger.

## 6. What it does not do

- **No fees.** Deposits and withdrawals cost gas only. A relayer for `withdraw` is paid out of band, as for the Wrapper (10 §7).
- **No rebasing or fee-on-transfer underlyings.** Fee-on-transfer is caught at deposit. A rebasing balance cannot be caught and breaks the invariant. Such tokens are not supported.
- **No pause, no allow-list, no recovery.** The gateway cannot stop anyone, and nobody can take the collateral out except through `withdraw`.

**Privacy.** A deposit is a public edge from a wallet to an id (A.1) or to a new note (B.1), and a withdrawal is a public edge to a wallet. Both amounts are public. This is the same exposure as a wrap and unwrap (A.1 01-design §2.1). What happens between the two stays hidden. A wallet points out that withdrawing the same amount soon after depositing it links the two.

## 7. Relationship to the Wrapper

| | Wrapper ([10](10-wrapper.md)) | Gateway |
| --- | --- | --- |
| Direction | Confidential value out to a public wrapped token, and back | An existing public token in to confidential value, and back |
| Holds assets | No: burn and mint on both sides | Yes: the locked underlying |
| Deployments | One per chain, serving every token | One per (underlying, token) pair |
| Token modules it needs | The Wrapper port | The Wrapper port and Mintable |
| What bounds it | `wrappedOut` | `wrappedOut` for `wrapperMint`, only the supply cap for `mint`; the backing rests on G1 to G4 |

Both are plugged into the same port, and a token has one `wrapper()`, set once. So a gateway token has no `wTOKEN`. It does not need one: the underlying is already the public form, and with the public ledger so is the token itself.

## 8. In the dApp

Two places, both added on 2026-10-15.

- **The workshop tool** (`/tools/gateway`). Setting up: the reader names a Casata token and an existing ERC-20; the page checks that the token is A.1 0.7.0 or B.1 0.3.0 (0.8.0 and 0.4.0 once implemented) with Mintable and the Wrapper port and an empty port, deploys a gateway for the pair, and then offers the steps of §4 one by one, each shown done or not from the chain: plug the gateway into the port, grant it `MINTER_ROLE`, revoke the role from everyone else, renounce the admin role. Checking: for any gateway address the page shows the pair, the scale, the conditions G1 to G4 and the invariant, and calls the token backed only when all of them hold.
- **The token page.** When the module in a token's Wrapper port is a gateway (its `token()` is the token), the wrap and unwrap tabs become withdraw and deposit of the underlying. A withdrawal is the wrap's proof, sent to `withdraw`; a deposit approves the underlying and calls `deposit` with the reader's id (A.1) or a join-split for the reader's key (B.1). The A.1 page with the public ledger has no wrap tabs, so a gateway token with the public ledger cannot yet be deposited into or withdrawn from on its page.

## 9. Open points

- **Listing role members.** Decided on 2026-10-15: A.1 0.7.0 and B.1 0.3.0 use OpenZeppelin `AccessControlEnumerable` (A.1 04-modules M12, B.1 01-design D10), so G2 and G3 are view calls there (`getRoleMemberCount`, `getRoleMember`). Tokens of earlier versions still need the log scan.
- **Underlyings with fewer than 6 decimals.** Resolved by ADR-0014 from A.1 0.8.0 and B.1 0.4.0: the token takes the underlying's decimals (§3).
- **The mint encoding per Variant.** The gateway has to know how each Variant mints (§2). A family rule that `mint` with a payload accepts the same recipient bytes as `wrapperMint` would make the gateway independent of the Variant.
- **One-step setup.** A factory could deploy the gateway and wire the roles in one transaction. Until then a front end checks the end state (§4), not the steps. The factory cannot deploy a B.1 token in the same call: B.1's initial issuance carries a proof bound to the token's address, which a `CREATE2` deployment cannot know before its own init code is fixed (B.1 01-design D9).
