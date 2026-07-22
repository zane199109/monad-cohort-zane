# Moss Protocol Adapter Challenge — 任务完成报告

**提交人：** zane199109 (庄祯)
**Adapter 名称：** FastLane shMONAD Liquid Staking Protocol
**PR 链接：** https://github.com/nishuzumi/moss/pull/116
**状态：** ✅ Merged → upstream/adapter/fastlane
**合并 Commit：** 97cc0765e0c0d9058a479fa0f0b0f53b8275d52e

---

## Adapter 功能简介（100 字以内）

FastLane shMONAD 流动性质押协议适配器，为 Monad 主网提供 MON→shMON 质押、原子赎回、延迟解押和收益增强五大能力，含完整 Receipt 穷尽覆盖和编译时类型安全证明。

---

## 贡献详情

### 文件结构

```
packages/protocols/fastlane/
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── vitest.online.config.ts
├── abis.json
├── src/
│   ├── index.ts              # 公共导出入口
│   ├── fastlane.ts           # Protocol 主实现（5 Capabilities + 5 Queries + 5 Receipts）
│   ├── types.ts              # Outcome 类型定义
│   └── abis/
│       └── fastlane.ts       # ABI 完整源（ADR 0007 explorer tier）
├── test/
│   ├── fastlane.test.ts      # 离线单元测试（14 tests）
│   └── types.fixture.ts      # 编译时类型安全证明
└── test-online/
    └── abi-explorer.test.ts  # 链上 ABI 交叉验证
```

### 合约地址

| 合约 | 地址 | 来源 |
|------|------|------|
| Staking Proxy | `0x1B68626dCa36c7fE922fD2d55E4f631d962dE19c` | MonadScan |
| EIP-1967 Implementation | `0x856a4019228c265dee336df705277607c4a18e1b` | MonadScan |
| Chain | Monad Mainnet (ID 143) | 官方 |

### 能力清单

| 类型 | 方法 | 说明 |
|------|------|------|
| Capability | deposit | MON → shMON shares，ERC-4626 stake |
| Capability | redeem | atomic unstake，可能含 exit fee |
| Capability | requestUnstake | delayed unstake，等待 epoch 完成 |
| Capability | completeUnstake | 完成 delayed unstake |
| Capability | boostYield | 向 yield originator 提供流动性 |
| Query | balanceOf | 查询 shMON 余额 |
| Query | totalSupply | 查询总供应量 |
| Query | previewDeposit | MON → shares 预览 |
| Query | previewRedeem | shares → MON 预览 |
| Query | convertToAssets | 当前汇率转换 |

### 技术亮点

1. **ADR 0007 Explorer Tier ABI** — 从 MonadScan 获取，含完整溯源标注
2. **Receipt 穷尽覆盖** — 每个 Change 被恰好覆盖一次且顺序一致，含 nativeTransfer 交叉验证
3. **编译时类型安全** — `@ts-expect-error` fixture 证明正向推断正确、反向拒绝非法参数
4. **ERC-20 依赖委托** — Mint/Burn Transfer 事件委托给注入的 ERC20 Protocol dependency
5. **链上验证测试** — `test-online/abi-explorer.test.ts` 验证 proxy bytecode、implementation slot、ABI 语义等价

### 审查对照

| nishuzumi 要求 | 状态 |
|----------------|------|
| Live Monad e2e 测试 | ✅ `test-online/abi-explorer.test.ts` + offline test |
| ABI 溯源链 + CI 交叉检查 | ✅ ADR 0007 explorer tier，`abis.json` manifest |
| 地址验证测试 | ✅ bytecode 存在性 + token metadata 匹配 |
| Minor cleanups | ✅ Receipt identity/length/order 断言 |

### 审查反馈处理

PR 经过 nishuzumi 审查，修复了以下问题：
- Focused ABI 的 deposit 函数缺少 assets 参数 → 补全签名
- RequestUnstake.completionEpoch 类型错误为 uint64 → 改为 uint256
- boostYield 参数数量不匹配 → 修正为 3 参数版本

---

## 学习收获

1. 深入理解 Moss 的 Capability Tree + Receipt Parser 架构
2. 掌握 Focused ABI 策略——Handle 类型推断需要纯 function+event ABI
3. 学会 TokenReference 的正确用法——必须用 `typeof TokenReference`
4. 认识到 Receipt parser 是安全核心——每个 Change 必须被恰好覆盖一次
5. 理解了 ADR 0007 不仅是标注——ABI 来源分级影响信任链

---

## Review / Merge 截图

（待补充——PR 已合并到 upstream/adapter/fastlane）
