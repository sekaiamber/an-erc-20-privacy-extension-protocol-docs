# 术语表

| 术语 | 英文 | 解释 |
| --- | --- | --- |
| 屏蔽 / 解除屏蔽 | shield / unshield | 把代币从公开状态转入隐私状态，或反向操作 |
| 隐私池 / 屏蔽池 | shielded pool | 存放隐私状态代币的逻辑集合 |
| 承诺 | commitment | 对某个值（如 note）的绑定且隐藏的摘要，通常是哈希或 Pedersen 承诺 |
| note | note | UTXO 风格隐私系统中的"一张钞票"，包含金额、所有者、随机数 |
| 作废符 | nullifier | 由 note 派生的唯一值，花费时公开以防止双花，但不泄露对应的 note |
| 增量 Merkle 树 | incremental Merkle tree | 只支持追加叶子的 Merkle 树，用于存放承诺集合 |
| 零知识证明 | zero-knowledge proof (ZKP) | 证明某陈述为真而不泄露额外信息 |
| 可信设置 | trusted setup | 某些证明系统（如 Groth16）需要的一次性参数生成仪式 |
| 全同态加密 | fully homomorphic encryption (FHE) | 允许直接对密文进行运算的加密方案 |
| 阈值解密 | threshold decryption | 需要多方中的 t 方合作才能解密 |
| 隐匿地址 | stealth address | 由发送方为接收方派生的一次性地址 |
| 隐匿元地址 | stealth meta-address | 接收方公开的、用于派生隐匿地址的公钥对 |
| 查看密钥 | viewing key | 可以解密查看但不能花费的密钥 |
| 花费密钥 | spending key | 可以花费隐私资产的密钥 |
| 关联集合 | association set | Privacy Pools 中用户声称自己资金来源所属的集合 |
| 匿名集 | anonymity set | 观察者无法区分的候选用户集合 |
| 中继者 | relayer | 代替用户提交交易并支付 Gas 的第三方 |
| 账户抽象 | account abstraction (ERC-4337) | 让合约账户能发起交易并支持代付 Gas 的机制 |
