# Moss GitHub 探索日志

## 1. 项目简介

Moss 是一个面向 Monad 链的 Agent-to-Agent (A2A) 协议层。它把复杂的链上交互封装成 Agent 可调用的统一接口，流程为：

> **discover → load → action → simulate**

核心特点：Agent 可以查询协议能力、构建无签名的交易、在链上状态中模拟执行，但 **永远不签名、不发送**。所有交易证据以结构化的 Receipt（收据）呈现，Agent 和签名者各自做意图对齐检查。

Moss v1 仅支持 Monad 主网（chain ID `143`），当前已支持的协议包括 WMON、ERC-20/ERC-721、Kuru DEX。

---

## 2. 项目目录结构

```
moss/
├── packages/
│   ├── core/              # 框架核心：装饰器、Registry、Capability 树、Receipt 验证
│   │   └── src/
│   │       ├── decorators.ts      # @Protocol/@Capability/@Query 等装饰器
│   │       ├── framework.ts       # Protocol/Capability/Query 基类定义
│   │       ├── handle.ts          # ABI-typed 合约网关
│   │       ├── registry.ts        # 协议注册与依赖注入
│   │       ├── runtime.ts         # Runtime 抽象
│   │       ├── semantics.ts       # 语义模型
│   │       └── types.ts           # 类型定义
│   ├── simulator/         # 模拟引擎：debug_traceCall、状态链、Change 提取
│   │   └── src/
│   │       ├── changes.ts         # Change 类型与排序
│   │       ├── trace.ts           # 链上 trace 调用
│   │       └── overrides.ts       # 模拟覆盖参数
│   ├── erc/               # 通用 ERC 协议实现（地址无关）
│   │   └── src/
│   │       ├── erc20.ts           # ERC-20 Protocol + Receipt
│   │       └── erc721.ts          # ERC-721 Protocol + Receipt
│   ├── system/            # Monad Runtime + 官方常量
│   │   └── src/
│   │       ├── constants.ts       # 固定地址（USDC 等）
│   │       ├── runtime.ts         # chain ID 143 验证
│   │       └── wmon.ts            # WMON wrap/unwrap
│   ├── protocols/
│   │   ├── _template/     # 新协议包模板
│   │   └── kuru/          # Kuru DEX 适配器
│   └── mcp-server/        # MCP 传输层与应用组合
│       └── src/
│           ├── cli.ts
│           ├── server.ts
│           └── index.ts
├── docs/
│   ├── adr/               # 架构决策记录（7 篇）
│   ├── getting-started.md
│   ├── getting-started.zh-CN.md
│   ├── mcp-tools.md
│   ├── protocol-onboarding.md
│   └── agent-skill.md
├── examples/
│   └── agent-swap/        # Agent 与签名者分离的示例
├── .changeset/            # Changesets 版本管理
├── CONTEXT.md             # 领域语言字典（核心概念大全）
├── CLAUDE.md              # AI Agent 工作规则
├── AGENTS.md              # 审查指南 + 仓库事实
├── CONTRIBUTING.md        # 贡献指南
├── SECURITY.md            # 安全承诺
└── package.json           # pnpm workspace 根配置
```

### 各模块作用

| 模块 | 职责 |
|------|------|
| `@themoss/core` | 装饰器系统、Registry 注册表、Capability 树验证、Receipt 穷尽检查 |
| `@themoss/simulator` | `debug_traceCall` 调用、状态链式模拟、事件/转账提取为有序 Change |
| `@themoss/erc` | 地址无关的 ERC-20/ERC-721 协议、ABI 解析、Receipt 语义 |
| `@themoss/system` | Monad Runtime 初始化、chain ID 校验、官方固定地址常量 |
| `@themoss/protocol-*` | 具体协议适配器的 ABI、Capabilities、Queries、Receipts |
| `@themoss/mcp-server` | MCP 协议的四个工具：discover/load/action/simulate |

---

## 3. README 要点

- **定位**：不是钱包、不是交易发送器，是 Agent 的链上操作理解层
- **安全边界**：Moss 从不签名或发送交易；Agent 必须通过 Receipt 文本做意图对齐
- **协议扩展**：新协议从 `_template` 复制，遵循 `protocol-onboarding.md`
- **技术栈**：TypeScript monorepo，pnpm workspaces，vitest 3.x 测试
- **MCP 集成**：暴露 4 个 stdio 工具，可直接接入 Claude Code / Cursor 等 MCP 客户端
- **文档体系**：ADR（架构决策记录）、Getting Started 教程、Agent Skill 安全规则

---

## 4. Docs 探索

### 4.1 Getting Started 教程

步骤清晰：先跑完整流程 → 逐步拆解 → 最后自己创建协议包。关键设计：

- 使用 `0xccc...` 假地址演示，不需要真实资金
- 每个阶段都可以单独运行验证
- 强调最终检查不是 "success" 字符串，而是 **零 Warning + 结构化 Receipt Outcome 匹配请求**

### 4.2 ADR（架构决策记录）

共 7 篇，按编号排列：

| ADR | 主题 |
|-----|------|
| 0001 | 装饰器创作模型（@Protocol/@Capability/@Query） |
| 0002 | 通过 debug_traceCall 进行模拟 |
| 0003 | 两层 Capability 分类法 |
| 0007 | ABI 来源（compiled > explorer > vendored） |
| 0010 | 自描述协议与 Zod 参数 |
| 0011 | Capability 树与穷尽 Receipt |
| 0012 | Kuru 市场发现 |

### 4.3 CONTEXT.md — 领域语言

这是最有价值的文件之一。它定义了三个层面的术语：

- **协议层**：Protocol、Capability、Query、Handle、Capability Tree、Runtime、ABI Origin、Provenance、Verb、Category
- **MCP 层**：Event、Native MON Transfer、Change、Receipt Parser、Receipt Tree、Outcome、Warning
- **技能层**：Intent、Intent Alignment

每个术语都有正例用法和反例（Avoid），确保项目内语言一致。

### 4.4 Agent Safety Rules

Agent 必须遵守的安全规则：
1. 绝不处理私钥
2. 绝不跳过 simulate
3. 绝不手动修改 tree
4. 任何 Warning 立即停止

---

## 5. Issues 分析

### 5.1 开放 Issue 概览

通过 GitHub API 获取到约 20 个开放 Issue，主要类型：

| 主题 | Issue 编号 | 说明 |
|------|-----------|------|
| 新协议适配器 | #104, #100, #96, #92, #84 | aPriori、x402、Kintsu、FastLane、Uniswap v4 |
| 核心功能增强 | #102, #101, #91, #90, #85 | Query metadata、chained tx 测试、树复杂度限制、ERC-1155 |
| 文档 | #103, #99, #97, #89, #88 | 教程、intent alignment checklist、中文 FAQ |
| 基础设施 | #86 | Wallet 适配器 |

### 5.2 感兴趣的问题：#103 — Building Your First Protocol Adapter

**标题**: docs: add tutorial — Building Your First Protocol Adapter
**作者**: gitgdut
**标签**: docs

这是一个非常实用的教程型 Issue。Moss 的协议包扩展是其生态发展的关键——但 protocol-onboarding.md 偏参考文档，新手需要一篇手把手教程。

这个 Issue 的价值在于：
- 它连接了 `_template` 目录和实际开发体验
- 好的教程应该包含：从模板复制 → 编写装饰器 → 构建 Receipt parser → 添加测试 → 本地验证
- 对像我这样想贡献新协议的人来说，这是最直接的上手路径

### 5.3 另一个值得关注的 Issue：#91 — Bound Capability Tree Complexity

**标题**: fix(core): bound Capability tree complexity
**作者**: Coooder-Crypto

这涉及核心安全问题——如果 Capability 树无限嵌套，可能导致 DoS 或递归爆炸。这是一个架构健壮性的必要限制。

---

## 6. x402 量子优化服务适配器 — 深度分析

### 6.1 x402 是什么？

x402 是一种 HTTP 支付协议规范。核心思路：当 API 端点需要付费时，服务端返回 HTTP `402 Payment Required` 响应，并附带结构化的支付指令。客户端完成支付后出示支付凭证，即可获取资源。

这打通了传统 HTTP API 与链上支付之间的桥梁——Agent 可以调用任何实现了 x402 标准的 HTTP 服务，由 x402 标准自动处理支付流程。

### 6.2 PR #100 内容回顾

**标题**: feat: add x402 quantum optimization service adapter
**作者**: sunshineluyao

该 PR 新增了一个 `@themoss/x402-qopt-adapter` 包，用于处理受 x402 保护的量子优化 API。与现有 `@Protocol` 包不同，这是一个 **Service Adapter**，因为它处理的是 HTTP 资源支付，而非 Monad 合约交易。

#### 覆盖范围

- x402 V2 `PAYMENT-REQUIRED`、`PAYMENT-SIGNATURE`、`PAYMENT-RESPONSE` headers
- exact 支付方案
- budget、network、asset、recipient、resource 校验
- QUBO 输入验证和问题哈希计算
- solver provenance 追踪和 classical benchmark
- 离线可运行的 mock settlement 示例

#### 架构定位

该 PR 明确没有将其作为 `@Protocol` 包实现，而是作为 Service Adapter。区别如下：

| 维度 | `@Protocol` 包 | x402 Service Adapter |
|------|---------------|---------------------|
| 目标 | 链上合约交互 | HTTP API 支付场景 |
| 输出 | Monad `TransactionNode` | 外部求解器的优化结果 |
| 支付 | 链上交易 | HTTP 402 支付流程 |
| MCP 影响 | 改变现有工具 | 不改变 Moss MCP 工具面 |

#### 安全模型

- 不接受或存储私钥
- 不由适配器自身签名
- 不广播或结算交易
- 示例使用 mock signature，不涉及真实资金
- 不声称使用物理 QPU

#### 验证清单

- [x] Adapter unit tests
- [x] Offline example
- [x] `pnpm build`
- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm test:offline`

### 6.3 代码审查发现

#### ✅ 做得好的地方

- 架构边界判断正确：选择 Service Adapter 而非 `@Protocol`
- README 清晰说明了 x402 V2、exact scheme、安全边界和局限性
- 测试覆盖了核心 happy path（7 个用例）
- Security boundaries 声明明确

#### ⚠️ 警告项

| 问题 | 位置 | 说明 |
|------|------|------|
| QUBO matrix 未限制为 0/1 | `types.ts` | QUBO 要求 binary variables，但 schema 只允许任意 finite number |
| EVM address 格式校验缺失 | `policy.ts` | 只做了 `.toLowerCase()`，没有验证 40 位 hex 地址格式 |
| Node Buffer 依赖 | `headers.ts` | `Buffer.from()` 在浏览器环境不可用 |
| example server 硬编码密钥 | `examples/x402-qopt/src/server.ts` | `demo-payment-signature` 明文写在 server 里 |
| tsconfig 未 extend workspace base | `packages/x402-qopt-adapter/tsconfig.json` | 未继承工作区基础配置 |

#### 🔴 Critical 问题

| 问题 | 说明 |
|------|------|
| 缺少 changeset | CONTRIBUTING.md 明确要求 user-facing package 变更需要 changeset |
| example 依赖声明不完整 | express 等依赖可能未在 package.json 中正确声明 |

### 6.4 x402 是否适合接入 Moss？

**结论：短期意义不大，不建议作为核心协议接入。**

原因：

1. **架构边界冲突**：Moss 的核心契约是每个 Protocol 必须产出 Monad `TransactionNode`，经过 simulator.simulate() 产生链上证据（Event + nativeTransfer Changes）。x402 处理的是 HTTP 402 支付流程，不产生 TransactionNode、不需要 Receipt、不需要 simulator。

2. **安全模型不匹配**：Moss 的签名者是钱包，Agent 只看到模拟证据；x402 的签名者是任意 HTTP client，Agent 需要调用外部 API 并处理支付凭证。两者对"签名"的理解完全不同。

3. **生态优先级低**：看开放 Issue，社区真正需要的是 aPriori/Kintsu 质押适配器、Uniswap v4 适配器、ERC-1155 支持等链上 DeFi 原语。x402 属于链下 HTTP 支付场景，与 Monad 主网定位关联较弱。

### 6.5 如果不接入 Moss，怎么使用 x402？

x402 应作为 **Moss 的外围独立工具** 存在，而非 Moss 核心协议的一部分。

典型使用场景：Agent 先用 Moss 完成链上操作（如 swap MON→USDC），获得 USDC 余额后，再调用独立的 x402 client 去支付一个量子优化服务的 API 费用。

```
Agent 经济 = Moss (链上交易) + x402 client (链下支付) + 其他服务

Moss 只需要保证自己的链上部分足够好。
```

职责划分：

| 职责 | 归属 |
|------|------|
| 链上资金准备 | Moss (`@themoss/core`) |
| HTTP 402 支付流程 | x402 client（独立包） |
| Agent 意图对齐 | Agent 自己判断 |
| 签名 | 用户钱包，不在 Moss 内 |

---

## 7. 我的发现

### 7.1 架构洞察

Moss 的设计哲学是 **"Agent 只看到证据，不看到实现细节"**：

1. **自描述协议**：每个 Protocol 是一个带装饰器的类，自动被 Registry 扫描注册，无需手动注册表
2. **Receipt 穷尽覆盖**：模拟产生的每个 Change 必须被 Receipt 恰好覆盖一次且顺序一致——这是安全性的核心保障
3. **三层术语体系**：CONTEXT.md 将协议层、MCP 层、技能层的概念严格区分，避免术语混淆
4. **ABI 来源分级**：compiled > explorer > vendored，杜绝手写 ABI 带来的安全隐患

### 7.2 项目管理观察

- **ADR 驱动架构演进**：每次重大设计决策都有 ADR，新贡献者可以通过 ADR 理解"为什么这么设计"
- **AI Agent 友好**：CLAUDE.md 和 AGENTS.md 直接写给 AI 代码助手看，定义审查标准和仓库事实
- **Changesets 管理多包版本**：符合 pnpm workspace 的最佳实践
- **中文文档完善**：README、Getting Started、FAQ 都有中文版，对非英语贡献者友好

### 7.3 与 PrismSettle 的关联

Moss 的存储思路虽然不同，但其 "分层职责 + 严格边界" 的架构理念值得借鉴：

- `core` 不关心协议细节，`protocols/*` 不越界修改框架
- `simulator` 只负责执行和提取，不决定语义
- 每个 Receipt parser 只处理自己产生的 Change 区间

这种边界清晰的模块化设计，正是多协议扩展场景下的关键。

---

## 8. 参考资料

- [Moss GitHub Repository](https://github.com/nishuzumi/moss)
- [Getting Started 教程](https://github.com/nishuzumi/moss/blob/main/docs/getting-started.md)
- [Protocol Onboarding 文档](https://github.com/nishuzumi/moss/blob/main/docs/protocol-onboarding.md)
- [MCP Tools 文档](https://github.com/nishuzumi/moss/blob/main/docs/mcp-tools.md)
- [Agent Safety Rules](https://github.com/nishuzumi/moss/blob/main/docs/agent-skill.md)
- [Domain Language / CONTEXT.md](https://github.com/nishuzumi/moss/blob/main/CONTEXT.md)
- [Architecture Decision Records](https://github.com/nishuzumi/moss/tree/main/docs/adr)
- [Contributing Guide](https://github.com/nishuzumi/moss/blob/main/CONTRIBUTING.md)
- [PR #100 — x402 Quantum Optimization](https://github.com/nishuzumi/moss/pull/100)
- [Issue #103 — First Protocol Adapter Tutorial](https://github.com/nishuzumi/moss/issues/103)
- [Issue #91 — Capability Tree Complexity](https://github.com/nishuzumi/moss/issues/91)
