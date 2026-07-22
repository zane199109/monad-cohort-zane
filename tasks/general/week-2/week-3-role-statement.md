# Week 3 Role Statement

**日期：** 2026-07-21
**状态：** 进行中

---

## 进入 Week 3 后能承担的角色

**协议层后端开发（Protocol Layer Backend Developer）**

我能独立负责 Moss 生态中一个协议适配器的完整开发：从合约调研、ABI 获取、Capability/Query/Receipt 实现，到测试覆盖和 PR 提交。PR #116（FastLane shMONAD adapter）已合并到 upstream/adapter/fastlane，证明我具备按 moss 架构规范交付可审查代码的能力。

同时，我有 Go + Solidity 双栈基础，能承担 PrismSettle 项目的链下工具开发和智能合约编写。

---

## 需要的队友

| 角色 | 为什么需要 |
|------|-----------|
| **前端开发** | PrismSettle 需要一个 DApp 交互界面来展示 shard 分配、交易路由和仲裁结果。我的能力集中在后端和协议层，无法独立完成前端。 |
| **Research 方向** | 需要有人分析 Monad OCC 冲突的现有解决方案（如 Optimistic Concurrency Control 的其他实现），对比 256-shard storage 的优势和潜在风险。 |
| **Ops 方向** | 需要有人负责 Monad hackathon 的提交材料整理、演示视频录制和社区宣传。 |

---

## 能提供的 Proof of Work

1. **Moss PR #116 — FastLane shMONAD liquid staking adapter**
   - 5 Capabilities（deposit/redeem/requestUnstake/completeUnstake/boostYield）
   - 5 Queries（balanceOf/totalSupply/previewDeposit/previewRedeem/convertToAssets）
   - 5 Receipt parsers 实现穷尽 Change 覆盖
   - 编译时类型安全证明（@ts-expect-error fixture）
   - 14 个单元测试 + 链上验证测试
   - ADR 0007 explorer tier ABI 溯源
   - 已合并到 upstream/adapter/fastlane

2. **PrismSettle 架构设计文档**
   - 256-shard storage 解决 Monad OCC 冲突的技术方案
   - Trust Layer（Registry + reputation）、Commerce Layer（Job + ERC-8183）、Indexer + Marketplace 三层架构
   - 从"多 agent 协同应用"到"agent 经济基础设施"的产品叙事

3. **AEP（AI×Web3 黑客松冠军项目）**
   - 多 Agent 协同 escrow 协议
   - 智能合约 + Go 后端全栈实现
   - 6 天从零到获奖

4. **Moss 开源贡献记录**
   - 8+ merged PRs（core/simulator/protocols 全覆盖）
   - 深入理解 Capability Tree、Receipt parser、Handle 类型系统
   - 熟悉 moss 的 ADR 体系、CONTRIBUTING.md 审查标准

---

## 自我评估

**优势：**
- 有真实可验证的开源贡献（PR #116 已合并）
- 能独立完成协议适配器从 0 到 PR 的全流程
- Go + TypeScript + Solidity 三角技能栈
- 有 hackathon 获奖经验，懂产品叙事

**待提升：**
- 缺少主网上线经验（Moss PR 是测试环境验证，非生产部署）
- PrismSettle 尚未做出可演示版本
