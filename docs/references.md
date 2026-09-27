English | [中文](references.zh-cn.md)

# References

Registers the EIPs, papers, code repositories and articles cited by this project. When adding entries, keep the categorization and give a one-sentence description.

## EIP / ERC

| Number | Title | Description |
| --- | --- | --- |
| [EIP-20](https://eips.ethereum.org/EIPS/eip-20) | Token Standard | The ERC-20 token standard |
| [ERC-5564](https://eips.ethereum.org/EIPS/eip-5564) | Stealth Addresses | Stealth address standard |
| [ERC-6538](https://eips.ethereum.org/EIPS/eip-6538) | Stealth Meta-Address Registry | Stealth meta-address registry |
| [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) | Account Abstraction Using Alt Mempool | Account abstraction |
| [ERC-7503](https://eips.ethereum.org/EIPS/eip-7503) | Zero-Knowledge Wormholes | Proposal for private transfers via provable burns |
| ERC-7984 | Confidential Fungible Token | Proposed confidential fungible token interface (number and status `to be verified`) |

## Papers / articles

| Title | Description |
| --- | --- |
| Zcash Protocol Specification (Sapling) | The authoritative description of the note commitment + nullifier model |
| Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium (2023) | Theoretical foundation of Privacy Pools |
| Bulletproofs: Short Proofs for Confidential Transactions and More | Range proofs |
| Zether: Towards Privacy in a Smart Contract World (Bünz, Agrawal, Zamani, Boneh, 2019) | Confidential transfers with the account model + ElGamal ciphertexts + ZK; raises the front-running problem and the epoch solution, the direct counterpart of the A.1 pending design |

## Projects / code repositories

| Project | Description |
| --- | --- |
| Tornado Cash (classic) | Fixed-denomination mixing pool |
| Railgun | General-purpose ERC-20 shielded pool |
| Privacy Pools (0xbow) | Privacy pool with association set proofs |
| Zama fhEVM | FHE-based confidential contract execution environment |
| Aztec | Privacy zk-rollup |
| Solana Token-2022 Confidential Transfer | Account-model confidential transfer extension, two buckets pending / available + `ApplyPendingBalance` |
| Secret Network SNIP-20 / Oasis Sapphire | Confidential tokens computing on plaintext inside a TEE; a counterpart without pending |
| Umbra | Stealth address implementation |
| Semaphore | Anonymous signaling / group membership proofs |
| OpenZeppelin Contracts | Base library used by this project's contracts |

## Tools

| Tool | Description |
| --- | --- |
| [Hardhat 3](https://hardhat.org/) | Contract development environment |
| [ethers v6](https://docs.ethers.org/v6/) | Client library |
| [circom / snarkjs](https://docs.circom.io/) | ZK circuit development (candidate) |
| [Noir](https://noir-lang.org/) | ZK circuit development (candidate) |
