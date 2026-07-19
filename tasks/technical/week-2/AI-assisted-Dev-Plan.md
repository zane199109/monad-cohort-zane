# AI-assisted Dev Plan

## PrismSettle: 最小 Web3/AI 原型定义

> 目标：Monad Hackathon 30 秒电梯演讲 demo — Agent 注册 → Job 创建 → Escrow 结算全链路

---

## 一、我要做的最小功能是什么？

**Agent 注册 + 创建第一个 Job 并完成一次 Escrow 结算演示。**

具体流程：

1. Seller Agent 在 Registry 上注册（获得声誉 shard）
2. Buyer Agent 创建一个 Job（escrow 锁定资金）
3. Seller 提交 proof hash（承诺）
4. Evaluator（规则引擎）判定成功
5. Escrow 释放到 Seller

这个流程覆盖 Trust Layer → Commerce Layer → Indexer/Evaluator 的全链路，是 Monad Hackathon 评委能 30 秒看懂的核心 demo。

---

## 二、谁会使用它？

| 角色 | 谁 | 目的 |
|------|-----|------|
| **Buyer Agent** | 发起任务的 AI agent（或人类模拟 buyer） | 发布需求、锁定 escrow、提交 dispute |
| **Seller Agent** | 执行任务的 AI agent（或人类模拟 seller） | 接单、提交 proof、接收付款 |
| **Evaluator** | 规则引擎（V1 无 LLM） | 自动判定 job 是否完成 |
| **Admin/评委** | Hackathon 评审 | 一键跑通全流程 demo |

**最小 MVP 只需两个用户：Buyer 和 Seller。** Evaluator 用硬编码规则 mock。

---

## 三、用户完成的一个动作是什么？

**"一个 Buyer 发布一个数据标注任务，Seller 完成后收到付款。"**

用户操作步骤：

1. 连接钱包（MetaMask / Anvil 预 funded account）
2. Buyer 调用 `createJob(jobDescription, escrowAmount)` — 锁定 10 USDC
3. Seller 调用 `submitProof(jobId, proofHash)` — 提交 SHA256 承诺
4. Evaluator 自动判定（mock：proofHash 非空 = success）
5. Buyer 调用 `releaseEscrow(jobId)` — 资金到账
6. 前端展示：Job 状态从 Pending → Completed + 双方声誉更新

**这是电梯演讲的核心画面。** 30 秒内完成。

---

## 四、我需要读哪 1–3 个文档？

1. **`src/PrismSettleJob.sol`**（270 行）— Job 合约的 createJob/submitProof/releaseEscrow 状态机
2. **`src/PrismSettleRegistry.sol`**（434 行）— Agent 注册 + 256-shard reputation 写入逻辑
3. **`test/Integration.t.sol`** — 已有端到端集成测试，可直接复用为 demo 脚本逻辑

这三个文件覆盖了从注册到结算的全部核心逻辑。不需要读 Benchmark 或 Mock 文件。

---

## 五、本周真实实现什么？哪些可以 mock？

### 真实实现（Must Have）

| 优先级 | 内容 | 工作量 |
|--------|------|--------|
| P0 | **Anvil 本地部署脚本**：一键 deploy Registry + Job + MockERC20 到本地链 | 1h |
| P0 | **Go CLI Demo**：用 `cast send` 模拟 buyer/seller 完成 createJob → submitProof → releaseEscrow 全流程 | 2h |
| P1 | **前端单页**：连接钱包 → 显示当前账户声誉 → 创建 Job → 查看 Job 状态 | 3h |
| P1 | **Reputation 查询 API**：Go 后端 `GET /agent/{address}/reputation` 读取 on-chain shard 数据 | 1h |

### 可以 Mock（Should Have）

| 内容 | 为什么可 mock | 替代方案 |
|------|-------------|---------|
| **Evaluator Engine** | V1 不需要 LLM，规则判定即可 | 硬编码：proofHash != "" → success |
| **Indexer** | 演示用 Anvil 本地链，直接 eth_call 查状态 | 不写 event listener，前端直连合约 |
| **X402 支付流** | Hackathon demo 用 MockERC20 即可 | 已有 MockX402Facilitator.sol，跳过真实 x402 |
| **Arbitration** | 正常流程不触发仲裁 | 只实现 happy path，dispute 按钮 disabled |
| **256-shard 性能验证** | 不需要在 demo 中证明 | 架构文档里写数字，demo 只展示 single-shard 写入 |
| **前端多页面路由** | 单页足够 | 一个 page.tsx 包含所有交互 |

---

## 六、我如何证明它做出来了？

### 验收标准（每个必须实际可运行）

1. ✅ `forge script DeployAll.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` — 三个合约部署成功，地址打印出来
2. ✅ Go CLI 脚本输出完整流程日志：
   ```
   [BUYER] Created Job #1, Escrow: 10 USDC
   [SELLER] Submitted Proof for Job #1
   [EVALUATOR] Job #1: SUCCESS (rule-based)
   [BUYER] Released Escrow for Job #1
   [SYSTEM] Seller reputation updated: shard[42] = +15
   ```
3. ✅ 前端页面打开后能看到：
   - 已连接的账户地址
   - "Create Job" 按钮 → 输入框 → 确认后显示 Job ID
   - Job 状态从 Pending → Completed 的实时变化
4. ✅ `forge test -vvv` 全部通过（已有测试不需要改）
5. ✅ 录屏或截图：30 秒内从 connect wallet 到 escrow released 的完整流程

### 交付物清单

- `scripts/demo.sh` — 一键跑完 Anvil deploy + cast 操作全流程
- `frontend/app/page.tsx` — 单页 demo UI
- `backend-go/cmd/demo/main.go` — Go CLI 集成测试脚本
- `docs/DAY0-MINIMAL-PROTOTYPE.md` — 本文档 + 使用说明
