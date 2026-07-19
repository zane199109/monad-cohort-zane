# AI-assisted Dev Plan: PrismSettle 最小原型验证报告

## 文档链接：
/home/administrator/monad-cohort-zane/tasks/technical/week-2/prismsettle-minimal-prototype.md

---

## 我让 AI 帮我理解了什么：

### 1. 合约状态机流程（PrismSettleJob.sol）
- **createJob**: 生成 jobId = keccak256(buyer || nonce)，shard = jobId & 0xFF
- **fundViaToken**: 支持两条路径——直接 ERC20 transferFrom 或 x402 receipt 路由
- **assign**: 绑定 provider 地址到 Funded 状态的 Job
- **submit**: Provider 提交 deliverableHash + proofHash，触发 ArbitrationHook.onSubmitted
- **complete**: 仅 COMMERCE_EVALUATOR_ROLE 可调用，完成后 transfer 资金给 provider

### 2. 256-shard 存储设计（PrismSettleRegistry.sol）
- shardValidations[shard][agentId] — 按 agentId 低 8 位分片，消除 Monad OCC 冲突
- aggregateEpoch 延迟聚合：EMA 平滑 + stake-weighted average + inactivity decay
- Seed Phase: 官方 Agent 预置声誉 0.7e18

### 3. 角色权限模型
- COMMERCE_EVALUATOR_ROLE → complete()
- REGISTRY_EVALUATOR_ROLE → submitValidation(source=1,2)
- DEFAULT_ADMIN_ROLE → seedAgent(), slash()

---

## AI 生成了什么代码骨架 / 技术方案：

### 1. scripts/demo-minimal.sh（一键 Demo 脚本）
```bash
#!/bin/bash
# 10 步完整流程：deploy → mint → approve → createJob → fund → assign → submit → complete → verify
```

### 2. 验收标准清单（5 项可验证指标）
| # | 指标 | 验证方式 |
|---|------|---------|
| 1 | 合约部署成功 | forge script 输出地址 |
| 2 | 全流程日志 | cast send 返回 status=1 |
| 3 | 前端单页 | page.tsx 包含所有交互 |
| 4 | 测试通过 | forge test -vvv |
| 5 | 30 秒 demo | 录屏 connect wallet → escrow released |

### 3. Mock 策略文档
- Evaluator: 硬编码规则（proofHash != "" → success）
- Indexer: 直连 eth_call，不写 event listener
- X402: 跳过真实支付流，用 MockERC20

---

## 我手动改了什么：

### 修改 1：fundViaToken 空 bytes 参数
**问题**：cast send 中用空字符串 `""` 表示空 calldata 失败
**修复**：改为 `"0x"`
```bash
# Before (fail):
cast send ... "fundViaToken(uint256,uint256,bytes)" "0" "10000000000000000000" ""

# After (pass):
cast send ... "fundViaToken(uint256,uint256,bytes)" "0" "10000000000000000000" "0x"
```

### 修改 2：地址提取逻辑
**问题**：deploy.log 输出格式是 `"MockERC20: 0x..."` 而非 `"MockERC20:0x..."`
**修复**：调整 grep 正则
```bash
# Before:
TOKEN_ADDR=$(grep 'MockERC20:' /tmp/deploy.log | grep -oE '0x[0-9a-fA-F]{40}')

# After (same, but verified working):
TOKEN_ADDR=$(echo "$DEPLOY_OUTPUT" | grep 'MockERC20:' | grep -oE '0x[0-9a-fA-F]{40}')
```

### 修改 3：Anvil 进程管理
**问题**：脚本末尾 `kill $ANVIL_PID` 导致后续验证步骤无法连接
**修复**：将验证步骤移到 kill 之前，或独立运行验证

### 修改 4：简化 demo 脚本
**移除**：不必要的 admin 账户、复杂角色设置
**保留**：buyer/seller/evaluator 三个核心账户

### 修改 5：添加错误处理
每个 `cast send` 后检查返回值，失败时打印错误而非静默跳过

---

## 当前是否跑通：**跑通** ✅

### 实际运行结果（2026-07-18）

```
=== Step 1: Mint USDC ===
✓ blockNumber 9, status=1

=== Step 2: Approve ===
✓ blockNumber 10, status=1

=== Step 3: Create Job ===
✓ blockNumber 11, jobId=0x8d7516f92f86ff2bff7638117eeefe54f86ce065a68c3b0f6c4b3d9bfb491ad6

=== Step 4: Fund Job ===
✓ blockNumber 12, status=1

=== Step 5: Assign Provider ===
✓ blockNumber 13, status=1

=== Step 6: Submit Proof ===
✓ blockNumber 14, proofHash=0xe17a93c46ef76489062712607992b08f5ce7981a33a9d9f322a8d625e84591bd

=== Step 7: Complete Job ===
✓ blockNumber 15, status=1

=== Step 8: Seller Balance ===
✓ Raw: 10000000000000000000 [1e19]
✓ Balance in USDC: 10.00

=== Step 9: Job State ===
✓ State: 4 (Completed)
✓ Buyer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
✓ Provider: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✓ Amount: 10000000000000000000 [1e19]
✓ Deliverable Hash: 0xe17a93c46ef76489062712607992b08f5ce7981a33a9d9f322a8d625e84591bd
✓ Proof Hash: 0xe17a93c46ef76489062712607992b08f5ce7981a33a9d9f322a8d625e84591bd
```

---

## 提交指引

### 运行方式
```bash
# 1. 启动 Anvil
anvil --silent &

# 2. 部署合约
cd /home/administrator/Documents/trae_projects/PrismSettle/contracts
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --legacy

# 3. 执行完整 demo（使用 demo-minimal.sh）
bash scripts/demo-minimal.sh
```

### 关键代码位置
- 合约：`/home/administrator/Documents/trae_projects/PrismSettle/contracts/src/`
  - PrismSettleJob.sol (270 行)
  - PrismSettleRegistry.sol (434 行)
  - ArbitrationHook.sol (156 行)
- 测试：`/home/administrator/Documents/trae_projects/PrismSettle/contracts/test/Integration.t.sol`
- Demo 脚本：`/home/administrator/Documents/trae_projects/PrismSettle/scripts/demo-minimal.sh`
- 任务文档：`/home/administrator/monad-cohort-zane/tasks/technical/week-2/prismsettle-minimal-prototype.md`

### 技术亮点
1. **256-shard storage 演示**：Job #0 存储在 shard 0（jobId & 0xFF = 0），展示分片写入机制
2. **状态机一致性**：每个步骤都有前置条件检查（state == Created/Funded/Assigned/Submitted）
3. **Evaluator 角色验证**：complete() 需要 COMMERCE_EVALUATOR_ROLE，确保只有授权方才能结算
4. **x402 双路径**：fundViaToken 支持直接 ERC20 或 x402 receipt 路由

---

## 附录：部署信息

| 合约 | 地址 |
|------|------|
| MockERC20 | 0x0165878A594ca255338adfa4d48449f69242Eb8F |
| Registry | 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 |
| ArbitrationHook | 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 |
| PrismSettleJob | 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318 |

| 账户 | 用途 |
|------|------|
| 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | Buyer / Evaluator (account #0) |
| 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | Seller (account #1) |
| 0x64aAfc43c2FDb7BF4dcbAeF50683C669a6BbAc4e | Custom evaluator |
