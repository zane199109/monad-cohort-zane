# Product Research Question Card: Uniswap v4 适配器架构 — 与其他 DEX 对比

## 研究主题

**为什么 Uniswap v4 的 swap 不能直接发给 PoolManager？Moss 适配器应该用 Universal Router + Permit2 还是其他模式？**

核心矛盾：其他 DEX（Uniswap v2/v3、PancakeSwap v3）的适配器直接把 swap 交易发到 Pool 合约，用户 EOA 签名即可。但 Uniswap v4 的 `PoolManager.unlock(bytes)` 要求 `msg.sender` 实现 `IUnlockCallback` —— EOA 没有合约代码，直接调用必然 revert。

## 研究对象

- **主要产品：** Uniswap v4（PoolManager、Universal Router、Permit2）
- **对比产品：** Uniswap v3（NonfungiblePositionManager、SwapRouter）、PancakeSwap v3（Smart Router）
- **所属分类：** DEX / AMM
- **适配器视角：** Moss Protocol 的 Capability/Query/Receipt 三件套如何适配上述协议

## 我想回答的问题

### 架构层

1. **Uniswap v4 的 unlock/callback 模式为什么存在？** 是为了 Flash Accounting（内部净额结算）做的强制要求，还是其他原因？如果 Flash Accounting 要求 Taker 是一个合约，那普通 EOA 用户怎么进行 v4 swap？
2. **Universal Router 在 v4 中扮演什么角色？** 它如何封装 unlock/callback？它和 v3 的 SwapRouter 有什么本质区别？
3. **Permit2 和 v4 的审批流程怎么搭？** 为什么不能直接把 ERC-20 approve 给 PoolManager？Permit2 的 batch approval + signature 模式和传统 approve 有什么不同？

### 对比层

4. **Uniswap v3 的适配器为什么能直接发交易给 SwapRouter？** v3 的 SwapRouter 是 EOA 可以直接调用的吗？Pool 合约结构（每对独立合约 vs Singleton）对此有何影响？
5. **PancakeSwap v3 Smart Router 怎么处理的？** 它在 Monad 上的部署地址是 `0x21114915ac6d5a2e156931e20b20b038ded0be7c`，它的接口模式和 Uniswap v4 有什么异同？
6. **如果有 v2 适配器，它是怎么发 swap 交易的？** Uniswap v2 的 `swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data)` 是直接 Pool 调用——和 v4 的 unlock 有什么本质不同？

### Moss 适配器层

7. **Moss 的适配器三件套（Capability / Query / Receipt）如何适配 v4 的 unlock 模式？** 如果 Capability 构建的 transaction target 不能是 PoolManager，应该是什么地址？Universal Router？
8. **Receipt 解析的关键点？** v4 的 swap 完成会 emit 什么事件？PoolManager 的 `Swap` 事件和 v3 的 `Swap` 事件字段有什么不同（如 `sqrtPriceX96`、`liquidity`、`tick`）？
9. **Quote（报价）路径是什么？** v4 使用 `V4Quoter` 还是 `QuoterV2`？返回格式是什么？和 v3 的 `QuoterV2` 有什么异同？

## 为什么这个问题重要

### 对 Moss Issue #5（Uniswap v4 适配器）的意义

一条代码审查指出：之前提交的 v4 适配器 **"can never succeed on-chain"**，原因是直接发交易到 `PoolManager.unlock()`，而 EOA 无法实现 `IUnlockCallback`。这不是一个小 bug，是整个架构方向错误——等价于"重建而不是修订"。

理解 v4 的 unlock/callback 模式、Universal Router 的封装方式、Permit2 的审批流程，是写出正确适配器的前提。

### 对 Monad 生态开发的借鉴

Monad 上已经有 Uniswap v4 和 PancakeSwap v3。两者 swap 流程完全不同。如果未来还需要支持更多 DEX（如 Camelot、Maverick），理解"v4 为什么不同"能帮助我们建立一套通用的 DEX 适配器架构模式。

### 对 AMM 架构理解的深化

v4 的 unlock/callback 不是一个随意的设计——它是 Flash Accounting 的自然结果。理解这个"为什么"，比记住"不能直接调 PoolManager"更重要。

## 资料边界

### 本次会看

- Uniswap v4-core 源码（PoolManager.unlock、IUnlockCallback、Pool.sol 的 swap 逻辑）
- Uniswap Universal Router 源码（V4_SWAP command 的编码方式）
- Permit2 合约源码（batch approval、signature transfer）
- Uniswap v3 SwapRouter 源码（对比架构差异）
- PancakeSwap V3 Smart Router ABI（Monad 部署地址已验证）

### 本次不看

- 不覆盖 LP 逻辑（Mint/Burn/RemoveLiquidity）—— 只聚焦 swap 交易路径
- 不分析 Tick 数学和价格计算（那是 Quoter 层的职责，不是 Capability 层的）
- 不深入 Hooks 开发（除非某个 Hook 影响了 swap 执行流程）
- 不讨论跨链部署和多链适配

## 至少 5 个来源

1. **Uniswap v4-core (GitHub) — PoolManager.sol / IUnlockCallback.sol**
   https://github.com/Uniswap/v4-core/blob/main/src/PoolManager.sol
   _核心：理解 unlock/callback 模式的实现、Flash Accounting 的内部记账_

2. **Uniswap Universal Router (GitHub) — V4_SWAP command**
   https://github.com/Uniswap/universal-router/blob/main/contracts/modules/uniswap/v4/V4Swap.sol
   _核心：理解 Universal Router 如何封装 unlock/callback 为 EOA 可调用的交易_

3. **Permit2 合约 (GitHub) — Permit2.sol**
   https://github.com/Uniswap/permit2/blob/main/src/Permit2.sol
   _核心：理解 batch approval、signature-based transfer、和 v4 搭配的审批流程_

4. **Uniswap v3 SwapRouter (GitHub) — SwapRouter.sol**
   https://github.com/Uniswap/v3-periphery/blob/main/contracts/SwapRouter.sol
   _核心：对比 v3 的直接调用模式和 v4 的 unlock 模式，理解"为什么 v3 适配器能那样写"_

5. **PancakeSwap V3 Smart Router — Monad 部署**
   `0x21114915ac6d5a2e156931e20b20b038ded0be7c`（已验证）
   https://monadscan.com/address/0x21114915ac6d5a2e156931e20b20b038ded0be7c
   _核心：对比 PancakeSwap v3（更传统的 swap 模式）和 Uniswap v4（unlock 模式）的交易路径差异_

6. **Moss 已合入的 DEX 适配器示例（如 Uniswap v3 adapter）**
   _核心：理解 Moss 的 Capability/Query/Receipt 模式在 DEX 场景下的实际写法_

7. **上次 PR review 的完整评论**
   _核心：理解之前的适配器为什么"architecturally impossible"，以及 reviewer 指出的正确方向（Universal Router + Permit2）_

## 初始假设

### 架构假设

1. **v4 的 unlock/callback 是 Flash Accounting 的必然结果：** 因为 v4 不在一笔 swap 中立即转移 token，而是先记账、最后结算净额。这个"最后结算"的动作必须在 `unlockCallback` 中触发。PoolManager 需要确保调用者能返回并处理结算。对于 EOA，没有合约代码来执行这个回调，所以必须通过 Universal Router 这样的合约来中介。

2. **Universal Router 是 EOA 进入 v4 的唯一入口：** v3 的 SwapRouter 是"方便用户的一站式路由器"；v4 的 Universal Router 是"必须经过的路由器"——不是因为路由，而是因为 EOA 自己没有 `unlockCallback` 实现。

3. **Permit2 解决的是"approve 谁"的问题：** 传统模式是 approve PoolManager 花你的 token。但 v4 的 unlock 流程中，PoolManager 不是直接 pull token 的那个——token 转移发生在 `unlockCallback` 内部。Permit2 允许用户先 approve Permit2 合约，然后在交易中通过 signature 授权具体金额，Universal Router 作为 callback 的 msg.sender 负责调用 Permit2 转移 token。

### Moss 适配器假设

4. **Capability 的 transaction target 应该是 Universal Router 而不是 PoolManager：** Capability 构建 `execute(commands, inputs)` 调用，其中 commands 里编码了 V4_SWAP command，inputs 里编码了 swap 参数和 Permit2 signature。

5. **ERC-20 approve 的 Capability 目标应该是 Permit2 而不是 PoolManager：** 需要先 approve Permit2，然后 Universal Router 在 unlockCallback 中通过 Permit2 转移 token。

6. **Quote 路径直接使用 V4Quoter：** V4Quoter 直接调用 PoolManager 的 quote 函数（只读），不需要 unlock。这和 v3 的 QuoterV2 模式类似，但返回格式不同。

7. **Receipt 需要监听 PoolManager 的 Swap 事件：** v4 的 `Swap` 事件在 PoolManager 中 emit，包含 `sqrtPriceX96`、`liquidity`、`tick` 字段，需要和之前其他 adapter 的 Receipt 结构对齐。

## 不确定点 / 需要进一步查证

1. **Universal Router 在 Monad 上是否已部署？地址是什么？** 如果 Monad 上没有 Universal Router，那 EOA 用户如何在 Monad 上做 v4 swap？是否有替代方案？
2. **Permit2 在 Monad 上是否已部署？** 如果 Permit2 未部署，是否可以用传统的 approve → swap 流程？或者 v4 在 Monad 上是否用了不同的审批模式？
3. **Moss 现有的 DEX adapter（如 v3 adapter）的 Capability 结构：** 它是如何构建 transaction 的？target/calldata 是什么模式？Receipt 解析了哪些事件？需要看实际的代码结构来对齐 v4 adapter 的写法。
4. **上次 PR 的模拟输出：** 之前 PR 的模拟输出（如果保存了）显示的是 zero Warnings 但实际上掉了 MOSS_SKIP_E2E=1。需要理解当时的 simulate 做了什么——是根本没有执行真正的 chain call，还是 simulate 本身无法捕获 callback 错误？
5. **v4 的 V4Quoter 在 Monad 上是否已部署？quote 函数调用是否需要处理 unlock？** 如果 quote 不需要 unlock（只读调用），那 Query 的实现可能可以直接复用 v3 的 pattern。
6. **Monad 上的 v4 PoolManager 的已验证地址是否正确？** 之前 README 表格中的地址少了一个 hex character，但 source constant 是对的。需要在 Monadscan 上交叉验证。
