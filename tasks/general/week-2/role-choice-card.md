# Role Choice Card

**状态：** 进行中
**学分：** 10
**日期：** 2026-07-13

---

## 主方向

Dev（技术）

---

## 选择理由

1. **已有基础匹配**：web2：4年的java实战经验，2年的java教学经验。web3: Cobo 黑客松一等奖项目（AEP）是多 agent 协同 escrow 协议，涉及智能合约（ERC8004、自定义权限逻辑）和 Go 后端。Foundry/Solidity 开发流程熟练，Go 后端有 Gin + PostgreSQL + Redis 实战经验。
2. **PrismSettle 需要 Dev 落地**：当前在做的 PrismSettle 项目是 Monad-native A2A commerce protocol，核心创新是 256-shard storage 解决 Monad OCC 冲突，需要智能合约开发和链上工具实现。Dev 方向能直接服务于这个项目。
3. **Job Portfolio 价值**：相比 Research 和 Ops，Dev 产出（可运行的 repo、链上交易证据、代码架构）最能直观展示技术深度，符合通过更深 infra/system design 能力证明自己转型 Web3 后端的目标。

---

## 服务的问题

- 如何把 PrismSettle 的技术设计（Registry、Shard Storage、Evaluator、仲裁机制）变成可运行的代码？
- 如何在 Monad testnet 上验证 256-shard storage 减少 OCC 冲突的实际效果？
- 如何建立一套可复现的 AI-assisted 开发工作流，提高开发效率？

---

## 本周最小可交付产出

一个基于 Monad testnet 的可运行原型 + 完整 Portfolio Pack。

具体范围：
- 选择 PrismSettle 的一个子模块（如 Registry 或 Shard Storage 的分片逻辑）实现最小可运行版本
- 包含 Foundry 合约 + 测试 + Monad testnet 部署证据
- 配套 README、截图/录屏、AI Collaboration Log、Known Issues

---

## 参考资料

- [Monad Developer Docs](https://docs.monad.xyz/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [GitHub Docs](https://docs.github.com/)
- [Cursor Docs](https://docs.cursor.com/)
- [Moss Repository](https://github.com/nishuzumi/moss)
- [Web3 Career](https://web3intern.xyz/zh/)
- [Developer Roadmaps](https://roadmap.sh/)

---

## Week 3 角色

智能合约开发 + 链上工具开发 + 链下工具开发。

能提供的 Proof of Work：
- 完整的 Foundry 项目结构（合约、测试、部署脚本）
- Monad testnet 上的部署记录和交易 hash
- AI-assisted 开发工作流记录
- 对 PrismSettle 技术架构的理解和代码实现

需要队友：
- Frontend 开发（DApp 交互界面）
- Ops 方向（项目宣传和文档整理）
- Research 方向（竞品分析和协议对比）

---

## Week 2 实际产出

- **Moss 开源项目深度研究**：9 篇 ADR + PR #31 全量 diff 分析（+5396/-4199 行，126 文件）
- **Fetch-ABI CLI 实现**：Issue #28，17 个测试用例覆盖所有路径，依赖注入模式
- **架构理解**：从旧架构（Plan/Expects/Effects）到新架构（Capability Tree/Receipt/ProtocolRef）的完整演进脉络
- **安全设计分析**：三层安全机制（编译时 → 运行时 → 模拟时）
