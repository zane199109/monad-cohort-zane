# Week 1 Build Log — Monad Cohort Zane

**姓名：** Zane
**日期范围：** 2026-07-06 ~ 2026-07-10
**钱包地址：** `0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C`
**课程钱包（与主力钱包分离）**

---

## 一、本周完成的全部链上实践

### 1. 钱包创建与 Testnet 配置
- 创建课程专用 MetaMask 钱包，与主力钱包严格隔离
- 添加 Monad Testnet 网络（Chain ID 10143, RPC: https://testnet-rpc.monad.xyz/）
- 通过 https://faucet.monad.xyz/ 领取测试币，当前余额 ~98.94 MONAD
- 通过 RPC `eth_chainId` 验证 Chain ID 返回 0x279f = 10143
- 通过 RPC `eth_getBalance` 查询余额，确认地址有效

### 2. 第一笔链上交易（EOA 转账）
- Tx Hash: `0x0ef6c69cc45f222ac706e78ac472f925f094089697ec9e34eda7802141bc2458`
- 向 `0xc2dced1736ca4a6e8de57407b45adca06683c9d6` 转账 1 MONAD
- 手续费: 0.002172 MONAD (Gas 21,000 x 103.45 Gwei)
- 区块: 42,736,505 | Nonce: 0 | 状态: Success
- 交易类型: EIP-1559 (type 0x2)

### 3. 智能合约开发与部署（NFT Badge）
- 合约源码: `practice/week-1/nft-badge/contracts/NFTBadge.sol`
- 合约地址: `0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC`
- 部署 Tx: `0x3afd30bcd9924dec81ba5e81cbe1c11e57cc3e7014826a00f8d17891d5096822`
- 区块: 43251317 | Gas Used: 3,889,936 (~0.408 MON) | 合约大小: 12,991 bytes

### 4. 合约交互（Read + Write）
- **Read 调用（view，不上链不花 gas）：**
  - `name()` -> "CourseBadge"
  - `symbol()` -> "CB"
  - `owner()` -> 课程钱包地址
  - `nextBadgeTypeId()` -> 12（全部 12 种类型已创建）
  - `nextTokenId()` -> 3（已铸造 2 枚）
  - `hasBadge(owner, 0/1)` -> true

- **Write 调用（上链花 gas）：**
  - `createBadgeType` x12（typeId 0-11），共 12 笔交易
  - `mint` x2（typeId 0, 1），共 2 笔交易
  - 批量创建 typeId 2-11 使用 `create-all-badges.sh` 脚本
  - 总 gas 消耗约 1.7 MON（批量创建 10 笔 x ~165-194k gas）

### 5. 前端开发（Badge Wall）
- 静态 HTML + Vanilla JS + ethers.js v5（本地下载，不依赖 CDN）
- Tailwind CSS 静态生成 output.css（28KB），替代 CDN 方案
- MetaMask 连接钱包、自动检测/切换 Monad Testnet
- Badge Wall 展示 12 种徽章，点击查看详情 + Mint 铸造
- 右侧日志抽屉记录完整操作链，txHash 可点击跳转 Explorer

### 6. 研究提交（AI Agent 高频交互场景）
- Research: 分析 AI Agent 为什么适合 Monad 高频交互场景
- Tech Demo: 设计了 AgentQuest 功能清单，从 PrismSettle 提取核心概念
- 涵盖 Agent 注册、声誉系统、Quest 生命周期、徽章自动分发

---

## 二、遇到的问题及解决过程

| # | 问题 | 解决方案 | 谁解决的 |
|---|------|---------|---------|
| 1 | 区块浏览器 testnet.monadexplorer.com 有 Cloudflare 保护，curl 无法直接访问 | 用 RPC 调用 eth_getBalance / eth_getTransactionByHash 替代 | 人工 |
| 2 | RPC 返回 429 Too Many Requests | 降低请求频率，间隔几秒重试 | 人工 |
| 3 | AI 生成的合约初稿有 6 个缺陷（见下表） | 逐一审查修改，Foundry 测试验证 | 人工 + AI 配合 |
| 4 | Foundry 初版测试 3/5 失败 | OpenZeppelin v5 的 Ownable 改用 custom error，需 abi.encodeWithSelector 完整匹配 | 人工排查 |
| 5 | Tailwind CDN 国内不通，页面空白 | Tailwind CLI 静态生成 output.css，替换 CDN 引用 | 人工 |
| 6 | ethers.js CDN 也可能不通 | 本地下载 ethers.umd.min.js（760KB）放到 frontend 目录 | 人工 |
| 7 | wallet_requestPermissions 返回账户为空 | 重构账户获取逻辑，先解析 perms[0].caveats，fallback 到 eth_accounts | 人工 |
| 8 | mint typeId=2 报 BadgeTypeNotFound | 链上只创建了 typeId 0,1，mock-data 定义 12 种未全部创建 | 人工 + 批量脚本 |

### AI 初稿的 6 个缺陷及人工修正

| # | AI 初稿问题 | 人工修正 | 原因 |
|---|-----------|---------|------|
| 1 | mint 用 _mint | 改为 _safeMint | _mint 不检查接收方是否为合约，铸给合约会永久卡死 |
| 2 | hasBadge 试图用 balanceOf + 循环枚举，但没有 typeId 映射 | 新增 tokenBadgeType 和 badgeCount 两个映射，hasBadge 改为 O(1) | AI 这段"看起来对、实际跑不通" |
| 3 | mint 没校验 typeId 是否存在 | 增加 BadgeTypeNotFound revert | 防幽灵类型 |
| 4 | createBadgeType 没校验 name 非空 | 增加 EmptyName revert | 避免无意义空名 |
| 5 | 用 require("...") 字符串报错 | 改为 custom error | 省 gas + 更结构化 |
| 6 | 测试用 vm.expectRevert("Ownable: ...") | OZ v5 改用 custom error，需 abi.encodeWithSelector | 初版测试 3 个全挂，修后 5 个全过 |

---

## 三、AI 帮我解决了什么

1. **合约结构骨架生成** — Prompt 描述需求后，AI 给出了完整的 NFTBadge 合约初稿（继承 ERC721URIStorage + Ownable）
2. **合约结构解释** — AI 解释了每个 struct、mapping、modifier 的作用，帮助理解
3. **批量创建脚本** — create-all-badges.sh 由 AI 辅助生成，批量调用 cast send 创建剩余 10 种 badge type
4. **前端代码生成** — app.js 的 MetaMask 连接、Badge Wall 渲染、日志抽屉等逻辑由 AI 辅助生成
5. **问题诊断** — 遇到测试失败时，让 AI 解释 OZ v5 的 custom error 机制，加速修复

---

## 四、必须由我人工判断的地方

1. **AI 生成代码的安全性审查** — `_safeMint` vs `_mint`、hasBadge 的映射缺失、权限校验，这些 AI 看不出，必须人工把关
2. **依赖库版本差异** — OpenZeppelin v5 的 Ownable 报错机制变了，AI 可能还在用 v4 的写法，只有实际跑测试才暴露
3. **"keep it simple" 的底线** — AI 容易顺手加 burn、batchMint、可升级代理等超出需求的特性，需要人明确拒绝
4. **前端网络问题** — CDN 在国内不通，需要人工判断用静态化方案替代
5. **MetaMask RPC 返回值格式不固定** — wallet_requestPermissions 的返回格式因版本而异，需要多种 fallback 策略
6. **链上状态与前端 mock-data 对齐** — 部署后需要批量补全链上数据，不能只靠前端

---

## 五、对 Monad 和 Web3 的理解变化

### 之前
- Web3 学习主要关注应用层（智能合约、dApp、DeFi）
- 对协议层的理解停留在表面
- 认为"能跑通就行"，不太在意代码的安全细节

### 现在
1. **钱包不是存钱的，是管钥匙的** — 公钥=地址（可公开），私钥=签名凭证（绝对保密），助记词=BIP-39 编码的私钥
2. **Gas 机制** — 基础转账 21,000 gas，EIP-1559 下有 base fee（销毁）+ priority fee（小费），失败交易也消耗已用 gas
3. **Monad 的定位** — 不是替代以太坊，而是在 EVM 兼容性基础上追求高性能（>10,000 TPS），秒级确认，低 gas
4. **测试网的价值** — 测试币没有经济价值，但有学习价值。Testnet 出块速度极快（4300 万+ 区块），适合快速迭代
5. **Proof of Work 是 Web3 的基础** — 你的 GitHub 提交、技术文章、开源贡献，共同构成链上简历
6. **AI 辅助编程的边界** — AI 能快速给结构骨架，但安全细节和"能不能跑通"必须人工把关

---

## 六、Week 2 方向选择

### 初步选择：Tech  

**理由：**

1. **本周实践以技术为主** — 钱包配置、合约部署、Foundry 编译/测试、前端开发，全部是 Tech 轨道的核心内容
2. **享受"跑通"的成就感** — 5 个 Foundry 测试从 3 个挂到 5 个全过，部署后在 Explorer 上看到合约状态，这种闭环感很强
3. **AI + 代码审查的兴趣** — 发现 AI 生成的合约有 6 个缺陷，需要通过人工审查和测试来验证。这个过程既有技术深度，又涉及 AI 协作的最佳实践
4. **与 PrismSettle 项目的衔接** — PrismSettle 的核心创新（256-shard reputation storage、arbitration、indexer）都是技术栈的一部分，Tech 轨道能直接推进项目
5. **工具链掌握** — 本周已熟练使用 Foundry（forge build/test/script/cast）、ethers.js、MetaMask RPC，具备继续深入的技术基础

**为什么不选 Ops：**
- Ops 是连接用户运营、活动（运营、活动（Space/小型活动）、传播执行和反馈复盘机制。目前还是希望把精力集中在技术的提升上，而不是社区运营，时间有富裕的话会考虑。

**为什么不选 Research：**
- 本周完成了一份 Research 提交（AI Agent 高频交互场景分析），但深度有限
- Research 更需要系统性文献综述、竞品分析、经济模型设计等。
- 不过 Research 可以作为 Tech 的补充，在 PrismSettle 的设计中持续产出

---

## 七、本周最重要的 3 个学习收获

1. **AI 能快速给结构骨架，但安全细节和"能不能跑通"必须人工把关** — `_safeMint` vs `_mint`、`hasBadge` 的映射缺失都是 AI 看不出的问题。真正可信的检查点是跑出来的（编译通过、测试通过），不是"看着像对的"。

2. **依赖库版本差异是隐蔽坑** — OpenZeppelin v5 把 `Ownable` 报错从字符串改成了 custom error，照搬旧写法测试全挂。只有实际跑测试才暴露，这提醒我在开发中"版本意识"至关重要。

3. **前端与链上状态必须对齐** — mock-data 定义了 12 个 badge，但链上只创建了 2 个类型，mint 会 revert。部署后需要批量补全。这适用于所有 dApp：前端展示和链上数据的一致性需要持续维护。

---

## 八、安全自查

- [x] 助记词已离线手写备份，未出现在任何电子文件中
- [x] 主力钱包与实验钱包地址已确认不同
- [x] 未在任何公开平台透露助记词或私钥
- [x] MetaMask 仅从官网安装
- [x] .env 文件未被提交（.gitignore 已配置）
- [x] 合约源码不含私钥、助记词
- [x] 截图不含敏感信息

---

## 九、产物索引

| 产物 | 路径 |
|------|------|
| 合约源码 | `practice/week-1/nft-badge/contracts/NFTBadge.sol` |
| 部署脚本 | `practice/week-1/nft-badge/script/Deploy.s.sol` |
| 测试 | `practice/week-1/nft-badge/test/NFTBadge.t.sol` |
| 前端 | `practice/week-1/nft-badge/frontend/` |
| README | `practice/week-1/nft-badge/README.md` |
| AI 合约审查记录 | `tasks/general/week-1/ai-solidity-contract-review.md` |
| 部署记录 | `tasks/general/week-1/monad-testnet-deploy.md` |
| 第一笔交易 | `tasks/general/week-1/first-monad-transaction.md` |
| 钱包配置 | `tasks/general/week-1/wallet-setup-monad-testnet.md` |
| 研究提交 | `tasks/general/week-1/monad-frequent-interaction-demo.md` |
| Mini Demo 0 | `tasks/general/week-1/mini-demo-0.md` |

---

## 十、后记：2026-07-11 补丁记录

Mini Demo 0 提交后，根据用户测试反馈做了以下修复：

### 10.1 钱包断连后无法切换账号

| 尝试方案 | 结果 | 最终方案 |
|---------|------|---------|
| `wallet_requestPermissions` 替代 `eth_requestAccounts` | 对已授权站点同样静默返回 | ❌ |
| 添加 `wasDisconnected` 标记条件分支 | `wallet_requestPermissions` 在不同 MetaMask 版本行为不统一 | ❌ |
| `wallet_revokePermissions` 主动撤回授权 | 每次断连真正撤销 MetaMask 授权，下次 `eth_requestAccounts` 必然弹窗 | ✅ |

**教训：** `wallet_requestPermissions` 在 MetaMask 中的行为取决于版本实现，有的版本对已授权站点直接静默通过。最可靠方案是在 `disconnect()` 中主动调用 `wallet_revokePermissions`。

### 10.2 accountsChanged 阻止页面刷新

`location.reload()` → `connect(true)`：MetaMask 授权恢复后触发 `accountsChanged` 事件，旧代码用 `location.reload()` 刷新页面导致连接状态丢失，需要用户再点一次 Connect。改用 `connect(true)` 静默恢复。

### 10.3 CORS 跨域

前端 8080、后端 8082 双端口模式下，Go 后端无 CORS 头，浏览器拦截所有 API 请求。添加 CORS 中间件（Allow-Origin: \*，支持 OPTIONS 预检）。

### 10.4 fmt.Sscanf 判断缺陷

`/api/claims/3/reject` 路径中，Sscanf 匹配 `/api/claims/%d/approve` 时 `%d` 匹配了数字（n=1），虽然后续 `/approve` vs `/reject` 不匹配，但 `n==0` 判断为假，错误走了 approve 分支。修复为 `n==0 || err != nil`。

### 10.5 Admin 面板 404

Admin 页面 `backend/web/admin/index.html` 由 Go 后端提供服务，但用户用 `npx serve`（端口 8080）访问时没有该路由。方案：将 admin 页面复制到 `frontend/admin/index.html`，`npx serve` 可访问。

### 10.6 Claim 提交流程

| 问题 | 修复 |
|------|------|
| 提交后 Modal 关闭，但卡片仍显示 Submit Claim | 提交成功后直接设置 `state.claimStatus[typeId] = 'pending'` |
| 用户可重复提交 | 卡片显示 "Pending Review" disabled 按钮 |
| 拒绝后无重试入口 | 拒绝后卡片显示 "Resubmit Claim" |
| 前端不知道 claim 状态 | 后端新增 `GET /api/claims/check?user_addr=X&type_id=Y` 接口 |
| 断连后 Admin 链接仍显示 | 加入 `adminLink.classList.add("hidden")` |

---