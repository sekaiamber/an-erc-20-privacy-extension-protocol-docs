English | [中文](glossary.zh-cn.md)

# Glossary

| Term | 中文 | Explanation |
| --- | --- | --- |
| shield / unshield | 屏蔽 / 解除屏蔽 | Move tokens from the public state into the private state, or the reverse |
| shielded pool | 隐私池 / 屏蔽池 | The logical set holding tokens in the private state |
| commitment | 承诺 | A binding and hiding digest of a value (such as a note), usually a hash or a Pedersen commitment |
| note | note | "One banknote" in a UTXO-style privacy system, containing amount, owner and randomness |
| nullifier | 作废符 | A unique value derived from a note, revealed when spending to prevent double-spends without revealing the corresponding note |
| incremental Merkle tree | 增量 Merkle 树 | An append-only Merkle tree used to store the set of commitments |
| zero-knowledge proof (ZKP) | 零知识证明 | Proves that a statement is true without revealing any additional information |
| trusted setup | 可信设置 | A one-time parameter generation ceremony required by some proof systems (such as Groth16) |
| fully homomorphic encryption (FHE) | 全同态加密 | An encryption scheme that allows computation directly on ciphertexts |
| threshold decryption | 阈值解密 | Decryption that requires t out of multiple parties to cooperate |
| stealth address | 隐匿地址 | A one-time address derived by the sender for the recipient |
| stealth meta-address | 隐匿元地址 | The recipient's published key pair used to derive stealth addresses |
| viewing key | 查看密钥 | A key that can decrypt and view but cannot spend |
| spending key | 花费密钥 | A key that can spend private assets |
| association set | 关联集合 | In Privacy Pools, the set a user claims their funds originate from |
| anonymity set | 匿名集 | The set of candidate users an observer cannot distinguish between |
| relayer | 中继者 | A third party that submits transactions and pays gas on behalf of the user |
| account abstraction (ERC-4337) | 账户抽象 | A mechanism that lets contract accounts initiate transactions and supports sponsored gas |
