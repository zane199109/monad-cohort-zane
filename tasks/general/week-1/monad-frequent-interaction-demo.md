# Week 1 — 高频交互场景研究：AI Agent 任务系统

**轨道：** tech  
**对应任务：** Research / Tech 提交  
**日期：** 2026-07-10
**目标：** 选择 Monad 高频交互场景，提交 Research 说明 + Tech Demo 功能清单

**前置任务：** [`monad-testnet-deploy.md`](./monad-testnet-deploy.md)（了解 Monad Testnet 部署流程）

* * *

## 任务说明

根据 BuildAnything Freshman Day 5 要求：选择一个你认为适合 Monad 的高频交互场景，说明为什么它可能更适合在 Monad 上构建。

**选择方向：** AI Agent 交互 + Tech
**提交类型：** Research（300 字说明）+ Tech（Demo 功能清单）

* * *

## 1. Research：为什么 Monad 更适合 AI Agent 高频交互

AI Agent 是 Consumer Crypto 中最具潜力的方向之一。Agent 需要与链上系统进行高频、低延迟的交互——提交任务、执行证明、领取奖励、更新状态。每笔交易都需要实时反馈，Agent 才能做下一步决策。

如果链很慢（10-30 秒确认）或手续费高（gas > 奖励），Agent 无法实时决策，经济模型也会崩溃。批量分发奖励时，N 笔交易 = N 倍 gas，管理员成本过高。

Monad 的高 TPS（>10,000）和低延迟（秒级确认）让 Agent 可以每秒提交多个任务并获得即时反馈。EVM 兼容性让 Agent 直接使用标准钱包和工具链。低 gas 让微交易变得可行——Agent 每完成一个小任务都能获得奖励，而不会被 gas 吃掉利润。

**为什么需要链上记录而不是普通数据库：** 任务执行需要可验证的证明（proof_hash），奖励发放需要透明不可篡改的记录，声誉系统需要跨应用共享的信任基础，审计追踪需要链上不可变的历史。这些都是普通数据库无法提供的。

**关键理解：**
1. AI Agent 是天然的高频交互用户 — 基于经济激励理性执行任务
2. 低 gas 是微交易的前提 — 否则经济模型崩溃
3. 秒级确认影响 Agent 决策 — 需要实时反馈
4. 链上记录不可替代 — 需要可验证性、透明性、跨应用信任
5. 批量操作的重要性 — 管理员分发奖励时，批量功能节省大量 gas

* * *

## 2. Tech Demo 功能清单：AgentQuest — 基于 PrismSettle 的简化版

> 灵感来源：PrismSettle 的 Commerce 层（任务生命周期 + 声誉徽章 + 批量分发），简化为 AI Agent 场景。

### 2.1 从 PrismSettle 提取的核心概念

| PrismSettle 概念 | AgentQuest 简化版 | 用途 |
|-----------------|-------------------|------|
| Registry — Agent 注册 + 声誉分数 | Agent 注册 + 声誉徽章 | 链上身份和声誉 |
| Job 生命周期（Created→Funded→Assigned→Submitted→Completed/Refunded） | Quest 生命周期（创建→分配→证明→完成） | 任务执行流程 |
| submitValidation（高频路径） | proveTaskCompleted（提交 proof_hash） | Agent 执行任务证明 |
| aggregateEpoch（低频聚合） | 声誉累积（完成 N 个任务升级徽章） | 声誉升级 |
| ArbitrationHook（争议仲裁） | Owner 手动审核（V1 简化） | 争议处理 |
| 批量 airdrop | 批量徽章分发 | 管理员高效分发 |

### 2.2 核心功能清单

#### 模块一：Agent 注册与声誉（基于 Registry 简化）

| # | 功能 | 来源 | 简化说明 |
|---|------|------|---------|
| 1 | `registerAgent(address, string metadata)` | Agent 注册 | 任何人可注册，owner 设为注册者 |
| 2 | `getAgent(uint256 agentId) → (owner, reputation, questCount)` | 查询 | 返回 Agent 基本信息 |
| 3 | `updateReputation(uint256 agentId, int256 delta)` | 声誉更新 | Owner/Evaluator 调用，正数加分负数扣分 |
| 4 | `reputationToBadge(uint256 reputation) → uint256 typeId` | 声誉→徽章映射 | 不同声誉区间对应不同 badge type |

#### 模块二：Quest 任务生命周期（基于 PrismSettleJob 简化）

| # | 功能 | 来源 | 简化说明 |
|---|------|------|---------|
| 5 | `createQuest(string description, uint256 reward, uint64 deadline)` | createJob | 创建任务，状态 Created |
| 6 | `assignQuest(uint256 questId, address agent)` | assign | 分配给 Agent，状态 Assigned |
| 7 | `proveTaskCompleted(uint256 questId, bytes32 proofHash)` | submit | Agent 提交 proof_hash，状态 Submitted |
| 8 | `completeQuest(uint256 questId)` | complete | Owner/Evaluator 验证后完成，触发奖励 |
| 9 | `claimRefund(uint256 questId)` | claimRefund | 超时未完成的退款 |

#### 模块三：奖励与徽章（结合 NFTBadge）

| # | 功能 | 来源 | 简化说明 |
|---|------|------|---------|
| 10 | `distributeReward(uint256 questId)` | complete 内部 | 完成后自动 mint 声誉徽章 |
| 11 | `airdropBadges(uint256 typeId, address[] recipients)` | NFTBadge.airdrop | 批量分发徽章（如 Hackathon 参与者） |
| 12 | `batchMintBadges(address to, uint256 typeId, uint256 amount)` | NFTBadge.mintBatch | 同一 Agent 多次完成任务累积徽章 |

#### 模块四：查询接口

| # | 功能 | 说明 |
|---|------|------|
| 13 | `getQuest(uint256 questId) → (description, agent, proofHash, deadline, state)` | 查询任务状态 |
| 14 | `getAgentStats(address agent) → (agentId, reputation, questCount, badgeTypes[])` | 查询 Agent 统计 |
| 15 | `tokensOfOwner(address owner) → uint256[]` | 列出所有持有徽章（来自 NFTBadge） |
| 16 | `hasBadge(address, uint256) → bool` | 检查是否拥有某类徽章（来自 NFTBadge） |

### 2.3 合约架构

```
AgentQuest inherits NFTBadge {
    // === Agent 管理 ===
    struct Agent {
        uint256 agentId;
        address owner;
        int256 reputation;        // 声誉分数
        uint64 questCount;        // 完成任务数
        uint64 registeredAt;      // 注册时间
    }
    
    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public agentByOwner;  // address → agentId
    
    // === Quest 生命周期 ===
    enum QuestState { Created, Assigned, Submitted, Completed, Refunded }
    
    struct Quest {
        uint256 questId;
        address creator;          // 任务创建者
        uint256 agentId;          // 分配的 Agent
        uint256 reward;           // 奖励（USDC 金额 V2 接入）
        bytes32 proofHash;        // 执行证明
        uint64 deadline;          // 截止时间
        QuestState state;
        uint64 createdAt;
    }
    
    mapping(uint256 => Quest) public quests;
    mapping(uint256 => uint256[]) public agentQuests;  // agentId → questIds
    
    // === 权限角色 ===
    bytes32 public constant EVALUATOR_ROLE = keccak256("EVALUATOR_ROLE");
    
    // === 核心函数 ===
    function registerAgent(string calldata metadata) external returns (uint256)
    function createQuest(string calldata description, uint256 reward, uint64 deadline) external
    function assignQuest(uint256 questId, uint256 agentId) external
    function proveTaskCompleted(uint256 questId, bytes32 proofHash) external
    function completeQuest(uint256 questId) external onlyEvaluator
    function claimRefund(uint256 questId) external
    function updateReputation(uint256 agentId, int256 delta) external onlyOwner
    function reputationToBadge(uint256 reputation) external pure returns (uint256)
    
    // === Events ===
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string metadata);
    event QuestCreated(uint256 indexed questId, address indexed creator, uint256 reward);
    event QuestAssigned(uint256 indexed questId, uint256 indexed agentId);
    event TaskProven(uint256 indexed questId, bytes32 proofHash);
    event QuestCompleted(uint256 indexed questId, uint256 indexed agentId, uint256 reward);
    event QuestRefunded(uint256 indexed questId);
    event ReputationUpdated(uint256 indexed agentId, int256 delta, int256 newReputation);
}
```

### 2.4 声誉→徽章映射规则

| 声誉区间 | Badge Type | 含义 |
|---------|-----------|------|
| 0-99 | Rookie | 刚注册，零任务 |
| 100-499 | Contributor | 完成 1-5 个任务 |
| 500-999 | Pro | 完成 6-20 个任务 |
| 1000-4999 | Expert | 完成 21-100 个任务 |
| 5000+ | Legend | 完成 100+ 任务 |

> 每个 Agent 完成任务后自动 mint 对应声誉区间的徽章。如果声誉下降（如被扣分），下次完成新任务时 mint 降级后的徽章。

### 2.5 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 合约语言 | Solidity 0.8.20 | 与 NFTBadge 兼容 |
| 开发工具 | Foundry | 编译、测试、部署一体化 |
| 前端框架 | Vanilla JS + ethers.js v5 | 轻量，复用 NFTBadge 前端架构 |
| 钱包集成 | MetaMask | 标准 EVM 钱包 |
| 链上存储 | Monad Testnet | 低 gas，高 TPS，EVM 兼容 |

### 2.6 实现优先级

| 阶段 | 功能 | 预计工作量 |
|------|------|-----------|
| Phase 1 | Agent 注册 + Quest 创建/分配/证明/完成 | 2-3 天 |
| Phase 2 | 声誉系统 + 徽章自动分发 | 2-3 天 |
| Phase 3 | 批量分发 + 前端查询界面 | 2-3 天 |

### 2.7 与 NFTBadge 的关系

AgentQuest 复用 NFTBadge 作为底层徽章系统：
- NFTBadge 提供：badge type 管理、mint/airdrop/batchMint、tokensOfOwner 查询
- AgentQuest 提供：Agent 注册、Quest 生命周期、声誉计算、自动徽章分发
- AgentQuest 通过 `NFTBadge minter` 角色调用 `mint()` 自动发放声誉徽章

### 2.8 参考资源

- Monad Docs — Differences between Monad and Ethereum：https://docs.monad.xyz/developer-essentials/differences
- Monad Docs — Best Practices for High Performance Apps：https://docs.monad.xyz/developer-essentials/best-practices
- Monad Docs — Gas Pricing：https://docs.monad.xyz/developer-essentials/gas-pricing
- BuildAnything Freshman — 什么是 Monad？：https://buildanything.so/zh/tracks/freshman
- BuildAnything Freshman — 10,000 TPS 会让什么成为可能：https://buildanything.so/zh/tracks/freshman
- AI Agent 与区块链：https://www.coingecko.com/learn/ai-crypto-blockchain
