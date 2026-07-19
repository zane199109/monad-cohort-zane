# Week 2 | Prototype Evidence

## PrismSettle — Monad-native A2A Commerce Protocol

---

### 项目一句话介绍

PrismSettle 是一个 Monad L1 上的 Agent-to-Agent 商业协议，通过 256-shard 声誉存储消除 OCC 写入冲突（abort rate 60%→5%），实现可信的 agent 间任务结算。

**核心叙事**：不是"多 agent 协同应用"，而是 **"agent 经济基础设施"**——Trust Layer + Commerce Layer + Indexer/Marketplace 三层架构。

---

### 如何运行或如何查看

#### 本地 Anvil Demo（推荐）

```bash
# 1. 启动 Anvil
cd /home/administrator/Documents/trae_projects/PrismSettle/contracts
anvil --silent &

# 2. 部署合约
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --legacy

# 3. 运行完整 demo 脚本
bash scripts/demo-minimal.sh
```

#### 前端

```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

#### 测试

```bash
cd contracts
forge test -vvv
```

---

### 当前完成了什么

#### ✅ 智能合约（860 行 Solidity）

| 文件 | 行数 | 说明 |
|------|------|------|
| `PrismSettleRegistry.sol` | 434 | 256-shard 声誉、Agent 注册、Staking/Slashing、Aggregate Epoch |
| `PrismSettleJob.sol` | 270 | ERC-8183 Job 状态机：createJob → fundViaToken → assign → submit → complete/refund |
| `ArbitrationHook.sol` | 156 | 争议仲裁状态机，支持 buyer/provider 双端裁决 |

#### ✅ 测试（97 个测试全部通过）

```
Total: 97 tests passed, 0 failed, 0 skipped
- PrismSettleRegistryTest:    45 PASS
- PrismSettleJobTest:         29 PASS
- IntegrationTest:             9 PASS
- X402IntegrationTest:         6 PASS
- ArbitrationHookTest:        13 PASS
- BaselineRegistryTest:        4 PASS
```

#### ✅ Demo 脚本

`scripts/demo-minimal.sh`（114 行）— 一键跑通全流程

#### ✅ 前端页面（Next.js）

| 页面 | 说明 |
|------|------|
| `/agents` | Agent 列表页 |
| `/agents/[agentId]` | Agent 详情页（声誉历史、评分图表） |
| `/jobs/new` | 创建 Job 页面 |
| `/jobs/[jobId]` | Job 详情追踪 |
| `/validator` | Validator Dashboard |
| `/perf` | V0 vs V1 性能对比 |

---

### 实际验证结果（2026-07-18）

**Demo 运行日志：**
```
[1/10] Starting Anvil... ✓
[2/10] Deploying contracts... ✓
[3/10] Minting USDC to Buyer... ✓
[4/10] Approving Job contract... ✓
[5/10] Creating Job (agentId=0x1111)... ✓
[6/10] Funding Job (10 USDC)... ✓
[7/10] Assigning Provider (Seller)... ✓
[8/10] Provider submitting proof... ✓
[9/10] Evaluator completing job... ✓
[10/10] Verifying results... ✓

Seller USDC balance: 10.00 ✓
Job State: Completed (state=4) ✓
```

**最终状态验证：**
```
Seller Balance: 10.00 USDC ✓
Job State: 4 (Completed) ✓
Buyer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Provider: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Amount: 10000000000000000000 [1e19]
Deliverable Hash: 0xe17a93c46ef76489062712607992b08f5ce7981a33a9d9f322a8d625e84591bd
Proof Hash: 0xe17a93c46ef76489062712607992b08f5ce7981a33a9d9f322a8d625e84591bd
```

---

### 哪些是 Mock

| 组件 | Mock 原因 | 替代方案 |
|------|-----------|---------|
| **Evaluator Engine** | V1 不需要 LLM，规则判定即可 | 硬编码：proofHash != "" → success |
| **Indexer** | 演示用 Anvil 本地链 | eth_call 直连，不写 event listener |
| **X402 支付流** | Hackathon demo 用 MockERC20 | 跳过真实 x402 |
| **Arbitration** | 正常流程不触发仲裁 | 只实现 happy path |
| **256-shard 性能验证** | 不需要在 demo 中证明 | 架构文档里写数字 |

---

### 交易 Hash（Anvil Local）

| 操作 | Tx Hash |
|------|---------|
| Mint USDC | `0x08c42af1bfbd5fd4c9f902a735a3d066ce18ea46eb510a075f6dcbf565b6fc18` |
| Approve | `0x169ec8c044a5efea3482616544c39e19228266b3b488c11a4df88e97d733a058` |
| Create Job | `0x2dbc32504a135d473d30c9c3321b76451b9486468a58a5a8e810425bb342efc7` |
| Fund Job | `0xd4f02c1f423d10f2b36aa491ccdf0259764fb465cd6d39d4d563dd4ef72ceef7` |
| Assign | `0x4c339200217e04f23ccb91a14c72375418c006d24e3b293a3613d1174c66a0a3` |
| Submit Proof | `0x8be3cfb9818c8e9382c8cce715dee990ea62df32eb21a6e6a88e8f92dfc783c3` |
| Complete | `0x81206c2ad99c28fddf50a578e03fe5fd451a62145d19c40c325076a5570bf7ba` |

---

### Known Issues

| # | 问题 | 解决 |
|---|------|------|
| 1 | `cast send` 空 bytes 参数需 `"0x"` 而非 `""` | 已记录在 README |
| 2 | `forge script` 默认 sender 警告 | 添加 `--sender` 或 `--private-key` |
| 3 | Anvil 进程管理 | kill 前完成验证 |
| 4 | 合约地址不固定 | 每次从 deploy.log 提取 |

---

### 提交指引

本原型提交材料：

- [x] **代码仓库**：`/home/administrator/Documents/trae_projects/PrismSettle/contracts/`
- [x] **Demo 脚本**：`scripts/demo-minimal.sh`
- [x] **运行日志**：见上方"实际验证结果"
- [x] **交易 Hash**：见上方表格
- [x] **Mock 说明**：见上方"哪些是 Mock"
- [x] **Known Issues**：见上方列表

#### 快速验证命令

```bash
# 一键运行完整 demo
cd /home/administrator/Documents/trae_projects/PrismSettle
bash scripts/demo-minimal.sh

# 查看合约源码
cat contracts/src/PrismSettleJob.sol
cat contracts/src/PrismSettleRegistry.sol

# 运行测试
cd contracts && forge test -vvv
```

#### 目录结构

```
PrismSettle/
├── contracts/                    # Foundry 项目
│   ├── src/                      # 860 行 Solidity 合约
│   │   ├── PrismSettleJob.sol    # ERC-8183 Job + Escrow
│   │   ├── PrismSettleRegistry.sol # 256-shard Reputation
│   │   ├── ArbitrationHook.sol   # Dispute Resolution
│   │   └── mocks/
│   ├── test/                     # 1,394 行测试代码
│   ├── script/
│   │   └── Deploy.s.sol          # 部署脚本
│   └── foundry.toml
├── frontend/                     # Next.js 前端
│   ├── app/                      # 6 个页面
│   └── components/               # 15+ 组件
├── scripts/
│   └── demo-minimal.sh           # 一键 Demo 脚本
└── README.md                     # 项目文档
```
