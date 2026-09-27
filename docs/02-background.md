English | [中文](02-background.zh-cn.md)

# 02 Background

Status: `Draft`

## ERC-20 Recap

ERC-20 ([EIP-20](https://eips.ethereum.org/EIPS/eip-20)) defines the minimal interface of a fungible token:

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

Key observations relevant to privacy:

- `balanceOf` is a public view function; balances are visible to everyone.
- The `Transfer` event writes all three fields `from`, `to` and `value` into the log, and `from`/`to` are indexed, making it convenient for indexers to query by address.
- The account model (as opposed to the UTXO model) means the entire history of an address is naturally linked together.

## Layers of Privacy Leakage

On the EVM, an ERC-20 transfer leaks at least the following information:

| Layer | What is leaked | Observer |
| --- | --- | --- |
| The transaction itself | Sender EOA, target contract, calldata (including `to`, `amount`) | All nodes, block explorers |
| Contract state | Changes in `balanceOf` | Anyone who reads state |
| Event logs | `Transfer(from, to, value)` | Indexers, analytics firms |
| Gas payment | Who pays for the transaction (usually equals the sender) | All nodes |
| Network layer | Source IP of the transaction broadcast | Peer nodes, mempool observers |

The privacy extension protocol mainly addresses the first four layers; the network layer is out of scope (see [01 Overview](01-overview.md)).

## Three Dimensions of Privacy

These three dimensions are used repeatedly in later documents:

1. **Amount privacy**: hide transfer amounts and account balances.
2. **Identity privacy (Sender / Receiver privacy)**: hide the on-chain identities of the payer and payee, or at least sever their link to real-world identities.
3. **Linkability**: hide the link between multiple transactions of the same user, preventing graph analysis.

Different techniques cover different dimensions, for example:

- Stealth addresses mainly address receiver identity privacy and do not hide amounts.
- Homomorphic encryption (FHE) or Pedersen commitments mainly address amount privacy.
- Zero-knowledge proofs + commitment sets (e.g. a Zcash-style shielded pool) can cover all three dimensions at once.

## Related Cryptographic Primitives

The following primitives appear in the solution survey and design; see [glossary.md](glossary.md) for the glossary:

- Commitments: Pedersen commitments, hash commitments
- Zero-knowledge proofs: Groth16, the PLONK family, STARK
- Merkle trees / incremental Merkle trees
- Fully homomorphic encryption (FHE)
- Elliptic-curve Diffie-Hellman (used for stealth addresses)
