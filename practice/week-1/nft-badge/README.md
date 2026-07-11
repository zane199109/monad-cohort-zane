# NFT Badge — Week 1 Practice

**[English](#english) | [中文](#中文)**

A minimal ERC721-based badge system, generated with AI assistance and manually reviewed.

<a id="english"></a>

Task writeup (Prompt, AI draft, review checklist, modifications): see
[`tasks/general/week-1/ai-solidity-contract-review.md`](../../../tasks/general/week-1/ai-solidity-contract-review.md).

## Layout

```
nft-badge/
├── contracts/NFTBadge.sol   # the contract (final reviewed version)
├── frontend/                 # vanilla HTML + ethers.js v5
│   ├── index.html
│   ├── app.js
│   ├── mock-data.js
│   ├── output.css
│   └── ethers.umd.min.js
├── test/NFTBadge.t.sol       # 18 Foundry tests (all passing)
├── foundry.toml              # remaps @openzeppelin -> lib
└── README.md
```

## Contract overview

- ERC721URIStorage + Ownable (OpenZeppelin v5)
- Owner creates badge types (`name` / `description` / `uri`)
- Owner authorizes minters (`setMinter`)
- Minters mint single badges (`mint`) — uses `_safeMint`, validates type exists
- `mintBatch(to, typeId, amount)` — batch mint same type to one recipient
- `airdrop(typeId, recipients[])` — one-to-many distribution
- `createBadgeTypes(names[], descs[], uris[])` — batch create badge types
- `hasBadge(addr, typeId)` — O(1) via `badgeCount` mapping
- `tokensOfOwner(addr)` — returns all tokenIds owned by an address
- `getBadgeType(typeId)` — returns name, description, uri
- Events: `BadgeTypeCreated`, `BadgeTypesCreated`, `BadgeMinted`, `MinterUpdated`
- Custom errors for gas efficiency

## Build & test

```bash
cd practice/week-1/nft-badge
forge build
forge test -vv
```

Verified with Foundry nightly + Solc 0.8.35 + OpenZeppelin v5.6.1.

## Deploy to Monad Testnet

Full deploy + interaction walkthrough: see
[`tasks/general/week-1/monad-testnet-deploy.md`](../../../tasks/general/week-1/monad-testnet-deploy.md).

**Deployed contract (2026-07-09):**
- Address: `0xA4A736984104c206f9de526C4c782e9029DF5641`
- Explorer: https://testnet.monadexplorer.com/address/0xA4A736984104c206f9de526C4c782e9029DF5641
- Deploy tx: `0x3afd30bcd9924dec81ba5e81cbe1c11e57cc3e7014826a00f8d17891d5096822`
- Block: `43251317`, gas used: `3889936` (~0.408 MON)

Quick deploy command:

```bash
cp .env.example .env           # fill in PRIVATE_KEY + MONAD_RPC_URL
bash deploy.sh                 # auto sources .env, deploys + interacts + prints summary
```

Monad Testnet: Chain ID `10143` (0x279f), RPC `https://testnet-rpc.monad.xyz/`.

## Interact (read / write examples)

Using `cast` against the deployed contract above:

```bash
CONTRACT=0xA4A736984104c206f9de526C4c782e9029DF5641
RPC=https://testnet-rpc.monad.xyz/

# --- read (no gas, no tx) ---
cast call $CONTRACT "name()(string)" --rpc-url $RPC
# -> "CourseBadge"
cast call $CONTRACT "owner()(address)" --rpc-url $RPC
# -> 0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C
cast call $CONTRACT "hasBadge(address,uint256)(bool)" \
  0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C 0 --rpc-url $RPC
# -> true

# --- write (on-chain, costs gas) ---
cast send $CONTRACT "createBadgeType(string,string,string)(uint256)" \
  "Week1" "finish week1" "ipfs://QmWeek1Badge" \
  --rpc-url $RPC --private-key $PRIVATE_KEY

cast send $CONTRACT "mint(address,uint256)(uint256)" \
  <your_addr> 0 \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# Batch create badge types
cast send $CONTRACT "createBadgeTypes(string[],string[],string[])(uint256[])" \
  '[\"BadgeA\",\"BadgeB\"]' '[\"Desc A\",\"Desc B\"]' '[\"ipfs://QmA\",\"ipfs://QmB\"]' \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# Mint batch (same type, same recipient)
cast send $CONTRACT "mintBatch(address,uint256,uint256)" \
  <your_addr> 0 3 \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# Airdrop (one type, multiple recipients)
cast send $CONTRACT "airdrop(uint256,address[])" \
  0 '[<addr1>,<addr2>,<addr3>]' \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# Query tokens owned by address
cast call $CONTRACT "tokensOfOwner(address)(uint256[])" <your_addr> --rpc-url $RPC

# Query badge type details
cast call $CONTRACT "getBadgeType(uint256)(string,string,string)" 0 --rpc-url $RPC
```

## Frontend (DApp)

The frontend is a static page; serve it and connect a wallet:

```bash
cd frontend
npx serve -p 8080
# or: python3 -m http.server 8080
# or: VS Code Live Server extension (right-click index.html → Open with Live Server)
```

Browser: open `http://localhost:8080`

### Prerequisites

1. Install MetaMask browser extension (Chrome/Edge/Firefox)
2. Add Monad Testnet to MetaMask:
   - Chain ID: `10143` (0x279f)
   - RPC URL: `https://testnet-rpc.monad.xyz/`
   - Symbol: `MONAD`
   - Block Explorer: `https://testnet.monadexplorer.com/`
3. Ensure wallet has test MON (claim from Monad faucet)

### Usage Steps

1. Click **Connect Wallet** (top-right)
   - MetaMask popup for authorization
   - After connect: button shows address, network indicator turns green, Activity Log panel opens
2. Contract auto-binds to `0x56c26B...73CC` on connect
   - Manual bind: `bindContract("0xA4A736984104c206f9de526C4c782e9029DF5641")` in browser console
3. **Badge Wall** — 12 badge cards displayed
   - Unlocked: shows icon; Locked: lock icon + grayscale
   - Each card shows name, description, rarity tag, series tag, status
4. **Filters** — Series (All/Cohort/Hackathon/Open Source/DevRel), Status (All/Unlocked/Locked), Search box
5. **Mint a Badge** — click a locked card → detail page → click **Mint this Badge**
   - MetaMask confirms transaction → on-chain success → badge unlocks → Activity Log records tx hash (clickable link to Monad Explorer)
6. **Activity Log** — right-side panel, time-ordered entries:
   - Connection status, network switch, tx send/confirm, errors (red)
   - Clear with "Clear log" button

### Frontend ABI Coverage

The frontend ABI includes all contract methods:
- Read: `name`, `symbol`, `owner`, `nextBadgeTypeId`, `nextTokenId`, `hasBadge`, `balanceOf`, `tokenBadgeType`, `badgeCount`, `tokensOfOwner`, `getBadgeType`
- Write: `mint`, `mintBatch`, `airdrop`, `createBadgeType`, `createBadgeTypes`, `setMinter`
- Events: `BadgeTypeCreated`, `BadgeMinted`

### Browser Console Quick Tests

```javascript
// All examples assume state.signer and state.contract are initialized after wallet connect

// Single badge type creation
state.contract.createBadgeType("TestBadge", "test description", "ipfs://QmTest");

// Batch badge type creation
state.contract.createBadgeTypes(["BadgeA","BadgeB"], ["Desc A","Desc B"], ["ipfs://QmA","ipfs://QmB"]);

// Batch mint (same type, same recipient)
state.contract.mintBatch(state.account, 0, 3);

// Airdrop (one type, multiple recipients)
state.contract.airdrop(0, ["0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C", "0xA100000000000000000000000000000000000001"]);

// Query tokens owned by address
state.contract.tokensOfOwner(state.account).then(ids => console.log(ids));

// Query badge type details
state.contract.getBadgeType(0).then(info => console.log(info));
```

## Troubleshooting

**Q: MetaMask doesn't pop up for transaction confirmation?**
- Check you're on Monad Testnet
- Check wallet has sufficient test MON

**Q: Page shows "not connected"?**
- Confirm MetaMask extension is enabled
- Refresh the page

**Q: Transaction fails?**
- Check Activity Log for error messages
- Verify caller has minter permission (owner must call `setMinter` first)

**Q: Badge doesn't unlock after minting?**
- Wait for confirmation (Monad Testnet ~1-2 seconds)
- Refresh page to re-query `hasBadge` status

---

<a id="中文"></a>

# NFT Badge — Week 1 实践（中文版）

一个基于 ERC721 的最小徽章系统，由 AI 辅助生成并经过人工审查。

任务文档（Prompt、AI 初稿、检查清单、修改记录）见
[`tasks/general/week-1/ai-solidity-contract-review.md`](../../../tasks/general/week-1/ai-solidity-contract-review.md)。

## 目录结构

```
nft-badge/
├── contracts/NFTBadge.sol   # 合约（审查后定稿）
├── frontend/                 # 原生 HTML + ethers.js v5
│   ├── index.html
│   ├── app.js
│   ├── mock-data.js
│   ├── output.css
│   └── ethers.umd.min.js
├── test/NFTBadge.t.sol       # 18 个 Foundry 测试（全部通过）
├── foundry.toml              # remaps @openzeppelin -> lib
└── README.md
```

## 合约概览

- 继承 ERC721URIStorage + Ownable（OpenZeppelin v5）
- Owner 创建徽章类型（`name` / `description` / `uri`）
- Owner 授权铸造者（`setMinter`）
- 铸造者铸造单个徽章（`mint`）—— 使用 `_safeMint`，校验类型是否存在
- `mintBatch(to, typeId, amount)` — 批量铸造同类型给同一接收者
- `airdrop(typeId, recipients[])` — 一对多分发
- `createBadgeTypes(names[], descs[], uris[])` — 批量创建徽章类型
- `hasBadge(addr, typeId)` —— 通过 `badgeCount` 映射实现 O(1) 查询
- `tokensOfOwner(addr)` — 返回地址拥有的所有 tokenId
- `getBadgeType(typeId)` — 返回 name, description, uri
- 事件：`BadgeTypeCreated`、`BadgeTypesCreated`、`BadgeMinted`、`MinterUpdated`
- 使用 custom error 节省 gas

## 编译与测试

```bash
cd practice/week-1/nft-badge
forge build
forge test -vv
```

已验证环境：Foundry nightly + Solc 0.8.35 + OpenZeppelin v5.6.1。

## 部署到 Monad 测试网

完整部署 + 交互记录见
[`tasks/general/week-1/monad-testnet-deploy.md`](../../../tasks/general/week-1/monad-testnet-deploy.md)。

**已部署合约（2026-07-09）：**
- 地址：`0xA4A736984104c206f9de526C4c782e9029DF5641`
- 浏览器：https://testnet.monadexplorer.com/address/0xA4A736984104c206f9de526C4c782e9029DF5641
- 部署 tx：`0x3afd30bcd9924dec81ba5e81cbe1c11e57cc3e7014826a00f8d17891d5096822`
- 区块：`43251317`，gas 消耗：`3889936`（约 0.408 MON）

简版部署命令：

```bash
cp .env.example .env           # 填入 PRIVATE_KEY 和 MONAD_RPC_URL
bash deploy.sh                 # 自动 source .env、部署 + 交互 + 打印 summary
```

Monad 测试网：Chain ID `10143` (0x279f)，RPC `https://testnet-rpc.monad.xyz/`。

## 交互示例（read / write）

用 `cast` 调用上面已部署的合约：

```bash
CONTRACT=0xA4A736984104c206f9de526C4c782e9029DF5641
RPC=https://testnet-rpc.monad.xyz/

# --- read（不上链，不花 gas）---
cast call $CONTRACT "name()(string)" --rpc-url $RPC
# -> "CourseBadge"
cast call $CONTRACT "owner()(address)" --rpc-url $RPC
# -> 0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C
cast call $CONTRACT "hasBadge(address,uint256)(bool)" \
  0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C 0 --rpc-url $RPC
# -> true

# --- write（上链，花 gas）---
cast send $CONTRACT "createBadgeType(string,string,string)(uint256)" \
  "Week1" "finish week1" "ipfs://QmWeek1Badge" \
  --rpc-url $RPC --private-key $PRIVATE_KEY

cast send $CONTRACT "mint(address,uint256)(uint256)" \
  <你的地址> 0 \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# 批量创建徽章类型
cast send $CONTRACT "createBadgeTypes(string[],string[],string[])(uint256[])" \
  '[\"BadgeA\",\"BadgeB\"]' '[\"Desc A\",\"Desc B\"]' '[\"ipfs://QmA\",\"ipfs://QmB\"]' \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# 批量铸造（同类型，同一接收者）
cast send $CONTRACT "mintBatch(address,uint256,uint256)" \
  <你的地址> 0 3 \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# 空投（一种类型，多个接收者）
cast send $CONTRACT "airdrop(uint256,address[])" \
  0 '[<addr1>,<addr2>,<addr3>]' \
  --rpc-url $RPC --private-key $PRIVATE_KEY

# 查询地址拥有的代币
cast call $CONTRACT "tokensOfOwner(address)(uint256[])" <你的地址> --rpc-url $RPC

# 查询徽章类型详情
cast call $CONTRACT "getBadgeType(uint256)(string,string,string)" 0 --rpc-url $RPC
```

## 前端（DApp）

前端是静态页面，启动后连接钱包即可使用：

```bash
cd frontend
npx serve -p 8080
# 或：python3 -m http.server 8080
# 或：VS Code Live Server 插件（右键 index.html → Open with Live Server）
```

浏览器打开 `http://localhost:8080`

### 前置准备

1. 安装 MetaMask 浏览器插件（Chrome/Edge/Firefox）
2. 在 MetaMask 中添加 Monad 测试网：
   - Chain ID: `10143` (0x279f)
   - RPC URL: `https://testnet-rpc.monad.xyz/`
   - Symbol: `MONAD`
   - Block Explorer: `https://testnet.monadexplorer.com/`
3. 确保钱包有足够的测试 MON（从 Monad 水龙头领取）

### 使用步骤

1. 点击右上角 **Connect Wallet**
   - MetaMask 弹出授权请求，点击确认
   - 连接成功后：按钮显示地址缩写，网络指示器变绿，右侧 Activity Log 面板自动展开
2. 合约自动绑定到 `0x56c26B...73CC`
   - 手动绑定：浏览器控制台执行 `bindContract("0xA4A736984104c206f9de526C4c782e9029DF5641")`
3. **徽章墙** — 首页展示 12 个徽章卡片
   - 已解锁：显示图标；未解锁：锁图标 + 灰化
   - 每张卡片显示名称、描述、稀有度标签、系列标签、状态
4. **筛选** — Series（All/Cohort/Hackathon/Open Source/DevRel）、Status（All/Unlocked/Locked）、搜索框
5. **铸造徽章** — 点击未解锁的卡片 → 详情页 → 点击 **Mint this Badge**
   - MetaMask 确认交易 → 上链成功 → 徽章解锁 → Activity Log 记录 tx hash（可点击跳转 Monad Explorer）
6. **活动日志** — 右侧面板，按时间顺序记录：
   - 连接状态、网络切换、交易发送/确认、错误信息（红色）
   - 支持 "Clear log" 清空

### 前端 ABI 覆盖

前端 ABI 包含所有合约方法：
- 读取：`name`, `symbol`, `owner`, `nextBadgeTypeId`, `nextTokenId`, `hasBadge`, `balanceOf`, `tokenBadgeType`, `badgeCount`, `tokensOfOwner`, `getBadgeType`
- 写入：`mint`, `mintBatch`, `airdrop`, `createBadgeType`, `createBadgeTypes`, `setMinter`
- 事件：`BadgeTypeCreated`, `BadgeMinted`

### 浏览器控制台快速测试

```javascript
// 以下示例假设连接钱包后 state.signer 和 state.contract 已初始化

// 创建单个徽章类型
state.contract.createBadgeType("TestBadge", "test description", "ipfs://QmTest");

// 批量创建徽章类型
state.contract.createBadgeTypes(["BadgeA","BadgeB"], ["Desc A","Desc B"], ["ipfs://QmA","ipfs://QmB"]);

// 批量铸造（同类型，同一接收者）
state.contract.mintBatch(state.account, 0, 3);

// 空投（一种类型，多个接收者）
state.contract.airdrop(0, ["0x8EB3Fe3dDe56Cab0CDf32db3e6E5bA865596BE2C", "0xA100000000000000000000000000000000000001"]);

// 查询地址拥有的代币
state.contract.tokensOfOwner(state.account).then(ids => console.log(ids));

// 查询徽章类型详情
state.contract.getBadgeType(0).then(info => console.log(info));
```

## 常见问题

**Q: MetaMask 没有弹出交易确认？**
- 检查是否已连接到 Monad 测试网
- 检查钱包是否有足够的测试 MON

**Q: 页面显示 "not connected"？**
- 确认 MetaMask 插件已启用
- 刷新页面重试

**Q: 交易失败？**
- 查看 Activity Log 中的错误信息
- 确认调用方有 minter 权限（需要 owner 调用 `setMinter` 授权）

**Q: 徽章没有变为解锁状态？**
- 等待交易确认（Monad 测试网通常 1-2 秒）
- 刷新页面重新查询 `hasBadge` 状态
