# Moss 介绍：让 AI Agent 原生理解区块链协议

## 一、Moss 是什么？它解决了什么问题？

在 AI Agent 与区块链交互的场景中，存在一个根本性的鸿沟：**Agent 理解自然语言意图，但区块链只认 calldata（原始调用数据）**。一个看似简单的 "把 1 MON 换成 USDC" 的请求，背后可能涉及 ERC-20 approve → swap → Receipt 解析的复杂链路，每一步都需要精确的参数构造和链上状态验证。

Moss 就是这座桥梁。它是一个开源框架，将 Monad 链上的 DeFi 协议交互转化为 **Agent 可调用的标准化能力（Capabilities）**，通过 `discover → load → action → simulate` 四步流程，让 AI Agent 无需理解底层 ABI、multicall 或 gas 细节，就能安全地操作区块链协议。

核心设计哲学是 **"Protocol-owned operations"**——每个协议的地址、ABI、参数规则、交易构造和收据解析都由 Protocol 包自己管理，Core 只负责编排和验证。Agent 只需声明意图（"我想做什么"），Moss 负责构建、模拟、验证交易，最后才交给签名环节。

> [!WARNING]
> Moss 目前是无审计的 alpha 软件，仅适用于测试环境，不可用于生产资金。

## 二、为什么 AI Agent 需要 Moss？

### 2.1 传统方案的痛点

在没有 Moss 之前，构建一个能操作 DeFi 协议的 AI Agent 需要：
- 手动管理每个协议的 ABI 和合约地址
- 处理 multicall 组合、gas 估算、slippage 计算
- 解析链上事件日志来确认交易结果
- 为每个协议编写独立的交互逻辑

这导致每个 Agent 都要重复造轮子，且缺乏统一的安全保障机制。

### 2.2 Moss 的解决方案

Moss 提供了三层安全保障：

| 层级 | 保护内容 | 触发时机 |
|------|---------|---------|
| **编译时** | 类型安全——Handle 类型推断、`@ts-expect-error` fixture 验证 | 代码编译时 |
| **运行时** | 结构验证——Capability 恰好一个 TransactionNode、Receipt parser 存在 | 交易构建时 |
| **模拟时** | 执行验证——Receipt 穷尽覆盖、状态链一致性、Halted 信号 | 链上模拟时 |

最核心的创新是 **Exhaustive Receipt Parsing（穷尽收据解析）**。每次交易产生的所有链上事件（Event）和 MON 转账（nativeTransfer）会被按执行顺序收集为 Changes，Receipt parser 必须对每一个 Change 进行恰好一次且顺序一致的处理。任何遗漏、重复或乱序都会产生 Warning 并阻止交易签名。

这意味着 Agent 看到的不是模糊的 "交易成功"，而是精确到每个事件日志的结构化证据。

### 2.3 MCP 集成

Moss 通过 Model Context Protocol (MCP) 暴露四个标准工具：`discover`、`load`、`action`、`simulate`。任何支持 MCP 的 AI 框架（如 Claude Desktop、Cursor、自定义 Agent）都可以直接调用 Moss 的能力，无需编写协议特定的集成代码。

## 三、架构概览

```
┌─────────────────────────────────────────────────┐
│              MCP Server / SDK                    │
│  discover → load → action → simulate            │
├─────────────────────────────────────────────────┤
│  @themoss/core    Registry · Capability Tree     │
│                   Parameter Contracts · Validation│
├─────────────────────────────────────────────────┤
│  @themoss/simulator debug_traceCall · State Chain│
│                   Change Extraction · Receipt    │
├──────────┬──────────────────┬───────────────────┤
│@themoss/ │ @themoss/system  │ @themoss/protocol-*│
│ erc      │ Monad Runtime    │ Kuru, FastLane... │
└──────────┴──────────────────┴───────────────────┘
```

- **Core**：装饰器（`@Protocol`、`@Capability`、`@Query`）、Registry、Capability Tree 管理
- **Simulator**：基于 `debug_traceCall` 的链上状态模拟，提取 Changes 并生成 Receipt
- **ERC**：通用的 ERC-20/ERC-721 协议实现，零硬编码地址
- **System**：Monad 运行时、官方常量（WMON、USDC 等）
- **Protocol\***：各具体协议的适配器（Kuru DEX、FastLane 质押等）

## 四、应用场景

### 4.1 AI Agent 驱动的 DeFi 交互

用户用自然语言描述意图，Agent 通过 Moss 自动完成：
- 发现可用的协议和操作（`discover`）
- 加载参数 schema 和风险标签（`load`）
- 构建完整的交易树（`action`）
- 模拟执行并验证结果（`simulate`）

### 4.2 快速协议集成

开发者只需实现一个 Protocol 类，即可让所有接入 Moss 的 Agent 自动获得该协议的操作能力。无需修改 Core 或 Simulator 代码。

### 4.3 安全审计与合规

每个交易的完整证据链（Changes + Receipts）可被独立验证，满足金融场景的可审计性要求。

## 五、如何参与贡献

### 5.1 开发一个 Protocol Adapter

Moss 提供了标准化的模板和工具链。以 FastLane shMONAD 流动性质押协议为例，一个完整的 Protocol Adapter 包含：

- 5 个 Capabilities（deposit/redeem/requestUnstake/completeUnstake/boostYield）
- 5 个 Queries（balanceOf/totalSupply/previewDeposit/previewRedeem/convertToAssets）
- 5 个 Receipt parsers（穷尽覆盖所有链上事件）
- 编译时类型安全证明（`@ts-expect-error` fixture）
- ADR 0007 explorer tier ABI 溯源

### 5.2 贡献路径

1. **阅读文档**：`CONTEXT.md`（术语表）、`docs/adr/*.md`（架构决策）、`CONTRIBUTING.md`（贡献指南）
2. **从模板开始**：`cp -R packages/protocols/_template packages/protocols/myprotocol`
3. **遵循现有模式**：参考 Kuru、WMON 等已有实现的目录结构和测试模式
4. **提交 PR**：使用 PULL_REQUEST_TEMPLATE.md 提供完整验证证据

### 5.3 高级贡献策略

最高价值的贡献不是实现新协议，而是 **找架构漏洞并修复**：
1. 读 ADR 和 CONTEXT.md，理解架构应该是什么样子
2. 检查代码是否严格 enforce 了这些规则
3. 写最小 PR 修复 gap，用测试证明边界

pillowtalk-Qy 通过这种策略实现了 8 个 merged PR，覆盖了 core、simulator 和 protocols 三个层面。

## 六、学习资源

- 官方文档：[Getting Started](https://github.com/nishuzumi/moss/blob/main/docs/getting-started.md)
- 架构决策：[ADR 系列](https://github.com/nishuzumi/moss/tree/main/docs/adr)
- 协议接入指南：[Protocol Onboarding](https://github.com/nishuzumi/moss/blob/main/docs/protocol-onboarding.md)
- Agent 安全规则：[Agent Skill](https://github.com/nishuzumi/moss/blob/main/docs/agent-skill.md)
- MCP 工具契约：[MCP Tools](https://github.com/nishuzumi/moss/blob/main/docs/mcp-tools.md)

## 七、总结

Moss 代表了 AI Agent × Web3 基础设施的一个重要方向：**将协议交互抽象为标准化、可验证、Agent 友好的能力单元**。它不追求成为通用的区块链 SDK，而是专注于解决 "AI Agent 如何安全地操作 DeFi 协议" 这个具体问题。

对于开发者而言，Moss 降低了协议集成的门槛；对于 AI 研究者而言，Moss 提供了研究 Agent 链上行为安全的理想实验平台；对于用户而言，Moss 意味着更安全、更可审计的链上交互体验。
