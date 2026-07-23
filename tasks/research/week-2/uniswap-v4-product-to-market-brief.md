# Product-to-Market Brief: Uniswap v4

> 基于之前的研究（Reading Card + Research Question Card），形成自己的市场判断。

---

## 目标用户与真实需求

Uniswap v4 有三层用户，每层的真实需求不同：

| 用户层 | 真实需求 | 在 v4 之前用什么 |
|---|---|---|
| **散户 LP** | 提供流动性赚手续费，操作简单，别亏钱（无常损失可控） | v3 集中流动性太复杂，很多人退回 v2 或直接用 Balancer/Yield 协议 |
| **机构 / 做市商** | 高资本效率，可定制做市策略，gas 成本低 | 自建做市系统，或通过 Arrakis/Charm 等中间件在 v3 上跑策略 |
| **DeFi 开发者** | 快速搭建自定义 AMM，不从头审计一份完整的 swap 合约 | 要么 fork v3 改逻辑（风险高、维护重），要么用 Maverick/Curve 等专用方案 |

**散户 LP的真实需求最朴素：** "我想赚手续费，但不想每天盯盘调价格区间。" v3 的集中流动性虽然资本效率高，但对散户来说反而不是好东西——需要主动管理、频繁调整仓位、gas 成本高。很多人用了一个月 v3 就退回了 v2。

**开发者的真实需求被 v3 压制了：** v3 的池子逻辑完全固化，你想加一个动态费率？没门，fork 整份代码自己改。改完还要从头审计，部署新池子还要 gas。v4 的 Hooks 解决了这个。

---

## 产品相较替代方案的优势

### 对 LP 和交易者：vs v3

| 维度 | v3 | v4 | 差异 |
|---|---|---|---|
| 创建池子 Gas | ~350K | ~30K | 90% 降幅 |
| 跨池路由 Gas | 每跳付一次 token 转移 | 净额结算一次付清 | 省中间跳的 gas |
| ETH 交易 | 需要 wrap WETH | 原生支持 | 省一步 |
| 手续费等级 | 固定三档 | 可任意设定或动态 | v4 胜 |

这些优势是"实在的"——LP 和交易者不需要理解 Hooks 也能受益。实际上，**大多数 v4 的 TVL 增长可能来自这些基础的 gas/效率优化，而不是 Hooks。**

### 对开发者：vs 其他可编程 AMM

| 方案 | 可编程方式 | 复杂度 | 生态覆盖 |
|---|---|---|---|
| v4 Hooks | 插件化，8 个回调点 | 低（写一个 Hook 合约即可） | Uniswap 全网流动性 |
| Maverick v2 | 自有引擎 | 中 | Maverick 自身生态 |
| Curve v2 | 自有 AMM 公式 | 高 | Curve 稳定币交易 |
| Fork v3 改代码 | 完整 fork 审计 | 极高 | 孤岛，无共享流动性 |

v4 Hooks 的核心优势是 **"插件化 + 兼容 Uniswap 全网流动性"**。开发者不需要自己拉 LP，只需要写一个几百行的 Hook，然后就能共享 Uniswap 的所有路由和用户流量。

### 对比 PancakeSwap v3（Monad 上）

PancakeSwap v3 走的是 v3 的成熟路线——直接发交易到 Smart Router，EOA 友好，部署简单。但在 Monad 这个新链上，v4 的 Singleton 部署成本优势尤其明显：如果你要支持 50 个交易对，v4 只需要 1 次部署，v3 要 50 次。

---

## 产品成立的关键条件

Uniswap v4 能活到现在并达到 $8.55 亿 TVL，我认为关键条件有三个：

### 条件 1：以太坊 L1 的 Gas 成本终于降到了可用区间

v4 的 Singleton + Flash Accounting 的 gas 优势体现在两个层面：**池子创建省 90%**（350K→30K），**多跳 swap 省中间 token 转移**（每跳省 ~15-20K Gas）。在 2021 年 gas 高峰期（一笔 swap $50+），多跳省几万 Gas 不算什么。但到了 2025-2026 年，L1 gas 回落到合理区间（一笔 swap $1-5），池子创建省 90% 就变成了**实实在在的部署门槛降低**——做市商愿意在新链上多开池了。**v4 的 gas 优化的市场价值依赖于低 gas 环境**——如果 L1 gas 再次暴涨，省 90% 的绝对金额仍然太贵，用户会流向 L2。

### 条件 2：L2 和新兴 L1（如 Monad）的爆发提供了新的增量市场

v4 覆盖了 18 条链，其中 Base、Monad、Arbitrum 贡献了相当比例的 TVL。在新链上部署时，Singleton 的"一次部署，所有池子可用"优势比在以太坊主网上更明显——因为新链的流动性本就稀缺，gas 优化能吸引更多做市商。

### 条件 3：Hooks 找到了"够用"的场景，不需要爆发

v4 没有等到 Hooks 生态爆发才起来。它先靠 Singleton 和原生 ETH 拿下了 $8.55 亿 TVL，Hooks 是增值层。这意味着 v4 的**成立不依赖于 Hooks 的成功**——这是关键洞察。即使 Hooks 永远只有 10% 的采用率，v4 本身已经是一个更好的 v3。

---

## 一个增长机会

**机会：v4 Hooks 为"AI Agent 做市"提供了原生基础设施。**

传统做市需要人力盯盘、调整策略、管理多 chain 仓位。AI Agent 天然适合这个——它可以读链上数据、分析波动率、自动调用 v4 Hook 调整做市参数。

具体路径：一个 AI Agent 作为 Evaluator 监控 v4 池的波动率，波动率变化时通过 Hooks 自动调整手续费费率。或者 Agent 通过闪存记账实时计算 LP 头寸的健康度，主动触发 rebalance。

这与 ERC-8183/PrismSettle 的 Agent Commerce 叙事形成合力——v4 提供"可编程的流动性基础设施"，ERC-8183 提供"Agent 间的支付和声誉层"。两者组合可能催生第一代完全自动化、去中心化的做市 Agent。

当前还在早期，但一旦这个方向跑通，v4 将成为 AI × DeFi 的核心流动性层，而不仅仅是一个更好的 AMM。

---

## 反方观点 / 失败风险

### "v4 是一个没有灵魂的技术升级"

反方会说：v4 做了漂亮的架构重构（Singleton、Flash Accounting、Hooks），但它没有**改变 DEX 的商业模型**。

- 它仍然依赖 LP 提供流动性赚手续费——和 v1、v2、v3 一模一样
- Hooks 目前的主要用例是动态费率和限价单——这些在中心化交易所已经存在了十年，不是创新
- 真正"新"的东西（TWAMM、竞价 Hook、AI 集成）还在实验中，没有产生实质的 TVL 或收入
- 现有的 $8.55 亿 TVL 中，大部分来自标准池（无 Hook），这些池子的流动性可能只是从 v3 迁移过去的，而不是 v4 带来的新增流动性

最坏的情况：**Uniswap v4 用更短的时间、更低的成本复现了 v3 的功能，但没有创造新的市场。** 它成了一个更便宜的 v3，而不是一个真正的平台。如果未来出现一个真正原生创新的 DEX（比如完全基于 ZK 验证的 DEX，或者原生集成 AI 做市的 DEX），v4 的"可编程 AMM"叙事可能会被绕过。

---

## 我的最终判断

**Uniswap v4 是一个优秀的产品升级，但不是范式转移。它大概率能巩固 Uniswap 的 DEX 领先地位，但其 Hooks 平台化叙事可能需要比预期更长的时间才能兑现。**

理由：

1. **"好"的部分来得很快：** Singleton + Flash Accounting + 原生 ETH 是实质性的提升，能让所有 LP 和交易者受益。这些已经推动了 $8.55 亿 TVL。这部分是确定的。

2. **"伟大"的部分需要时间：** Hooks 的真正价值——可编程 AMM、AI Agent 集成、新型流动性策略——可能还需要 1-2 年才能看到实质性的应用落地。这不一定是失败，只是节奏比市场预期慢。

3. **最大的资产是流动性网络效应：** Uniswap 的 $31.7 亿全网 TVL 是任何竞争者短期内无法复制的。v4 的这个护城河比 Hooks 本身更重要。

4. **对 Monad x Moss 的启示：** v4 的适配器确实值得做——不是因为 Hooks 会立刻爆发，而是因为 v4 在 gas 优化的基础上已经是 Monad 上最具竞争力的 DEX。适配器不需要等到 v4 完美才写，现在就有 3,300 万美元的 TVL 在 Monad 的 v4 上可以交易。

**一句话：** Uniswap v4 赢了"把 v3 做得更好"的战役，但"把 DEX 变成平台"的战争才刚刚开始。

---

## 资料来源

1. **DefiLlama - Uniswap V4**（TVL $8.55 亿，18 条链）
   https://defillama.com/protocol/uniswap-v4

2. **Uniswap v4-core GitHub**（PoolManager、IUnlockCallback、Hooks 接口）
   https://github.com/Uniswap/v4-core

3. **Uniswap Universal Router GitHub**（V4_SWAP command）
   https://github.com/Uniswap/universal-router

4. **Uniswap 官方博客——v4 发布公告**
   https://blog.uniswap.org/uniswap-v4

5. **DefiLlama - Monad 链上 Uniswap v4 TVL**
   https://defillama.com/chain/Monad?protocol=uniswap-v4

6. **Moss Protocol GitHub（PR review 上下文）**
   https://github.com/nishuzumi/moss
