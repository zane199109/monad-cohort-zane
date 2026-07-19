# Week 2 Role Log

**状态：** 进行中
**学分：** 10
**周期：** 2026-07-13 ~ 2026-07-17

---

## 方向

Dev Builder

---

## 记录

### 2026-07-13

**资料链接：**
- Week 2 课程页面：https://web3career.build/zh/programs/Web3-Summer-Intership-Progra?tab=learning&taskFilter=submitted
- Monad Developer Docs：https://docs.monad.xyz/
- Foundry Book：https://book.getfoundry.sh/

**Prompt：**
- "阅读 Week 2 Dev 方向全部内容，梳理下周的学习计划"

**截图：**
- （暂无）

**错误：**
- （暂无）

**判断变化：**
- 初始想法：Week 2 是学新技能
- 调整后：Week 2 的本质是建立可复现的开发 + AI 协作 + 证据记录工作流，不是学新技术

**下一步计划：**
- 完成 Role Choice Card
- 完成 AI Collaboration Log v1
- 确定 Dev Plan 原型选题

---

### 2026-07-14

**资料链接：**
- Moss GitHub：https://github.com/nishuzumi/moss
- Moss README (EN)：https://github.com/nishuzumi/moss/blob/main/README.md
- Moss Getting Started：https://github.com/nishuzumi/moss/blob/main/docs/getting-started.md
- Moss Agent Skill Guide：https://github.com/nishuzumi/moss/blob/main/docs/agent-skill.md

**Prompt：**
- "阅读 Moss 的 README 和官方文档，了解项目为什么存在、解决了什么问题，以及 AI Agent 为什么需要这样一个框架"
- "分析 Moss GitHub open issues 的分布，推断项目路线图"

**截图：**
- Star 截图：tasks/technical/week-2/images/star.png

**错误：**
- gh CLI OAuth token 过期，无法程序化 star，改用浏览器手动操作

**判断变化：**
- 最初认为 Moss 只是"Bonus 开源贡献"任务，深入研究后发现其能力层抽象思路（人类可读参数 → 自动组装交易 + 模拟验证）对理解 Agent 经济基础设施有启发意义
- Dev Plan 选题从"什么都可以做"收敛到"Registry 合约 v1 是最小可行产出"

**下一步计划：**
- 完成 Role Choice Card
- 完成 AI Collaboration Log v1
- 确定 Dev Plan 原型选题

---

### 2026-07-15

**资料链接：**
- Moss ADR 0001~0009：https://github.com/nishuzumi/moss/tree/main/docs/adr
- CONTEXT.md：https://github.com/nishuzumi/moss/blob/main/CONTEXT.md

**Prompt：**
- "阅读 Moss 的 9 篇 ADR，整理术语表和架构演进脉络"
- "对比旧架构（Plan/Expects/Effects）和新架构（Capability Tree/Receipt）的差异"

**截图：**
- （暂无）

**错误：**
- 无

**判断变化：**
- 理解了 Moss 从"声明式安全"（Expects vs Effects）到"解析式安全"（Receipt from Changes）的演进逻辑
- 注意到 7/15 的笔记基于旧架构，后续会被 PR #31 推翻
- 意识到跟踪主分支最新提交很重要，不能只看某个时间点的文档

**下一步计划：**
- 走查 Getting Started 文档
- 验证 Moss 开发环境搭建流程

---

### 2026-07-16

**资料链接：**
- Moss Getting Started：https://github.com/nishuzumi/moss/blob/main/docs/getting-started.md
- PR #28/29 diff：https://github.com/nishuzumi/moss/pull/29

**Prompt：**
- "按 10-step 流程验证 Moss 开发环境搭建"
- "审查 PR #29 的 fetch-abi CLI 实现，对比我的方案"

**截图：**
- （暂无）

**错误：**
- 无

**判断变化：**
- 确认 fetch-abi CLI 应该用依赖注入模式（run(argv, env, deps)），而不是 spawn 子进程测试
- 理解了 vendored ABI pipeline（update:abis → gen:abis → test）是 Kuru 当前使用的流程
- 认识到 fetch-abi CLI 是 explorer tier 的补充，适用于没有 SDK 但有验证合约的场景

**下一步计划：**
- 实现 fetch-abi CLI（Issue #28）
- 阅读 PR #31 最新架构重构

---

### 2026-07-17

**资料链接：**
- PR #31 diff：https://github.com/nishuzumi/moss/pull/31
- ADR 0010/0011/0012：https://github.com/nishuzumi/moss/tree/main/docs/adr
- CONTEXT.md（PR #31 后版本）：https://github.com/nishuzumi/moss/blob/main/CONTEXT.md

**Prompt：**
- "审查 PR #31 全量 diff（+5396/-4199 行，126 文件），分析架构变更"
- "实现 fetch-abi CLI：repository-level CLI，通过 Monadscan Etherscan V2 API 获取验证过的合约 ABI"

**截图：**
- （暂无）

**错误：**
- WSL 代理问题：Node.js fetch 失败但 curl 可以，无法用真实地址跑通 CLI

**判断变化：**
- PR #31 完全重写了 Moss 架构：Capability tree + Receipt parser 替代 Plan + Expects + Effects reconciliation
- ProtocolRef 依赖注入替代 Step builder，Registry.use() 扫描 exports 替代 Manifest registration
- TokenReference（address | "native"）替代 Token table，Parameter type/description 分离
- 三层安全机制：编译时类型安全 → 运行时结构验证 → 模拟时执行验证
- Fetch-ABI CLI 17 个测试全部通过，但需要解决 WSL 代理问题才能用真实地址验证

**下一步计划：**
- 解决 WSL 代理问题，用真实 Monad 地址验证 fetch-abi CLI
- Commit + push fetch-abi-cli 分支，开 PR
- 阅读 ADR 0010/0011/0012 原文，验证笔记中的理解
- 选择下一个 issue 推进（推荐 #38 Aave v3 lending adapter 或 #32 shMONAD staking adapter）

---
