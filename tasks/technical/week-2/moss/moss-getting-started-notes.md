# Moss Getting Started — 操作记录

---

## 目标

按 `docs/getting-started.md` 的 10 个步骤，从零组装一个完整的 Moss 交互流程，验证环境搭建和协议适配器调用链路。

---

## 10 步走查记录

| Step | 操作 | 核心概念 |
|------|------|---------|
| 0 | 验证工具链 | `pnpm install` → `build` → `typecheck` → `lint` → `test` 全过 |
| 1 | 运行官方示例 | wrap + swap 证明 Moss 能跑通，零 Warning |
| 2 | 从零组装 Moss | 创建 `play.ts`，初始化 `Registry` + `Simulator` |
| 3 | 记录意图 | 自然语言描述目标 |
| 4 | Discover | 查找操作坐标（verb/category/protocol） |
| 5 | Load | 获取合约存根（intent/risk/schema） |
| 6 | Query (Quote) | 只读操作，不产生交易 |
| 7 | Action (Capability) | 构建 Capability tree |
| 8 | Simulate | 本地模拟执行，提取 Changes |
| 9 | Intent Alignment | 验证结果匹配用户意图 |

---

## 实际输出验证

Kuru MON→USDC swap，零 Warning，Gas 528799。

---

## 关键发现

1. **Registry 自动扫描导出** — `new Registry(runtime).use(system, erc, kuru)` 直接传入模块命名空间，Registry 通过 `PROTOCOL_META` symbol 识别 `@Protocol` 类，不需要单独的 manifest 对象。
2. **Capability tree 是唯一的执行结构** — `action()` 返回 CapabilityNode，`flattenCapabilityTree()` 深度优先展开为 ExecutableCapability[]（含 direct TransactionNode）。
3. **Receipt parser 是纯函数** — 只接收 `Change[]`，不访问 Runtime/Handle/Query/RPC。`verifyReceiptCoverage()` 验证 exact identity + length + order。
4. **MCP server 是薄包装** — `createMossServer()` 内部创建 Registry + Simulator，暴露四个 JSON-RPC 方法：discover、load、action、simulate。

---

## 参考资料

- [Getting Started](https://github.com/nishuzumi/moss/blob/main/docs/getting-started.md)
- [CLAUDE.md](https://github.com/nishuzumi/moss/blob/main/CLAUDE.md) — PR review rules
