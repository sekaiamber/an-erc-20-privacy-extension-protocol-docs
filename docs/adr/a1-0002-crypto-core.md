# A1-0002 密码内核：twisted ElGamal on Baby Jubjub + Groth16

- 状态：Accepted
- 日期：2026-09-24
- 范围：A.1

## 背景

需要在账户模型下隐藏余额与金额、支持监管解密、并在主流 EVM 链上以可接受的 Gas 验证。

## 决策

1. **加密**：twisted ElGamal，`C = v·G + r·H`，`D_X = r·pk_X`，`pk = s⁻¹·H`。一份承诺、多个句柄，同一金额同时加密给付款方、收款方、监管方。
2. **曲线**：Baby Jubjub，电路内原生；链上同态加法用 Solidity 实现的点加，`x·G` 用固定基窗口表。
3. **证明**：Groth16（circom + snarkjs）作为原型；正式版评估 PLONK / UltraHonk 以复用通用 SRS。
4. **公开输入压缩**：全部公开输入在电路内 SHA-256 为一个域元素，验证 Gas 约 195k。
5. **memo**：每笔转账附带 Poseidon 密钥流加密的 `(v, r)` 给收款方与监管方，电路强制正确，任何人不需要解离散对数。

## 备选方案

- Σ-协议 + Bulletproofs 直接在 BN254 G1 上验证：无可信设置，但验证 2~4M gas，高一个数量级。
- BN254 G1 做 ElGamal + SNARK 证明：曲线运算在电路内非原生，不可行。
- Pedersen 承诺 + 范围证明：收款方需链下拿 blinding factor，丢失即丢币。
- FHE：无需用户密钥，但引入阈值网络信任与协处理器依赖，归 A.3 / Track C。

## 后果

- 正面：机密转账验证约 195k gas，总成本 ~325k；证明生成浏览器内秒级。
- 负面：Groth16 每电路一次可信设置；链上手写 Baby Jubjub 点加需审计。
