# Week 1 Build Log

## 每日记录

### Day 1 — 开营与 Web3 入门
**日期：** [填写日期]

**学习内容：**
- 入门导读：https://web3intern.xyz/zh/preface/
- 区块链基础概念：https://web3intern.xyz/zh/blockchain-basic/
- 以太坊概览：https://web3intern.xyz/zh/overview-of-ethereum/

**关键收获：**
- 

**截图/链接：**
- 

**遇到的问题：**
- 

**修复过程：**
- 

---

### Day 2 — 工具准备与 Builder 身份
**日期：** [填写日期]

**学习内容：**
- 远程工作指南：https://web3intern.xyz/zh/remote-work-guide/
- 岗位全景图：https://web3intern.xyz/zh/position-introduction/

**工具安装记录：**
- [ ] X/Twitter
- [ ] Telegram
- [ ] Discord
- [ ] GitHub
- [ ] AI Coding 工具：[选择]

**关键收获：**
- 

**截图/链接：**
- 

**遇到的问题：**
- 

**修复过程：**
- 

---

### Day 3 — 钱包、安全与第一笔测试网交易
**日期：** 2026-07-08

**学习内容：**
- 安全与合规：https://web3intern.xyz/zh/security/
- 加密钱包：https://buildanything.so/zh/tracks/freshman
- Monad Testnets：https://docs.monad.xyz/developer-essentials/testnets
- Block Explorers：https://docs.monad.xyz/tooling-and-infra/block-explorers

**实操记录：**
- [x] 安装 MetaMask（已有）
- [x] 创建课程专用钱包
- [x] 备份助记词（⚠️ 绝不上传/截图/提交）
- [x] 添加 Monad Testnet
- [x] 获取测试币（水龙头领取）
- [x] 完成转账/交互（向 `0xc2dce...3c9d6` 转账 1 MONAD）
- [x] 在 explorer 中查看交易

**课程钱包地址：** `0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C`
**Monad Testnet Chain ID：** 10143
**RPC：** https://testnet-rpc.monad.xyz/
**Explorer：** https://testnet.monadexplorer.com/
**当前余额：** ~98.94 MONAD

**第一笔交易详情：**
- Tx Hash: `0x0ef6c69cc45f222ac706e78ac472f925f094089697ec9e34eda7802141bc2458`
- 转账金额: 1 MONAD
- 接收地址: `0xc2dced1736ca4a6e8de57407b45adca06683c9d6`
- 状态: ✅ 成功
- 手续费: 0.002172 MONAD (Gas 21,000 × 103.45 Gwei)
- 区块高度: 42,736,505
- 时间: 2026-07-06 17:02:48
- 交易类型: EIP-1559 简单转账 (input: 0x)
- Nonce: 0 (该地址第一笔交易)

**关键收获：**
- 课程钱包要与主力钱包分离，这是安全第一原则
- Monad Testnet 的 Chain ID 是 10143，区别于其他 EVM 链
- 通过 RPC 可以直接查询余额，区块浏览器则提供更丰富的可视化信息
- 区块浏览器（Explorer）是链上世界的"搜索引擎"，可以查地址、交易、合约

**截图/链接：**
- 提交文档：tasks/general/week-1/wallet-setup-monad-testnet.md
- Explorer 链接：https://testnet.monadexplorer.com/address/0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C

**遇到的问题：**
- 区块浏览器 testnet.monadexplorer.com 需要浏览器访问（Cloudflare 保护，curl 无法直接访问）

**修复过程：**
- 使用 RPC 调用 eth_getBalance 替代浏览器查询，确认地址有效且有余额

---

### Day 4 — AI + Solidity + 合约部署
**日期：** [填写日期]

**学习内容：**
- 智能合约开发：https://web3intern.xyz/zh/smart-contract-development/
- Solidity Docs：https://docs.soliditylang.org/
- Remix IDE：https://remix.ethereum.org/
- OpenZeppelin：https://docs.openzeppelin.com/contracts/
- Monad Remix 部署指南：https://docs.monad.xyz/guides/deploy-smart-contract/remix

**实操记录：**
- [ ] 用 AI 生成最小 Solidity 合约
- [ ] 在 Remix 中编译合约
- [ ] 部署合约到 Monad Testnet
- [ ] 验证合约地址和 ABI

**合约地址：** 
**Transaction Hash：** 
**Contract Source Code：** 

**关键收获：**
- 

**截图/链接：**
- 

**遇到的问题：**
- 

**修复过程：**
- 

---

### Day 5 — Monad 理解与 Mini Demo 0
**日期：** [填写日期]

**学习内容：**
- Monad vs Ethereum：https://docs.monad.xyz/developer-essentials/differences
- Best Practices：https://docs.monad.xyz/developer-essentials/best-practices
- Gas Pricing：https://docs.monad.xyz/developer-essentials/gas-pricing
- BuildAnything Freshman：什么是 Monad？
- 10,000 TPS 会让什么成为可能？
- 数据库与文件存储
- 让你的应用具备生产级品质

**Mini Demo 0：**
- 描述：
- 链接：

**Week 1 总结：**
- 完成的任务：
- 未完成任务：
- 学到的关键概念：
- 下周方向选择：[Tech / Ops / Research]

**截图/链接：**
- 

**遇到的问题：**
- 

**修复过程：**
- 

---

## Week 1 打卡状态
- [ ] 完成所有学习任务
- [ ] Build Log 记录完整
- [ ] Mini Demo 0 提交
- [ ] 选择 Week 2 主方向
