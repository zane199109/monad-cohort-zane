# Week 1 — AI 辅助 Solidity 合约：NFT Badge

**轨道：** general  
**对应任务：** AI + Solidity + 合约部署  
**日期：** 2026-07-09  
**目标：** 练习用 AI 辅助生成合约初稿、理解代码，并由我完成最终判断

---

## 0. 任务说明

本任务的重点不是让 AI 替我完成开发，而是练习：写 Prompt → 读 AI 输出 → 让 AI 解释 → 人工检查 → 记录修改/判断。

最终产物：
- 合约 + 前端代码：[`practice/week-1/nft-badge/`](../../../practice/week-1/nft-badge/)
- 本文：Prompt、AI 初稿、AI 解释、人工检查记录、修改判断

---

## 1. 给 AI 的 Prompt

> 请用 Solidity 编写一个 NFT Badge（徽章）智能合约。要求：
> - 符合 ERC721 标准（使用 OpenZeppelin 库）
> - Owner 可以定义徽章类型，每个类型包含 name、description、tokenURI 三个字段
> - 被授权的 minter 可以向任意地址铸造指定类型的徽章
> - 任何人都可以查询某个地址是否持有某类徽章
> - 在创建徽章类型和铸造时都要发出 event
> - Solidity 版本 ^0.8.20
> - 保持简洁、安全，不要过度设计    

**设计意图（Prompt 背后的取舍）：**
- 明确要求用 OpenZeppelin，避免 AI 从零实现 ERC721（标准库更安全，符合"能用标准库就用标准库"的原则）
- 明确"保持简洁、安全，不要过度设计"，抑制 AI 顺手加白名单、销毁、可升级代理等超出需求的特性
- 需求点刻意列得最小：只覆盖 创建类型 / 铸造 / 查询 三个核心能力

---

## 2. AI 输出的初稿（关键片段）

AI 给出的初稿大致结构如下（保留问题点，便于对照后文的修改）：

```solidity
contract NFTBadge is ERC721URIStorage, Ownable {
    struct BadgeType { string name; string description; string uri; }
    mapping(uint256 => BadgeType) public badgeTypes;
    mapping(address => bool) public minters;
    uint256 public nextTokenId;
    uint256 public nextBadgeTypeId;

    function mint(address to, uint256 typeId) external returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);                          // [问题 1] 用了 _mint
        _setTokenURI(tokenId, badgeTypes[typeId].uri);
        emit BadgeMinted(tokenId, typeId, to);
        return tokenId;
    }

    function hasBadge(address account, uint256 typeId) external view returns (bool) {
        uint256 bal = balanceOf(account);
        for (uint256 i = 0; i < bal; i++) {          // [问题 2] 试图枚举，但没有 tokenId→typeId 映射
            // 无法判断某 token 属于哪个 type → 逻辑不通
        }
        return false;
    }
}
```

完整可运行版本见 [`practice/week-1/nft-badge/contracts/NFTBadge.sol`](../../../practice/week-1/nft-badge/contracts/NFTBadge.sol)（已合并我的修改）。

---

## 3. AI 对合约结构的解释

我让 AI 解释它生成的合约结构，它给出的说明（我做了精简和事实核对）：

| 组成 | 作用 |
|------|------|
| `ERC721URIStorage` | 继承 OpenZeppelin，提供标准 ERC721 + 每 token 独立 URI 存储 |
| `Ownable` | 提供 `onlyOwner` 权限控制，owner 即部署者 |
| `BadgeType` 结构体 | 徽章类型的模板：name / description / uri / exists（exists 用于标记是否有效，便于 mint 时校验类型是否存在）|
| `badgeTypes` | typeId → BadgeType 的映射 |
| `minters` | 地址 → 是否为授权铸造者的映射 |
| `tokenBadgeType` | tokenId → typeId，使查询"某 token 属于哪类"为 O(1) |
| `badgeCount` | owner → typeId → 持有数量，使 `hasBadge` 为 O(1)，避免枚举 |
| `nextTokenId` / `nextBadgeTypeId` | 自增计数器，分配唯一 id |
| 3 个事件 | `BadgeTypeCreated` / `BadgeMinted` / `MinterUpdated`，便于链下索引 |
| 3 个 custom error | `BadgeTypeNotFound` / `NotAuthorizedMinter` / `EmptyName`，比 require 字符串更省 gas |
| `onlyMinter` modifier | 校验调用者为授权 minter 或 owner |
| 核心函数 | `createBadgeType` / `setMinter` / `mint` / `hasBadge` / `getBadgeType` |

**核心数据流：** owner 先 `createBadgeType` 注册类型 → owner `setMinter` 授权铸造者 → minter `mint` 给任意地址 → 任何人 `hasBadge` 查询。

---

## 4. 人工检查（共 6 个检查点，实际证据）

### ✅ 检查点 1：合约是否能编译

用 Foundry 实际编译（Solc 0.8.35，OpenZeppelin v5.6.1）：

```
$ forge build
Compiling 21 files with Solc 0.8.35
Solc 0.8.35 finished in 819.90ms
Compiler run successful!
```
**结论：** 编译通过，无 warning。

### ✅ 检查点 2：函数是否符合预期

写了 5 个 Foundry 单测覆盖核心路径与失败路径（见 [`practice/week-1/nft-badge/test/NFTBadge.t.sol`](../../../practice/week-1/nft-badge/test/NFTBadge.t.sol)）：

```
$ forge test -vv
[PASS] test_CreateBadgeType()
[PASS] test_MintAndHasBadge()
[PASS] testRevert_MintUnknownType()       // 铸造不存在的类型 → revert
[PASS] testRevert_UnauthorizedMint()      // 非 minter 铸造 → revert
[PASS] testRevert_NonOwnerCreateType()    // 非 owner 建类型 → revert
Suite result: ok. 5 passed; 0 failed; 0 skipped
```
**结论：** 正常路径与权限拒绝路径都按预期工作。

### ✅ 检查点 3：是否存在明显权限问题

| 函数 | 权限 | 评价 |
|------|------|------|
| `createBadgeType` | `onlyOwner` | ✅ 只有 owner 能定义新类型 |
| `setMinter` | `onlyOwner` | ✅ 只有 owner 能授权/撤销 minter |
| `mint` | `onlyMinter`（minter 或 owner）| ✅ 受控 |
| `hasBadge` / `getBadgeType` | 无限制 | ✅ 只读查询，公开合理 |

**无越权风险。** owner 同时具备 mint 能力是设计选择（避免 owner 也要被授权才能发的尴尬），可接受。

### ✅ 检查点 4：潜在安全风险

- **使用 `_safeMint` 而非 `_mint`**：防止铸造给不实现 `onERC721Received` 的合约导致代币永久卡死 ✅
- **mint 中无外部调用、无 ETH 收付**：不存在重入面 ✅
- **输入校验**：`createBadgeType` 校验空 name（`EmptyName`）；`mint` 校验类型存在（`BadgeTypeNotFound`）✅
- **URI 由 owner 在建类型时一次性写入**：minter 不能篡改单个 token 的 URI ✅
- **无 `ownerOf` / 转账前置校验缺失**：继承 OZ 标准 ERC721，转账逻辑可信 ✅

### ✅ 检查点 5：是否使用了不必要的复杂逻辑

- `hasBadge` 用 `badgeCount` 映射做 O(1) 查询，而非遍历持有 token —— 简洁且高效 ✅
- 没有引入 ERC721Enumerable（会增 gas 且本场景不需要遍历） ✅
- 没有引入可升级代理、白名单、时间锁等超出需求的能力 ✅

### ✅ 检查点 6：变量和函数命名是否易理解

`createBadgeType` / `setMinter` / `mint` / `hasBadge` / `getBadgeType` / `tokenBadgeType` / `badgeCount` —— 语义直白，无歧义 ✅

---

## 5. 我对 AI 输出做了哪些修改或判断

| # | AI 初稿的问题 | 我的修改 / 判断 | 原因 |
|---|--------------|----------------|------|
| 1 | `mint` 用 `_mint(to, tokenId)` | 改为 `_safeMint(to, tokenId)` | `_mint` 不检查接收方是否为合约、是否实现 `onERC721Received`，铸造给合约会导致代币永久无法取出。**安全相关，必须改。** |
| 2 | `hasBadge` 试图用 `balanceOf` + 循环枚举判断持有，但没有 tokenId→typeId 映射，逻辑根本跑不通 | 新增 `tokenBadgeType`（tokenId→typeId）和 `badgeCount`（owner→typeId→count）两个映射，`hasBadge` 改为 O(1) 查 `badgeCount` | AI 这段是"看起来对、实际无法实现"的典型。我不接受跑不通的代码，且用映射比遍历更省 gas。 |
| 3 | `mint` 没校验 `typeId` 是否存在 | 增加 `if (!bt.exists) revert BadgeTypeNotFound(typeId)` | 防止铸造出不存在的"幽灵类型"徽章。 |
| 4 | `createBadgeType` 没校验 name 非空 | 增加 `if (bytes(name).length == 0) revert EmptyName()` | 避免出现无意义的空名徽章类型。 |
| 5 | 用 `require("...")` 字符串报错 | 改为 custom error（`BadgeTypeNotFound` / `NotAuthorizedMinter` / `EmptyName`） | custom error 比 require 字符串省 gas，且更结构化。 |
| 6 | 测试初稿用 `vm.expectRevert("Ownable: caller is not the owner")` | OZ v5 已改用 custom error `OwnableUnauthorizedAccount(address)`；且 foundry 对带参数的 custom error 需用 `abi.encodeWithSelector` 完整匹配，仅传 selector 匹配不到 | **这是初版测试 3 个全挂的真实原因**，修后 5 个测试全过。 |

**没有采纳的"改进"（刻意拒绝，避免过度设计）：**
- 不加 `burn`（销毁）：当前需求是发徽章，不是回收徽章
- 不加 `batchMint`：单次 mint 已满足 demo
- 不加可升级代理：增加复杂度，Week 1 demo 不需要
- 不加白名单/领取价格：无资金逻辑，不引入

---

## 6. 反思：AI 辅助的边界

1. **AI 能快速给出结构骨架**，但具体安全细节（`_safeMint` vs `_mint`）和"能不能跑通"的逻辑（`hasBadge` 的映射缺失）必须人工把关。
2. **AI 不一定知道依赖库的版本差异**。这次最隐蔽的坑是 OpenZeppelin v5 把 `Ownable` 的报错从字符串改成了 custom error，导致照搬旧写法的测试全挂——只有实际跑测试才暴露。
3. **"keep it simple" 也是要人来守的底线**。AI 容易顺手加一堆没要求的特性，得明确拒绝。
4. **真正可信的检查点是跑出来的**：编译通过、测试通过，比"看着像对的"有说服力得多。

---

## 7. 产物索引

| 产物 | 路径 |
|------|------|
| 合约（定稿） | [`practice/week-1/nft-badge/contracts/NFTBadge.sol`](../../../practice/week-1/nft-badge/contracts/NFTBadge.sol) |
| 前端 | [`practice/week-1/nft-badge/frontend/`](../../../practice/week-1/nft-badge/frontend/)（`index.html` / `app.js` / `mock-data.js`）|
| 测试 | [`practice/week-1/nft-badge/test/NFTBadge.t.sol`](../../../practice/week-1/nft-badge/test/NFTBadge.t.sol) |
| Foundry 工程 | [`practice/week-1/nft-badge/foundry.toml`](../../../practice/week-1/nft-badge/foundry.toml) |
| 实践说明 | [`practice/week-1/nft-badge/README.md`](../../../practice/week-1/nft-badge/README.md) |

> 部署到 Monad Testnet 的完整记录见下一个任务文档：[`monad-testnet-deploy.md`](./monad-testnet-deploy.md)
