# AI 生成内容校验记录 — Moss 开源探索

**日期：** 2026-07-19
**说明：** 本文档记录 AI 自动生成内容后，人工校验发现的错误和修正。目的是沉淀"AI 容易在哪里出错、人类应该重点检查什么"的经验。

---

## 1. GitHub Exploration Log

### AI 初始生成内容

AI 在 `github-exploration-log.md` 中写了：

> Moss 是一个面向 Monad 链的 Agent-to-Agent (A2A) 协议层

### 人工校验发现

**问题：** README 原文是 "Agent-callable Capabilities"，不是 "Agent-to-Agent"。

- Agent-callable = Agent 作为使用者调用能力
- Agent-to-Agent = Agent 之间互相通信

Moss 的定位是前者，不是后者。AI 把 "Agent" 这个词过度解读成了 A2A 协议。

### 修正

改为："Moss 是一个面向 Monad 链的协议层。它把复杂的链上交互封装成 Agent 可调用的统一接口"

### 教训

AI 看到 "Agent" 两次就自动组合成 "Agent-to-Agent"。应该回到原文确认每个词的确切含义，不要做语义推断。

---

## 2. PR #100 x402 分析

### AI 初始生成内容

AI 在 `github-exploration-log.md` 中写了：

> Issue #100 — feat: add x402 quantum optimization service adapter
> 作者：sunshineluyao

### 人工校验发现

**问题：** 这是 PR，不是 Issue。

- `https://github.com/nishuzumi/moss/issues/100` 不存在（GitHub API 返回空）
- `https://github.com/nishuzumi/moss/pull/100` 才是正确的 URL

AI 在 Issues 分析章节中把 PR 编号混入了 Open Issues 列表。

### 修正

将 References 中的链接改为 PR URL，并在正文中明确标注为 PR #100 而非 Issue #100。

### 教训

GitHub issue 和 PR 是两种完全不同的东西。AI 在引用时容易混淆编号系统。应该用 `git fetch origin pull/<N>/head` 直接拉代码验证，而不是只看 issue list。

---

## 3. Issue 编号范围

### AI 初始生成内容

AI 在贡献计划中推荐了：

- Issue #14（ERC-1155）
- Issue #104（aPriori）
- Issue #100（x402）

### 人工校验发现

**问题：**

1. Issue #14 已经有人实现并合并了（PR #68 → #82）
2. Issue #104 是 PR 编号，不是 open issue
3. 实际 open issues 最高只到 #97

AI 从 GitHub API 获取的 issue list 中混入了 PR 数据，或者把已合并的 issue 当成了可认领的目标。

### 修正

重新用 API 过滤 `pull_request` 字段，确认真正未认领的 open issues。最终选定 Issue #6（PancakeSwap swap）。

### 教训

GitHub API 返回的 issue list 可能包含已关闭、已合并、或带 pull_request 字段的条目。筛选时必须同时检查 state 和 pull_request 字段。

---

## 4. ERC-8004 理解

### AI 初始生成内容

AI 在讨论中写了：

> ERC-8004 是 signed transfer 标准，允许用户签名交易后授权 Agent 执行

### 人工校验发现

**问题：** 完全错误。

AI 把 ERC-8004 和以下概念混淆了：
- EIP-712（结构化数据签名）
- EIP-1271（合约签名验证）
- 某种 signed transfer 机制

### 核查结果

[EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) 实际是 **"Trustless Agents"**：
- 关于 Agent 身份、信誉和验证
- 要求 EIP-155、EIP-712、EIP-721、EIP-1271
- 状态：Draft
- 由 MetaMask、Google、Coinbase 等提出

### 修正

笔记中标注为"纠正"，并记录了正确理解。

### 教训

技术标准问题绝对不能凭印象回答。必须查 EIP 官方页面或原始规范。AI 尤其容易把相似编号的标准混为一谈。

---

## 5. 跨文档引用路径

### AI 初始生成内容

笔记中写：

> 详细计划见 [open-source-contribution-plan.md](../tasks/technical/week-2/open-source-contribution-plan.md)

### 人工校验发现

**问题：** 相对路径在 GitHub web editor 中不渲染。

study-notes skill 明确要求所有跨文档引用使用完整 blob URL。

### 修正

改为：
> [open-source-contribution-plan.md](https://github.com/zane199109/monad-cohort-zane/blob/main/tasks/technical/week-2/open-source-contribution-plan.md)

### 教训

笔记中的内部引用必须用完整 GitHub blob URL，不能用相对路径。

---

## 6. 贡献计划中的 Issue/PR 混淆

### AI 初始生成内容

贡献计划中写了：

> 对应 Issue: #104 — feat(protocols): add aPriori aprMON liquid staking adapter

### 人工校验发现

**问题：** 这个编号实际上是 PR #104 的标题，不是 open issue。

AI 在第一次写贡献计划时，把 PR 内容当成了 issue 来规划。

### 修正

重新确认 Issue #6 是真正未认领的 open issue，且标签为 good first issue + starter。

### 教训

写贡献计划前必须先确认：
1. issue 是否 open（不是 closed/merged）
2. 是否已被他人认领
3. 编号是 issue 还是 PR

---

## 总结：AI 常见错误模式

| 错误类型 | 表现 | 预防方法 |
|---------|------|---------|
| 语义推断 | 把 "Agent-callable" 写成 "Agent-to-Agent" | 回到原文逐词核对 |
| 编号混淆 | 把 PR 当 Issue，把 closed 当 open | 用 API 过滤 pull_request 字段 |
| 知识幻觉 | 编造 ERC-8004 的定义 | 查 EIP 官方页面 |
| 路径错误 | 用相对路径引用其他文档 | 用完整 blob URL |
| 过度提炼 | 把原文细节概括成不准确的说法 | 保留原文关键短语作为锚点 |

## 人工校验的重点检查清单

- [ ] 每个技术术语是否能在原文中找到确切依据？
- [ ] 每个 GitHub 编号是 issue 还是 PR？状态是什么？
- [ ] 每个外部标准（EIP/ERC）是否查了原始规范？
- [ ] 每个内部引用是否用了完整 blob URL？
- [ ] 每个结论是否有原文支撑，还是 AI 的推断？
