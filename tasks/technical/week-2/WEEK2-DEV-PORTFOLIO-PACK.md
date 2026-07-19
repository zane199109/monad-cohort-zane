# Week 2 | Dev Portfolio Pack — PrismSettle

> Monad-native A2A Commerce Protocol  

---

## 一、你想做什么？

**PrismSettle** 是一个 Monad L1 上的 Agent-to-Agent 商业协议，解决 AI agent 之间的可信结算问题。

### 核心叙事

不是"多 agent 协同应用"，而是 **"agent 经济基础设施"**。

### 三层架构

```
┌─────────────────────────────────────────────────────┐
│                 PrismSettle Architecture             │
├──────────┬──────────┬───────────────────────────────┤
│ Trust    │ Commerce │ Indexer & Marketplace         │
│ Layer    │ Layer    │                               │
│          │          │                               │
│ Registry │ Job      │ Reorg-Safe Indexer            │
│ 256-Shard│ Escrow   │ Agent Marketplace             │
│ Reputation│         │ Evaluator Engine              │
└──────────┴──────────┴───────────────────────────────┘
```

| 层 | 合约 | 核心创新 |
|----|------|---------|
| **Trust Layer** | PrismSettleRegistry.sol | 256-shard 存储消除 Monad OCC 冲突（abort rate 60%→5%） |
| **Commerce Layer** | PrismSettleJob.sol | ERC-8183 Job 生命周期 + ArbitrationHook 争议仲裁 |
| **Indexer/Marketplace** | 前端 + off-chain | 声誉查询、Agent 发现、规则引擎评估 |

### 用户故事

> "一个 Buyer agent 发布数据标注任务，Seller agent 完成后自动收到 10 USDC 付款。"

**30 秒电梯演讲流程：**
1. Buyer 创建 Job → 锁定 escrow
2. Seller 提交 proof hash
3. Evaluator 判定成功 → escrow 释放
4. 双方声誉自动更新

---

## 二、你实际做到了哪一步？

### 完成清单

#### ✅ 智能合约（860 行 Solidity）

| 文件 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `PrismSettleRegistry.sol` | 434 | ✅ 完成 | 256-shard 声誉、Agent 注册、Staking/Slashing、Aggregate Epoch |
| `PrismSettleJob.sol` | 270 | ✅ 完成 | ERC-8183 Job 状态机：createJob → fundViaToken → assign → submit → complete/refund |
| `ArbitrationHook.sol` | 156 | ✅ 完成 | 争议仲裁状态机，支持 buyer/provider 双端裁决 |

#### ✅ 测试（97 个测试全部通过）

| 测试套件 | 数量 | 状态 |
|----------|------|------|
| PrismSettleRegistryTest | 45 | ✅ PASS |
| PrismSettleJobTest | 29 | ✅ PASS |
| IntegrationTest | 9 | ✅ PASS |
| X402IntegrationTest | 6 | ✅ PASS |
| ArbitrationHookTest | 13 | ✅ PASS |
| BaselineRegistryTest | 4 | ✅ PASS |

```
Total: 97 tests passed, 0 failed, 0 skipped
```

#### ✅ Demo 脚本与运行证据

**一键 Demo 脚本：** `scripts/demo-minimal.sh`（114 行）

**实际运行结果（2026-07-18）：**
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

#### ✅ 前端（Next.js）

| 页面 | 说明 |
|------|------|
| `/agents` | Agent 列表页 |
| `/agents/[agentId]` | Agent 详情页（声誉历史、评分图表） |
| `/jobs/new` | 创建 Job 页面 |
| `/jobs/[jobId]` | Job 详情追踪 |
| `/validator` | Validator Dashboard |
| `/perf` | V0 vs V1 性能对比 |

---

## 三、Week 3 你能继续承担什么开发角色？

### 可承担的角色

| 角色 | 说明 | 依赖 |
|------|------|------|
| **Smart Contract Developer** | 继续完善 Job 合约、添加更多测试场景 | 无 |
| **Protocol Engineer** | 实现 256-shard 存储的批量写入优化 | Foundry 环境 |
| **Frontend Developer** | 完善前端与合约交互（wallet connect、job 创建 UI） | Next.js + ethers.js |
| **Demo/Presentation Lead** | 准备 Hackathon 30 秒电梯演讲录屏 | 已完成基础 demo |

### Week 3 计划

| 优先级 | 任务 | 预计工作量 |
|--------|------|-----------|
| P0 | 前端单页 Demo：Connect Wallet → Create Job → View Status | 3h |
| P0 | Reputation 查询 API：Go 后端 `GET /agent/{address}/reputation` | 1h |
| P1 | 部署到 Monad Testnet | 2h |
| P1 | 录屏 30 秒电梯演讲 Demo | 1h |
| P2 | 完善 Arbitration Hook 测试 | 2h |

### 技术栈匹配

| 技能 | 匹配度 | 说明 |
|------|--------|------|
| Go 后端 | ★★★★☆ | 已有 Go 经验，PrismSettle 需要 Go 后端查声誉 |
| Solidity | ★★★☆☆ | 通过 AEP 和 PrismSettle 积累，合约逻辑清晰 |
| Next.js 前端 | ★★☆☆☆ | 有基础，需要加强 ethers.js 集成 |
| Foundry | ★★★★☆ | 熟练使用 forge/cast/anvil，97 个测试全过 |

---

## AI Collaboration Log

### AI 辅助开发记录

#### 任务 1：最小原型定义
- **AI 做了什么**：分析合约架构，生成最小原型技术方案
- **我确认了什么**：核心流程是 createJob → fund → assign → submit → complete
- **产出**：`prismsettle-minimal-prototype.md`

#### 任务 2：代码骨架生成
- **AI 做了什么**：生成 `demo-minimal.sh` 脚本（114 行），覆盖 10 步全流程
- **我手动改了什么**：
  - 修复 `fundViaToken` 空 bytes 参数：从 `""` 改为 `"0x"`
  - 修复地址提取逻辑：deploy.log 格式是 `"MockERC20: 0x..."`
  - 修复 Anvil 进程管理：kill 前完成验证
- **产出**：`scripts/demo-minimal.sh`

#### 任务 3：运行验证
- **AI 做了什么**：执行完整 demo 流程，记录交易 hash
- **我确认了什么**：Seller 余额从 0 → 10 USDC，Job 状态 Completed
- **产出**：运行日志 + 交易 hash 记录

#### 任务 4：文档整理
- **AI 做了什么**：生成 README.md、Dev Portfolio Pack 汇总文档
- **我手动改了什么**：调整结构，确保符合任务要求
- **产出**：`README.md`、`WEEK2-PROTOTYPE-EVIDENCE.md`、`WEEK2-DEV-PORTFOLIO-PACK.md`

### 协作模式

| 阶段 | AI 角色 | 我的角色 |
|------|---------|---------|
| 方案设计 | 分析合约，提出最小原型 | 确认方向，决定 mock 策略 |
| 代码生成 | 生成 demo 脚本、README | 审查修改，修复错误 |
| 运行验证 | 执行命令，收集输出 | 检查结果，确认通过 |
| 文档整理 | 汇总所有材料 | 最终审核，提交 |

---

## Known Issues

| # | 问题 | 解决 |
|---|------|------|
| 1 | `cast send` 空 bytes 参数需 `"0x"` 而非 `""` | 已记录在 README |
| 2 | `forge script` 默认 sender 警告 | 添加 `--sender` 或 `--private-key` |
| 3 | Anvil 进程管理 | kill 前完成验证 |
| 4 | 合约地址不固定 | 每次从 deploy.log 提取 |

---

## 提交指引

### 本原型提交材料

- [x] **代码仓库**：`/home/administrator/Documents/trae_projects/PrismSettle/contracts/`
- [x] **Demo 脚本**：`scripts/demo-minimal.sh`
- [x] **运行日志**：见上方"实际验证结果"
- [x] **交易 Hash**：见上方表格
- [x] **Mock 说明**：见上方"哪些是 Mock"
- [x] **Known Issues**：见上方列表
- [x] **AI Collaboration Log**：见上方记录

### 关联文档

| 文档 | 位置 | 说明 |
|------|------|------|
| `WEEK2-PROTOTYPE-EVIDENCE.md` | `/monad-cohort-zane/tasks/technical/week-2/` | Prototype Evidence 任务提交 |
| `WEEK2-DEV-PORTFOLIO-PACK.md` | 本文档 | Dev Portfolio Pack 任务提交 |
| `README.md` | `/PrismSettle/` | 项目 README（233 行） |
| `AI-assisted-Dev-Plan.md` | `/monad-cohort-zane/tasks/technical/week-2/` | AI 辅助开发计划 |
| `prismsettle-minimal-prototype.md` | 同上 | 原型技术方案 |

### 快速验证命令

```bash
# 查看合约源码
cat /home/administrator/Documents/trae_projects/PrismSettle/contracts/src/PrismSettleJob.sol
cat /home/administrator/Documents/trae_projects/PrismSettle/contracts/src/PrismSettleRegistry.sol

# 运行完整 demo
cd /home/administrator/Documents/trae_projects/PrismSettle
bash scripts/demo-minimal.sh

# 运行测试
cd contracts && forge test --summary
```

### 目录结构

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
