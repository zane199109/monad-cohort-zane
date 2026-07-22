# Moss 新手入门教程 — 从零到第一个 Protocol Adapter

> 本教程面向完全不懂 Moss 的新手开发者。通过 12 个步骤带你走完环境搭建、核心概念理解、运行示例、以及编写自己的 Protocol Adapter 并提交 PR 的全流程。
> 
> 版本：基于 upstream/main 最新架构（PR #31 之后），ADR 0011+

---

## 第一步：克隆仓库并安装依赖

> git clone https://github.com/nishuzumi/moss
> cd moss
> pnpm install
> pnpm build

Moss 是 monorepo 结构，需要 Node.js 22+ 和 pnpm 11+。`pnpm build` 会编译所有 workspace 包，生成 TypeScript 声明文件。

> 注意：必须先 build 再 typecheck，因为 workspace 包的类型声明从 dist 目录解析。

验证工具链是否正常：

> MOSS_SKIP_E2E=1 pnpm test

这条命令跳过所有 RPC 调用，只跑单元测试。如果通过，说明环境没问题。

---

## 第二步：理解 Moss 解决什么问题

> Moss 把 Monad 协议交互变成 Agent 可调用的 Capability。
> 工作流程：discover → load → action → simulate
> Moss 构建并验证未签名的交易；它不签名也不发送。

关键设计原则：

- **Protocol 拥有自己的操作** — 地址、ABI、calldata 构造、参数规则、Receipt 解析都由 Protocol 包自己管理
- **模拟产生证据** — 每次成功交易产生有序的 Changes 列表和结构化 Receipt
- **签名保持分离** — MCP Agent 对比 Receipt text 和用户请求；SDK 消费者在钱包看到未签名交易前可使用结构化 Outcome

---

## 第三步：认识核心概念

### Capability Tree（能力树）

每个 Protocol 包暴露一组 Capabilities（可执行的操作）和 Queries（只读查询）。Capability 可以嵌套——比如 swap 可能先包含一个 ERC-20 approve 子 Capability。

### Receipt（收据）

每个 Capability 有且仅有一个 Receipt parser。它接收模拟产生的 Changes（事件日志 + MON 转账），按顺序穷尽覆盖每一个 Change。任何遗漏或额外 Change 都会导致 Warning。

### Handle（句柄）

Handle 将合约方法绑定到 TypeScript 类型系统。类型推断确保参数正确、ABI 匹配。

### Registry（注册表）

Registry 扫描所有已加载 Protocol 包的装饰器导出，自动注册 Capabilities、Queries 和 Receipt parsers。

---

## 第四步：运行完整工作流示例

Moss 提供了两个开箱即用的示例：

> # WMON wrap（包装 MON 为 WMON）
> pnpm --filter @themoss/example-simple-flow wrap

> # Kuru swap（MON 换 USDC）
> pnpm --filter @themoss/example-flow swap

这两个示例演示了完整的 discover → load → action → simulate 流程。输出中包含结构化 Receipt Outcome 和零 Warnings 证明。

---

## 第五步：逐步拆解工作流（Step 0-10）

Moss 官方教程 `docs/getting-started.md` 把完整流程拆成 11 个步骤。建议按以下顺序学习：

### Step 0 — 创建 scratch file

> cp -R examples/simple-flow src/play.ts

这个文件是你逐步构建工作流的试验场。

### Step 1 — 选择 Protocol 模块

> const registry = new Registry(runtime).use(system, erc, kuru);

Composition root 决定使用哪些 Protocol 包。Registry 自动扫描它们的装饰器导出。

### Step 2 — 记录用户意图

> Swap 1 native MON into USDC on Kuru, allowing at most 0.5% slippage.

Intent 必须在使用工具之前记录。Moss 无法从 calldata 反推用户原始请求。

### Step 3 — Discover 操作

> registry.discover({ verb: "swap" });

Discover 返回小坐标和选择元数据，不包含参数 schema 或构建交易。尝试不同过滤器：

> registry.discover({ verb: "transfer" });
> registry.discover({ category: "token" });
> registry.discover({ protocol: "kuru" });

### Step 4 — Load 调用合约

> const [swap] = registry.load([{ protocol: "kuru", method: "swap" }]);

Load 返回 intent、风险标签、以及每个参数的两种描述：type（JSON Schema）和 description（字段角色解释）。

> 重要：始终先 call load 再 call action。不要从参数名猜测单位、默认值或含义。

### Step 5 — 运行 Query（只读）

> const quote = await registry.action("kuru", "quote", ACCOUNT, { tokenIn: NATIVE, tokenOut: USDC_ADDRESS, amountIn: "1" });

Query 立即执行，不产生 Capability。amountIn 是人类可读的十进制字符串。

### Step 6 — 构建 Capability 树

> const result = await registry.action("kuru", "swap", ACCOUNT, { ... });

每个 Capability 有且仅有一个直接 TransactionNode 和一个命名 Receipt parser。Core 验证零或多直接交易会立即失败。

### Step 7 — 模拟并检查 Receipt

> const simulation = await simulator.simulate(capability);

模拟按深度优先顺序执行交易并传递状态。每个成功交易产生不可变的 Changes 列表。

> 警告：如果有 halted 或 Warnings，必须在签名前停止。

### Step 8 — 对齐结构化 Outcome 与意图

零 Warnings 不等于结果符合用户请求。检查：
- operation 和 protocol 是否正确
- sender、tokenIn、tokenOut 是否匹配
- amountIn 是否等于请求值
- amountOut 是否为正数

### Step 9 — 使用 MCP Server

> { "mcpServers": { "moss": { "command": "node", "args": ["<path>/dist/cli.js"], "env": { "MOSS_RPC_URL": "https://rpc.monad.xyz" } } } }

Agent 获得相同的四个工具：discover、load、action、simulate。

---

## 第六步：理解 ADR 体系

Moss 使用 Architecture Decision Records（ADR）记录架构决策。新手必读：

| ADR | 主题 |
|-----|------|
| 0001 | 为什么需要 Moss（Agent 经济基础设施） |
| 0007 | ABI 溯源策略（tiered provenance） |
| 0010 | Protocol decorator 模式 |
| 0011 | Capability Trees 和 Exhaustive Receipts |
| 0012 | Parameter type/description 分离 |

阅读顺序：0001 → 0007 → 0010 → 0011 → 0012。

---

## 第七步：从模板开始写你的第一个 Adapter

> cp -R packages/protocols/_template packages/protocols/myprotocol

按以下顺序工作：

1. 重命名 package，替换所有 CHANGEME 标记
2. 添加 source-backed ABIs 和 verified addresses
3. 声明 @Protocol、typed Handles、Protocol dependencies
4. 定义 Zod parameter contracts、Capabilities、Queries、pure Receipts
5. 添加正负类型 fixtures、failure tests、live happy path
6. 导出 Protocol 并添加到应用 composition root

---

## 第八步：理解 Moss 的三层安全机制

| 层级 | 何时触发 | 保护什么 |
|------|---------|---------|
| 编译时 | 代码编译时 | 类型安全——Handle 类型推断、@ts-expect-error fixture |
| 运行时 | Capability 构建时 | 结构验证——恰好一个 TransactionNode、Receipt parser 存在 |
| 模拟时 | simulate() 调用时 | 执行验证——Receipt 穷尽覆盖、状态链一致性、Halted 信号 |

---

## 第九步：常见错误和避坑指南

### 错误 1：直接调用 unlock() 而不理解回调模式

Uniswap V4 的 `PoolManager.unlock()` 要求 msg.sender 是实现了 IUnlockCallback 的合约。EOA 没有代码，调用会无条件 revert。

### 错误 2：忘记 Pool ABI

Swap 事件由 Pool 合约发出，不是 Router。Receipt parser 需要同时解码 Router 和 Pool 的事件。

### 错误 3：硬编码 ABI

永远不要手写 ABI。使用 vendored（npm tarball）或 explorer（MonadScan API）方式获取。

### 错误 4：nativeTransfer 处理遗漏

MON→Token 交换会先 emit nativeTransfer。Receipt parser 必须处理。

### 错误 5：勾选 live test 但没跑

nishuzumi 会用 debug_traceCall 在 Monad mainnet 上交叉验证。如果你说跑了 live test 但实际没跑，PR 会被拒。

---

## 第十步：提交 PR 前的检查清单

- [ ] 读了 CONTRIBUTING.md 和 AGENTS.md
- [ ] 找到了现有相似实现并复制了其结构
- [ ] 代码使用 TypeScript（不是 JS）
- [ ] 测试覆盖了错误用例（不只是 happy path）
- [ ] 本地跑通了完整 CI：build + typecheck + lint + test
- [ ] 填满了 PULL_REQUEST_TEMPLATE.md
- [ ] PR body 链接了相关 Issue
- [ ] 包含了验证证据（测试输出、结构化 Receipt Outcomes）
- [ ] 如果没跑 live Monad e2e，诚实标注了原因

---

## 进阶学习路径

完成以上步骤后，你可以：

1. **给 core/simulator 提 PR** — 像 pillowtalk-Qy 那样找架构漏洞修
2. **开发更复杂的 Protocol Adapter** — Lending、Bridge、NFT 市场
3. **搭建 AI Agent Demo** — 用 MCP server 连接 Moss 到你的 Agent
4. **参与 Monad Hackathon** — 用 Moss 快速构建协议集成

---

## 参考资料

- 官方 Getting Started：`docs/getting-started.md`
- ADR 文档：`docs/adr/*.md`
- 模板目录：`packages/protocols/_template/`
- Kuru 协议实现：`packages/protocols/kuru/src/kuru.ts`
- Agent 安全规则：`docs/agent-skill.md`
- MCP 工具契约：`docs/mcp-tools.md`
- 安全模型：`SECURITY.md`
