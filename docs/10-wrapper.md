English | [中文](10-wrapper.zh-cn.md)

# 10 Family tool: the generic Wrapper

Status: `Draft` (2026-09-27). Decision record: [ADR-0005](adr/0005-family-wrapper.md).

## 1. What it is

A single, family-level contract that gives **privacy tokens without a public ledger** (Track B and any future non-ERC-20-shaped Variant) a standard ERC-20 face for DeFi. For each underlying token it issues a plain ERC-20 *wrapped token* (`wTOKEN`); wrapping moves value from the confidential ledger to the public wrapped token, unwrapping moves it back.

It is a **tool, not a requirement**: Track A tokens carry their own public ledger and never use it; a Track B token that never needs DeFi never registers with it. The relationship is that of WETH to ETH.

## 2. Control inversion

The wrapper defines the interface; a privacy token opts in by implementing it and granting the wrapper its `WRAPPER_ROLE`.

```solidity
/// Implemented by a privacy token that wants to be wrappable. `recipient` is opaque to the wrapper:
/// a confidential id for account-model Variants, a note / stealth output for note-model Variants.
interface IPEPWrappable {
    /// Wrapper -> token. Credit `amount` (public) to the confidential `recipient`. Only the registered wrapper.
    function wrapperMint(bytes calldata recipient, uint256 amount) external;

    /// Wrapper -> token. Verify `payload` (a Variant-defined proof that the owner of `from` gives up `amount`
    /// and designates the public address `to`), debit the confidential ledger, and return what the wrapper
    /// must mint. `to` and `amount` MUST be bound inside the proof (see A.1 security review F14).
    /// Only the registered wrapper.
    function wrapperBurn(address from, address to, uint256 amount, bytes calldata payload) external;

    function wrapper() external view returns (address);
}
```

```solidity
/// One deployment per chain. Holds no keys, no confidential state, no upgradeability.
contract PEPWrapper {
    mapping(address token => WrappedERC20) public wrapped;     // created on first use (minimal ERC-20, mint/burn by wrapper only)

    /// confidential -> public. Anyone may relay; the payout goes to the `to` bound in the proof.
    function wrap(address token, address from, address to, uint256 amount, bytes calldata payload) external {
        IPEPWrappable(token).wrapperBurn(from, to, amount, payload);   // reverts unless proof ok and msg.sender == wrapper
        _wrapped(token).mint(to, amount);
        emit Wrapped(token, from, to, amount);
    }

    /// public -> confidential. The caller burns their own wTOKEN.
    function unwrap(address token, bytes calldata recipient, uint256 amount) external {
        _wrapped(token).burnFrom(msg.sender, amount);
        IPEPWrappable(token).wrapperMint(recipient, amount);
        emit Unwrapped(token, msg.sender, recipient, amount);
    }
}
```

`WrappedERC20` is the smallest possible OpenZeppelin ERC-20 with `name = "Wrapped " + underlying.name()`, `symbol = "w" + underlying.symbol()`, `decimals = underlying.decimals()`, and `mint` / `burnFrom` restricted to the wrapper. It has no owner and no hooks.

## 3. Why burn-and-mint rather than custody

A contract cannot own a confidential account: it holds no private key and cannot produce proofs. So the wrapper cannot "lock" confidential tokens the way WETH locks ETH. Instead, wrapping **burns** on the confidential side and **mints** the receipt token; unwrapping burns the receipt and **mints** back on the confidential side (a public-amount mint, exactly like a Track A shield: the degenerate ciphertext `(amount·G, 0)` needs no key). Consequently:

- `underlying.totalSupply()` counts the confidential part only; `wTOKEN.totalSupply()` counts the public part; issued supply = their sum. Both numbers are public — accepted (ADR-0005 §Consequences).
- The wrapper's only privileged power over a token is `wrapperMint`, and `wTOKEN.totalSupply() == Σ wrapperBurn − Σ wrapperMint` is an invariant anyone can check from events.

## 4. Security requirements on the token side

| # | Requirement | Why |
| --- | --- | --- |
| W1 | The burn proof binds `to` and `amount` (and, as always, `from`, nonce, token address, chain id) | Otherwise a relayer rewrites the payout address (A.1 F14) |
| W2 | `wrapperMint` / `wrapperBurn` check `msg.sender == wrapper()` | The wrapper is the only party allowed to mint |
| W3 | `wrapper()` is set once by the token admin (or at construction) and cannot be changed without a timelock the Variant documents | Rotating the wrapper is equivalent to rotating the minter |
| W4 | `amount` respects the Variant's per-operation and supply bounds on both directions | The wrapper does no range checks of its own |

## 5. Trust and blast radius

The wrapper is shared, so a bug in it is a bug in every token that registered it. Mitigations: no admin, no upgrade path, no external calls other than the two interface functions and its own `WrappedERC20`s, and a scope small enough to audit in an afternoon. A token that wants isolation can deploy its own instance of the same bytecode; the interface does not care.

## 6. Relationship to the tracks

| | Track A | Track B (+ wrapper) |
| --- | --- | --- |
| DeFi-facing asset | the token itself | `wTOKEN` from the wrapper |
| Public ↔ confidential | built-in `0x03` / `0x04` | `unwrap` / `wrap` |
| Privileged external party | none | the wrapper (mint) |
| What stays hidden | confidential balances and amounts | same; the confidential aggregate is `underlying.totalSupply()` |

The two are different integrator contracts, which is exactly the Track boundary (ADR-0002). Neither replaces the other.

## 7. Open points

- Whether `wrap` should also accept a *prepared* payload (family §6) so wallets that cannot build calldata can use it. Draft: yes, by calling `token.prepare` first and letting `wrap` execute the prepared entry.
- Fee hook for relayers (they pay gas for `wrap`). Draft: none in 0.1; relayers can be paid out-of-band or by the `to` address.
