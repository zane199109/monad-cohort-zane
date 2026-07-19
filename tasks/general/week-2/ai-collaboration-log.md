# AI Collaboration Log

**状态：** 进行中
**学分：** 20
**日期：** 2026-07-13

---

## 协作概述

**任务：** 阅读 Week 2 Dev 方向全部内容，梳理下周学习计划

**使用的 AI 工具：** Hermes + Trae IDE + GLM 5.2模型

---

## AI 帮了什么

1. **内容抓取**：通过 curl 抓取 web3career.build 页面 HTML，从中提取 Week 2 Dev 方向的完整课程内容（5 天任务、推荐资料、产出物、分值）
2. **结构化梳理**：将抓取的原始内容整理成清晰的表格（5 天任务总览）和逐日分解
3. **上下文关联**：读取 monad-cohort-zane 项目的现有笔记（Week 1 build log、mini demo、TASKS.md），将 Week 2 任务与已有项目经验（AEP、PrismSettle、Foundry）关联起来
4. **格式建议**：根据 GitHub web editor 对 ``` 代码块的处理限制，建议使用 > 引用块替代代码块
5. **文件管理**：创建/移动笔记文件到正确的 notes/week-2/ 目录，清理旧文件
6. **Moss 架构分析**（7/14-7/17）：通过 curl + jq 解析 GitHub API 获取 open issues、PR diff、commit history；对比 PR #29 和 PR #31 的架构差异；提取 ADR 术语变更对照表
7. **Fetch-ABI CLI 实现**（7/17）：依赖注入模式设计、17 个测试用例编写、redact() 安全防护、退出码 0/1/2 分类

---

## 人类删改 / 核查了什么

1. **目录路径确认**：AI 最初将笔记放在 notes/week-2/，我指出文件已移动到 notes/week-1/2026-07-12.md，AI 清理了旧文件。之后我纠正：今天是 7 月 13 号，笔记应放在 week-2 目录下，AI 重新创建了正确路径的文件
2. **预习 vs 正式任务区分**：AI 默认按"已开始执行任务"的语气撰写，我明确指出"今天只是预习，梳理。不是真的开始任务。"AI 调整了措辞
3. **推荐资料完整性**：AI 初始版本只列了 6 条资料，我提供了完整 10 条原文，AI 补全了 Remix IDE、Hardhat Docs、GitHub、ChatGPT
4. **总结段落**：我要求在学习计划末尾加一个总结段，AI 生成了 4 点核心逻辑的总结
5. **文件命名和日期**：笔记文件名从 2026-07-12 改为 2026-07-13，目录从 week-1 改为 week-2

---

## 哪些不能交给 AI

1. **方向选择判断**：选择 Dev 方向是基于个人背景（Monad Hackathon 一等奖、Foundry/Solidity 熟练、Go 后端经验、PrismSettle 项目），AI 不了解这些背景，需要我主动提供
2. **任务优先级决策**：Week 2 是预习还是正式执行，这个判断需要我自己决定
3. **Week 3 角色定位**：在团队中能承担什么角色、需要什么队友，这是基于对项目需求的理解，AI 只能辅助整理表述
4. **原型选题**：PrismSettle Registry 还是 256-shard 分片逻辑 demo，需要根据实际项目进度和兴趣决定，AI 只能给建议

---

## 反思

AI 在信息抓取、结构化、文件管理方面效率很高，但方向性判断、优先级决策、个人背景相关的选择必须由人类完成。最省力的协作方式是：人类提供背景和目标，AI 负责执行和信息整理。

---

## 后续协作（7/14-7/17）

### 7/14 — Moss 开源项目研究
- **人类做了什么**：阅读 Moss README、Getting Started、Agent Skill Guide；分析 open issues 分布
- **AI 做了什么**：curl 解析 GitHub API 获取 issues/tags；整理贡献规则（commit 格式、changeset、CI）
- **关键判断**：Moss 不是"Bonus 开源贡献"，而是理解 Agent 经济基础设施能力层抽象的参考项目

### 7/15 — Moss ADR 学习笔记（0001~0009）
- **人类做了什么**：阅读并理解 9 篇 ADR，记录架构演进脉络
- **AI 做了什么**：curl 拉取 ADR 原文；整理术语表（Capability tree、TransactionNode、Handle、Plan、Expects 等）；对比新旧架构差异
- **关键判断**：7/15 的笔记基于旧架构（Plan/Expects），后续被 PR #31 推翻，说明需要跟踪主分支最新提交

### 7/16 — Moss Getting Started 走查 + PR 流程学习
- **人类做了什么**：按 10-step 流程验证 Moss 开发环境搭建
- **AI 做了什么**：curl 拉取 PR #28/29 diff；对比 fetch-abi CLI 实现方案；整理 PR review checklist
- **关键判断**：fetch-abi CLI 应该用依赖注入模式（PR #29），而不是直接 spawn 子进程测试

### 7/17 — PR #31 架构重构 + Fetch-ABI CLI 完成
- **人类做了什么**：审查 PR #31 全量 diff（+5396/-4199 行，126 文件）；分析三层安全机制；识别 Kuru 适配器新写法要点
- **AI 做了什么**：curl 拉取 PR diff 到本地；grep/sed 提取关键变更段；整理术语变更对照表；生成笔记
- **关键判断**：
  - 新架构用 Capability tree + Receipt parser 替代 Plan + Expects + Effects reconciliation
  - ProtocolRef 依赖注入替代 Step builder
  - Registry.use() 扫描 exports 替代 Manifest registration
  - TokenReference（address | "native"）替代 Token table
  - vendored ABI pipeline（update:abis → gen:abis → test）是主流方式，fetch-abi CLI 是 explorer tier 的补充
- **未完成**：WSL 代理问题导致 Node.js fetch 失败，未用真实地址跑通；代码未 commit/push

### 7/19 — Moss PR 审查 + AI 生成内容校验

- **人类做了什么**：
  - 纠正 AI 将 "Agent-callable" 写成 "Agent-to-Agent"（语义推断错误）
  - 纠正 AI 把 PR #100 当 Issue #100 引用
  - 纠正 AI 推荐已被实现的 Issue #14 作为贡献目标
  - 纠正 AI 对 ERC-8004 的幻觉描述（实际是 Trustless Agents，不是 signed transfer）
  - 确认 Issue #6 PancakeSwap swap 为最终贡献目标
- **AI 做了什么**：
  - 克隆 moss 仓库，浏览目录结构和文档体系
  - `git fetch origin pull/100/head:pr-100` 拉取 PR 代码本地审查
  - `git fetch origin pull/68/head:pr-68` 拉取 ERC-1155 实现代码
  - 生成 github-exploration-log.md、open-source-contribution-plan.md、notes/week-2/2026-07-19.md
  - 生成 ai-generation-audit.md 记录所有需人工修正的错误
- **关键判断**：
  - x402 不适合接入 Moss 核心（不产出 TransactionNode），应作为独立外围工具
  - ERC 包 vs Protocol 包的判断规则：标准放 ERC，项目放 protocols
  - PR #68 值得学习的模式：动态 Handle 工厂、双 Receipt parser、自定义 Parameter 类型、测试构造 Change 对象
- **未完成**：PancakeSwap 适配器尚未开始实现
