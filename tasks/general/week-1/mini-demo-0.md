# Mini Demo 0 — NFT Badge System on Monad Testnet

**Author:** Zane
**Date:** 2026-07-06 ~ 2026-07-11  
**Wallet:** `0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C`  
**Contract:** `0xA4A736984104c206f9de526C4c782e9029DF5641` on Monad Testnet (Chain ID 10143)  
**Explorer:** https://testnet.monadexplorer.com/address/0xA4A736984104c206f9de526C4c782e9029DF5641

---

## 1. 做了什么

构建了一个完整的链上徽章系统（SBT），涵盖：

- **智能合约** — ERC721 徽章合约（Foundry 编译 + 部署）
- **链上交互** — 创建 12 种徽章类型，铸造 2 枚徽章，共 14 笔链上交易
- **前端 DApp** — 钱包连接、徽章墙展示、铸造流程、Admin 面板 + Claim 提交审核流程
- **Go 后端** — Claim 管理 API（提交、审核、铸造）、SQLite 持久化
- **测试** — 18 个 Foundry 测试全部通过
- **研究** — AI Agent × Monad 高频交互场景分析

### 产物索引

| 产物 | 路径 |
|------|------|
| 合约源码 | `practice/week-1/nft-badge/contracts/NFTBadge.sol` |
| Foundry 测试 | `practice/week-1/nft-badge/test/NFTBadge.t.sol` |
| 前端 | `practice/week-1/nft-badge/frontend/` |
| 后端 | `practice/week-1/nft-badge/backend/` |
| 完整 README | `practice/week-1/nft-badge/README.md` |
| Build Log | `tasks/general/week-1/week-1-buildlog.md` |

---

## 2. 哪部分是真实的链上操作

所有带 gas 消耗的交易均为真实链上操作：

| # | 操作 | Tx Hash | Gas |
|---|------|---------|-----|
| 1 | EOA 转账 1 MONAD | `0x0ef6c...` | 0.0021 MON |
| 2 | 合约部署 | `0x3afd3...` | 0.408 MON |
| 3-14 | 12 次 `createBadgeType` | `0x0f1b9...` 等 | ~1.7 MON |
| 15-16 | 2 次 `mint` | `0x799a3...` 等 | ~0.05 MON |
| 17 | EOA 转账 | `0x13bb3...` | 0.0012 MON |

**链下但真实的操作：**
- Foundry 测试套件（18 个用例，全部通过）：`forge test -vv`
- Go 后端编译运行：`go build && ./bin/server`
- 前端静态服务器：`npx serve -p 8080`
- Admin 面板：Claim 审核、Mint/Reject 操作通过后端调用合约

---

## 3. 哪部分由 AI 辅助完成

| 模块 | AI 参与度 | 说明 |
|------|----------|------|
| 合约骨架 | 80% | AI 生成 NFTBadge.sol 初稿（ERC721URIStorage + Ownable），人工审查修改了 6 个缺陷 |
| Foundry 测试 | 60% | AI 生成测试用例骨架，人工修复 OZ v5 custom error 兼容问题 |
| 前端 app.js | 70% | AI 辅助生成 MetaMask 连接、Badge Wall 渲染、日志抽屉逻辑 |
| 批量部署脚本 | 90% | AI 生成 create-all-badges.sh，直接可用 |
| Go 后端 | 50% | AI 生成 database/handler 骨架，人工调整路由和 CORS |
| Admin 页面 | 80% | AI 生成完整 HTML + JS，人工修改 API_BASE 和 CORS 适配 |
| 问题诊断 | 40% | AI 帮助解释 OZ v5 custom error 机制、MetaMask RPC 行为差异 |

---

## 4. 人工判断和修改

### 合约安全关键修改（6 处）

| # | AI 初稿问题 | 人工修正 | 影响 |
|---|-----------|---------|------|
| 1 | `_mint` | `_safeMint` | 防止铸给合约导致永久锁死 |
| 2 | `hasBadge` 枚举遍历 O(n) | `badgeCount` 映射 O(1) | AI 这段"看着对，跑不通" |
| 3 | `mint` 不校验 typeId 是否存在 | 增加 `BadgeTypeNotFound` revert | 防幽灵类型铸造 |
| 4 | `createBadgeType` 不校验 name | 增加 `EmptyName` revert | 防无意义空名 |
| 5 | `require("...")` 字符串报错 | custom error | 省 gas，更结构化 |
| 6 | 测试用 `vm.expectRevert("Ownable: ...")` | `abi.encodeWithSelector` | OZ v5 兼容 |

### 架构决策

| 决策 | 原因 |
|------|------|
| 前端静态化（本地 ethers.js） | 国内 CDN 不通，部署环境不可控 |
| 前端 8080 + 后端 8082 分离 | 符合标准 dev 模式，CORS 代理 |
| `wallet_revokePermissions` 处理断连 | 比 `wallet_requestPermissions` 更可靠 |
| Go 后端 + SQLite 而非纯链上 | Claim 审核需要 off-chain 状态管理 |
| 本地 output.css 替代 Tailwind CDN | 国内网络不可用 |

---

## 5. Week 2 方向选择

**选择：Tech**

### 理由

1. **本周实践以技术为主** — 合约开发、Foundry 测试、前端 DApp、Go 后端，全部是 Tech 轨道核心内容
2. **享受"跑通"的成就感** — 18 个 Foundry 测试全过、部署后在 Explorer 看到合约状态、前端链上数据对齐
3. **AI + 代码审查的兴趣** — 发现 AI 合约 6 个缺陷需要人工审查验证，既是技术深度也涉及 AI 协作最佳实践
4. **与 PrismSettle 项目的衔接** — 256-shard reputation storage、arbitration、indexer 都是 Tech 栈核心
5. **工具链已就绪** — Foundry、ethers.js、Go、MetaMask RPC，具备深入的技术基础

### 不在 Week 2 优先考虑的

- **Ops** — 社区运营、增长活动、Meme 等非优先方向
- **Research** — 可作为 Tech 的补充，在 PrismSettle 设计中持续产出系统分析

---

## 6. 作品集描述（一句话）

> Designed and deployed an ERC721 badge system on Monad Testnet with a full-stack DApp (Foundry + Go + Vanilla JS), including contract development, AI-assisted code generation with manual security review, on-chain minting, and an off-chain claim management workflow.

---

## 7. Week 2 想继续推进的问题

1. **PrismSettle 核心合约实现** — Agent Registry、256-shard Reputation System、Job 合约的 Mininal 实现
2. **Monad OCC 优化实践** — 验证 shard 存储能否真正解决 Monad 并行执行中的写入冲突问题
3. **Chainlink Automation 集成** — 作为可验证的定时触发机制，替代中心化 Cron
4. **动态 SVG Badge** — 链上 SVG 生成，替代 IPFS 静态 URI，提升徽章的可编程性
5. **Reorg-safe Indexer** — 为 PrismSettle 设计能处理 Monad 链重组的索引方案
