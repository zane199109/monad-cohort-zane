# 开源贡献计划 — Moss

## Builder 身份

**背景**: Java → Go + Solidity，转型 Web3 后端
**当前项目**: PrismSettle（Monad-native A2A 商业协议）
**Builder 角色**: Dev Builder — 写生产代码、提交 PR、扩展协议适配器

---

## 贡献方向：PancakeSwap Swap 适配器

### 对应 Issue

**Issue #6** — [Adapter: PancakeSwap swap](https://github.com/nishuzumi/moss/issues/6)
标签：`good first issue`, `adapter`, `dex`, `difficulty:starter`

### 为什么选择这个方向

| 维度 | 说明 |
|------|------|
| **维护者主动提出** | Issue 由 nishuzumi 创建，属于项目路线图的一部分 |
| **入门友好** | 标签明确 `good first issue` + `difficulty:starter` |
| **Dex 是 Agent 最高频操作** | Swap 是 Moss 的核心用例，Kuru 已有实现可作为参考 |
| **与 PrismSettle 直接相关** | PrismSettle 的 commerce layer 需要 DEX 路由做结算 |
| **有完整参考** | Kuru (`packages/protocols/kuru/`) 展示了 Protocol 包的完整结构 |

### 与 Kuru 的区别

Kuru 是 Monad 原生 CLOB DEX，PancakeSwap 是 AMM DEX。两者架构不同：

| 维度 | Kuru | PancakeSwap |
|------|------|-------------|
| 类型 | Orderbook / CLOB | AMM / Router |
| 报价方式 | API 查询 + 链上验证市场 | Router 合约直接 quote |
| 交易路径 | 动态发现 verified market | 单池或路由 |
| 复杂度 | 中等 | 低（starter 级别） |

---

## 本周目标

### 目标 1：调研 PancakeSwap 在 Monad 上的部署（Day 1）

**任务**:
1. 确认 PancakeSwap 在 Monad 主网有部署合约
2. 查找官方 Router 合约地址和已验证源码
3. 确定 ABI 来源策略（ADR 0007）：
   - 首选：vendored — 从 PancakeSwap 官方 SDK 或 GitHub 仓库拉取
   - 备选：explorer — 从 Monadscan 已验证合约页面获取
4. 了解 PancakeSwap Router 的关键函数：
   - `swapExactTokensForTokens`
   - `swapTokensForExactTokens`
   - `getAmountsOut`
   - `quote` / `getAmountsIn`

**产出**: 调研笔记（不提交，按 AGENTS.md 规则删除）

### 目标 2：搭建 Protocol 包骨架（Day 2-3）

**任务**:
1. 复制模板：
   ```bash
   cp -R packages/protocols/_template packages/protocols/pancakeswap
   ```
2. 配置 package.json：
   ```json
   {
     "name": "@themoss/protocol-pancakeswap",
     "dependencies": {
       "@themoss/core": "workspace:*",
       "@themoss/erc": "workspace:*",
       "viem": "^2.54.3"
     }
   }
   ```
3. 设置构建和测试配置
4. 添加 ABI 文件到 `packages/protocols/pancakeswap/src/abis/`
5. 运行 `pnpm install && pnpm build` 确认包被 workspace 识别

**产出**: 空包可构建通过

### 目标 3：实现 Protocol 类（Day 4-5）

**任务**:

#### 3.1 Protocol 类定义

```typescript
@Protocol({
  name: "pancakeswap",
  category: "dex",
  description: "PancakeSwap AMM swaps on Monad.",
  contracts: {
    router: { abi: PancakeSwapRouterAbi, addr: PANCAKESWAP_ROUTER_ADDRESS },
  },
  protocols: {
    erc20: ERC20,
  },
})
export class PancakeSwap {
  declare runtime: MossRuntime;
  declare router: Handle<typeof PancakeSwapRouterAbi>;
  declare erc20: ProtocolRef<ERC20>;
}
```

#### 3.2 Parameters

参考 Kuru 的参数设计模式：

```typescript
const swapParams = {
  tokenIn: { type: TokenReference, description: "Asset offered to the swap." },
  tokenOut: { type: TokenReference, description: "Asset requested from the swap." },
  amountIn: { type: OptionalHumanTokenAmount, description: "Fixed input quantity." },
  amountOut: { type: OptionalHumanTokenAmount, description: "Minimum output quantity." },
  slippage: { type: BasisPoints.default(50), description: "Maximum slippage." },
} satisfies ParamsSpec;
```

#### 3.3 Query: quote

- 调用 Router 的 `getAmountsOut` 或 `getAmountsIn`
- 返回最优路径和预估数量
- 不产生 TransactionNode

#### 3.4 Capability: swap

- verb: `swap`
- 嵌套 ERC20 approve（如果 tokenIn 不是 NATIVE）
- Direct TransactionNode: 调用 Router `swapExactTokensForTokens` 或 `swapTokensForExactTokens`
- Risk labels: `["fundOut", "approval", "priceImpact"]`

#### 3.5 Receipt Parser

- 解析 `Transfer` 事件（ERC-20）
- 验证 from/to 与 swap 参数一致
- 结构化 Outcome:
  ```typescript
  {
    operation: "swap",
    tokenIn: Address,
    tokenOut: Address,
    amountIn: string,
    amountOut: string,
    path: Address[],
  }
  ```

**产出**: 完整适配器代码

### 目标 4：测试与验证（Day 6-7）

**任务**:
1. Compile-time fixtures:
   - Valid usage compiles with correct inferred types
   - Invalid usage marked `@ts-expect-error`
2. Unit tests:
   - Registry metadata validation
   - Capability exactly-one-direct-transaction invariant
   - Receipt coverage: exact Change identity, length, order
   - Failure cases: missing/duplicated/reordered Changes
3. Live Monad mainnet simulation test（zero Warnings）
4. 运行完整 CI 链：`pnpm build && pnpm typecheck && pnpm lint && pnpm test`

**产出**: 所有测试通过，证据日志 ready for PR

---

## 预计产出

| 产出 | 格式 | 位置 |
|------|------|------|
| Protocol 包 | TypeScript source | `packages/protocols/pancakeswap/` |
| ABI 文件 | TypeScript (generated) | `packages/protocols/pancakeswap/src/abis/` |
| 类型定义 | TypeScript | `packages/protocols/pancakeswap/src/types.ts` |
| 单元测试 | Vitest | `packages/protocols/pancakeswap/test/` |
| Live simulation evidence | Test output logs | PR description |
| Changeset | Markdown | `.changeset/` |
| README | Markdown | `packages/protocols/pancakeswap/README.md` |

---

## 提交计划

1. 在 fork 上从 `main` 创建分支 `feat/pancakeswap-swap`
2. 按 conventional commits 提交所有变更
3. 运行完整验证链（build/typecheck/lint/test）
4. 打开 PR，包含：
   - What/why 部分描述 PancakeSwap 适配器
   - Checklist from PULL_REQUEST_TEMPLATE.md
   - Framework impact assessment（仅新增 `packages/protocols/pancakeswap`，不修改 core/simulator）
   - Verification evidence（测试输出、simulation logs）
   - Protocol changes detail（Capabilities, Queries, Receipt parsers）
5. 根据 review feedback 迭代修改

---

## 风险评估

| 风险 | 缓解措施 |
|------|----------|
| PancakeSwap 在 Monad 上无部署 | 先确认合约地址，若无部署则放弃此方向 |
| ABI 来源不符合 ADR 0007 | 使用官方 SDK/GitHub vendored，或 Monadscan explorer |
| Receipt parser 复杂度高 | 先实现单池 swap，多跳路由作为后续扩展 |
| 与 Kuru 风格不一致 | 严格参考 kuru.ts 的代码模式和参数设计 |
| Live Monad RPC 限流 | 先跑 `pnpm test:offline`，再安排 live test |
