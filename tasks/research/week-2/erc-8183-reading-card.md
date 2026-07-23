# ERC-8183 Agentic Commerce Protocol — EIP/MIP Reading Card

## 基本信息

**提案名称：** ERC-8183 — Agentic Commerce Protocol（代理商务协议）
**提案编号：** ERC-8183
**状态：** Draft（草案，PR #11394，2026-02-25 提交）
**作者：** Davide Crapis (@dcrapis), Bryan Lim (@ai-virtual-b), Tay Weixiong (@twx-virtuals), Chooi Zuhwa (@Zuhwa)
**原文链接：**
- EIP 页面：https://eips.ethereum.org/EIPS/eip-8183
- PR：https://github.com/ethereum/EIPs/pull/11394
- Magicians 讨论：https://ethereum-magicians.org/t/erc-8183-agentic-commerce/27902
- 参考实现：https://github.com/ethereum/EIPs/blob/master/EIPS/eip-8183.md（AgenticCommerce.sol + IACPHook.sol）
**依赖：** Requires EIP-20（单一代币支付合约）。RECOMMENDS ERC-8004（声誉/身份层，可选扩展）

---

## 背景问题

AI Agent 的能力正在快速成熟——它们可以写代码、做数据分析、编排 API。但一个核心问题始终没有解决：**Agent 如何被可靠地支付？**

现有标准无法覆盖这个场景：

1. **ERC-20 / ERC-721** 只处理资产转移，不处理"工作协议"。你转了 USDC，但怎么证明对方确实完成了工作？
2. **多签钱包的 escrow 模式**是各平台各自实现的，互不兼容。A 平台的 escrow 合约 B 平台无法调用。
3. **ERC-8004** 定义了 Agent 的身份和声誉，但没有定义商业交易的 mechanics——它管"你是谁"，不管"你怎么交易"。

这导致了一个碎片化的局面：每个平台都自己发明 escrow 逻辑，客户端无法跨平台验证 Provider 的声誉，链上缺乏可组合的工作完成证明，多 Agent 流水线也无法可靠地互相委托子任务。

简单来说：**没有共享标准，Agent 经济就无法规模化。**

---

## 核心方案

ERC-8183 定义了一套**最小化的链上工作合约接口**，核心思想可以用一句话概括：

> Client 创建 Job → 设定预算 → 预存资金到 escrow → Provider 交付工作 → 独立的 Evaluator 裁定是否完成 → 资金释放给 Provider 或退回 Client。

关键设计点：

- **支付使用合约全局统一的 ERC-20 代币**（如 USDC），不支持原生 ETH
- **Evaluator 可以是 Client 自己**，也可以是一个独立的第三方地址或合约——规范本身不限制
- **Budget 分两步设置**：先 `setBudget()` 协商价格，再 `fund()` 存入 escrow，防止抢跑
- **可选集成 ERC-8004**：工作完成后可通过 Hook 自动写入链上声誉记录，但规范不强制
- **expiredAt + claimRefund()** 作为安全阀：即使 Evaluator 失联，任何人都可以在过期后触发退款

### 状态机（6 个状态）

```
createJob()
     │
  [Open] ←───── Client 可以直接 reject()
     │ setBudget() + fund()
  [Funded] ←─── Evaluator 可以在提交前 reject()
     │ submit()
[Submitted]
     │
 ┌───┴───┐
complete()  reject()
[Completed] [Rejected]

[Funded] ── 过期 ──→ [Expired]（claimRefund）
[Submitted] ── 过期 ──→ [Expired]（claimRefund）
```

注意：**Open → Rejected**（Client 未打款前直接取消）、**Funded → Rejected**（Evaluator 在 Provider 提交前否决）、**Funded/Submitted → Expired**（超时退款）都是合法转换路径。Completed 和 Rejected 是终态，资金只能释放一次，不可重复花费。

### 核心接口（精简，参考实现 AgenticCommerce.sol）

> `function createJob(provider, evaluator, expiredAt, description, hook) returns (jobId)`
> `function setProvider(jobId, provider)`
> `function setBudget(jobId, amount, optParams)`
> `function fund(jobId, optParams)`
> `function submit(jobId, deliverable, optParams)`
> `function complete(jobId, reason, optParams)`
> `function reject(jobId, reason, optParams)`
> `function claimRefund(jobId)`

注意差异：
- `createJob` 不设 budget 和 token——budget 通过后续 `setBudget()` 设定，token 是合约全局固定的 ERC-20 地址
- `setProvider` 用于创建时 provider = address(0) 的场景（先发 Job 再指定 Provider）
- `setBudget` 可由 Client 或 Provider 调用，协商价格
- `deliverable` 和 `reason` 均为 **bytes32**（通常为 IPFS CID 或交付物哈希），不是 string
- `optParams`（bytes）透传给 Hook 合约，用于扩展功能（如竞价签名、代币转付参数等）
- `fund` 从 Client 账户 pull ERC-20 代币，不支持 native ETH

---

## 影响对象

| 参与者 | 影响方式 |
|--------|----------|
| **AI Agent 开发者** | 可以直接在链上接收付款，无需依赖中心化平台（如 Upwork） |
| **Agent 消费者（Client）** | 获得可验证的 escrow 保护，资金安全由合约保证 |
| **Evaluator / 仲裁方** | 新角色出现——可以是人、DAO 多签、ZK 验证器、TEE 可信执行环境，或 AI 协调器 |
| **DeFi 协议** | 可组合性增强——ERC-8183 escrow 可作为 DeFi 策略的输入/输出环节 |
| **其他 Agent 标准** | ERC-8004（身份+声誉）天然搭档，形成"身份→交易→声誉"闭环 |
| **跨链桥/聚合器** | 标准化接口意味着可以跨多个 EVM 链复用同一套 escrow 逻辑 |
| **Layer 2 网络** | 低 gas 的 L2 是 ERC-8183 的理想运行环境（高频小额工作合约） |

---

## 关键术语

| 术语 | 含义 |
|------|------|
| **Client** | 创建 Job 并预存资金的地址。可以是 EOA、多签或另一个智能合约/Agent |
| **Provider** | 交付工作的地址。建议是 ERC-8004 注册的 Agent |
| **Evaluator** | 裁定工作完成或拒绝的可信地址（或合约）。可以是 Client 自己、DAO 多签、验证注册表或仲裁合约 |
| **Budget** | 预存在合约中的支付金额，以合约全局 ERC-20 代币计价 |
| **Deliverable** | Provider 提交工作时附带的 URI/Hash，指向链下交付物（IPFS CID、HTTPS URL 等） |
| **Escrow** | 资金在合约中锁定，直到 Evaluator 调用 complete() 或 reject() 才释放 |
| **Reputation** | 规范本身不定义声誉分计算方式。工作完成后可通过 Hook 或 Evaluator 在 complete/reject 时调用 ERC-8004 注册表写入信任信号（推荐），但这不是协议核心的一部分 |

---

## 争议与风险

### 1. "Agentic" 这个词是否有意义？

**批评者认为：** ERC-8183 并没有定义什么是"Agent"。标题里的"Agentic"只是一个营销标签，协议本身对人和 AI Agent 一视同仁——它本质上就是一个 Job Registry + Escrow。

> *"ERC-8183 did not define what 'agentic' means... The protocol should treat human and AI agent as identical."* — kevzzsk

**我的理解：** 这个批评有道理。协议本身确实是通用的 escrow 标准，"Agentic" 更多是在描述**目标用例**而非技术特性。类似地，ERC-20 也没说"只有 Token 才能用"，但它成了 Token 的事实标准。

### 2. Evaluator 的信任问题

**核心矛盾：** Evaluator 拥有决定性的权力——可以批准欺诈性工作，也可以拒绝诚实的工作。

生产环境的经验表明：
- 单个 AI 协调器作为 Evaluator 是**单点故障**
- 解决方案是使用 3+ 独立模型达成共识（ThoughtProof 在 Base 主网上已部署）
- 但共识机制本身也可能被操纵——模型之间可能存在系统性偏差

### 3. 与现有方案的竞争

**Task Market Protocol (TMP)** 的开发者 beau 提出 ERC-8183 的设计"far more fleshed out"，建议拆分或合并。这暗示 ERC-8183 可能不是唯一的竞争标准。

**OpenZeppelin ConditionalEscrow** 和 **Arkhai Alkahest** 提供了更通用的 escrow 抽象——ERC-8183 是否过度专门化？

### 4. 链接 Job（两阶段工作）

gpt3_eth 提出了一个实际痛点：某些 DeFi 工作流需要两个关联的 Job（开放仓位 → 评估结果）。ERC-8183 当前只支持单次 Job 生命周期。

### 5. Gas 成本

Job 结构体包含 `description`（string）字段，存储成本较高。`deliverable` 和 `reason` 均为 bytes32，无额外存储开销。对于高频小额工作，L1 上的 gas 可能不经济。

---

## 产品启发

### 1. 最小化接口 = 最大可组合性

ERC-8183 有意保持接口精简——只定义状态转换和事件，不限制内部实现。这类似于 ERC-20 的设计哲学：**接口越小，越容易被各种实现复用**。

启发：在设计协议接口时，应该追求"最小必要接口"，而不是把太多业务逻辑塞进标准本身。

### 2. 声誉与交易解耦

ERC-8183 将声誉更新（ERC-8004）作为可选集成，而不是核心流程的一部分。这意味着：
- 没有声誉的系统也可以用 ERC-8183
- 有声誉的系统可以获得额外的信任层
- 两个标准可以独立演进

启发：**核心协议和增值层应该解耦**，让不同成熟度的项目都能使用。

### 3. 安全阀设计

`expiredAt + claimRefund()` 是一个精巧的设计——即使 Evaluator 完全失效，Client 也有退路。这种"降级安全"的思路值得借鉴：
- 任何依赖第三方的系统都应该有超时回退
- 回退路径不应该要求第三方的参与

### 4. 链下交付 + 链上证明

ERC-8183 将 Deliverable 存为 URI/Hash，而不是直接上链。这是务实的选择：
- 大部分工作产物（代码、文档、分析）太大，不适合链上存储
- 链上只需要保留可验证的引用（CID/Hash）
- 配合 IPFS 或 HTTPS 即可实现去中心化存储

### 5. 多模型共识 Evaluator

ThoughtProof 的实践表明：**用多个独立模型达成共识**比单模型更可靠。这可以应用到任何需要客观评估的场景——内容审核、代码审查、性能测试等。

---

## 我的疑问

1. **Evaluator 的最佳实践是什么？** 规范只说 Evaluator 是一个地址，但在实践中，主观性强的工作（研究、创意）需要更复杂的评估逻辑。规范是否应该给出指导？

2. **跨链兼容性如何保证？** ERC-8183 是 EVM 标准，但如果 Agent 在多条链上工作，如何保证跨链的 Job 一致性？

3. **Sybil 防御机制？** 规范提到 20k Agent 场景下的 Sybil 压力，但没有提供具体的防 Sybil 方案。仅靠 ERC-8004 身份注册够吗？

4. **Rasch Model 评估的可行性？** 有社区成员提出使用 Rasch Model 进行科学级评估，但生产数据表明这在大规模场景下仍然困难。有没有更实用的替代方案？

5. **与 DeFi 策略的集成模式？** gpt3_eth 提出的"两阶段 Job"（开仓 → 评估）是否有标准化的接口？还是每个协议各自实现？

6. **ERC-8183 与 Task Market Protocol 的关系？** 两者都在做类似的事情，最终会合并还是并存？如果并存，如何避免生态碎片化？

---

## Monad 适配分析

**结论：** ERC-8183 对 Monad 的适配度很高——成本低、速度快、战略定位匹配。PrismSettle 选择基于 ERC-8183 构建 Commerce Layer 是正确的方向。唯一需要关注的是：ERC-8183 目前还是 Draft，接口可能变动，建议锁定一个版本（PR #11394 的 diff）作为实现基准。

