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
│   └── style.css
├── test/NFTBadge.t.sol       # 5 Foundry tests (all passing)
├── foundry.toml              # remaps @openzeppelin -> lib
└── README.md
```

## Contract overview

- ERC721URIStorage + Ownable (OpenZeppelin v5)
- Owner creates badge types (name / description / uri)
- Owner authorizes minters (`setMinter`)
- Minters mint badges (`mint`) — uses `_safeMint`, validates type exists
- `hasBadge(addr, typeId)` — O(1) via `badgeCount` mapping
- Events: `BadgeTypeCreated`, `BadgeMinted`, `MinterUpdated`
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
[`tasks/general/week-1/monad-testnet-deploy.md`](../../../tasks/general/week-1/monad-testnet-deploy.md)
(step-by-step guide: [`deploy-guide.md`](../../../tasks/general/week-1/deploy-guide.md)).

**Deployed contract (2026-07-09):**
- Address: `0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC`
- Explorer: https://testnet.monadexplorer.com/address/0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC
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
CONTRACT=0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC
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
```

## Run the frontend

The frontend is a static page; just open it (or serve it) and point it at a
deployed contract address:

```bash
cd frontend
python3 -m http.server 8080
# open http://localhost:8080
```

Usage:
1. Click **Connect MetaMask** (use the Monad Testnet wallet)
2. Paste the deployed `NFTBadge` address
3. Owner: create badge types, set minters
4. Minter: mint badges
5. Query: check whether an address holds a badge of a given type

> The frontend uses ethers.js v5 via CDN and contains only the ABI surface
> needed by this demo.

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
│   └── style.css
├── test/NFTBadge.t.sol       # 5 个 Foundry 测试（全部通过）
├── foundry.toml              # remaps @openzeppelin -> lib
└── README.md
```

## 合约概览

- 继承 ERC721URIStorage + Ownable（OpenZeppelin v5）
- Owner 创建徽章类型（name / description / uri）
- Owner 授权铸造者（`setMinter`）
- 授权者铸造徽章（`mint`）—— 使用 `_safeMint`，并校验类型是否存在
- `hasBadge(addr, typeId)` —— 通过 `badgeCount` 映射实现 O(1) 查询
- 事件：`BadgeTypeCreated`、`BadgeMinted`、`MinterUpdated`
- 使用 custom error 以节省 gas

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
- 地址：`0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC`
- 浏览器：https://testnet.monadexplorer.com/address/0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC
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
CONTRACT=0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC
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
```

## 运行前端

前端是静态页面，直接打开（或用本地服务器）并填入已部署的合约地址即可：

```bash
cd frontend
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

使用步骤：
1. 点击 **Connect MetaMask**（使用 Monad Testnet 钱包）
2. 粘贴已部署的 `NFTBadge` 合约地址
3. Owner：创建徽章类型、设置 minter
4. Minter：铸造徽章
5. 查询：检查某地址是否持有某类徽章

> 前端通过 CDN 引入 ethers.js v5，仅包含本 demo 所需的 ABI 接口。
