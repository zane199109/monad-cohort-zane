# Moss 协议适配器模板包深度分析

**日期：** 2026-07-18
**来源：** `packages/protocols/_template`（Moss 官方仓库 main 分支）

---

## 目录结构

```
_template/
├── README.md              # 使用说明 + Checklist
├── package.json           # @themoss/protocol-template
├── tsconfig.json          # extends ../../../tsconfig.base.json
├── vitest.config.ts       # esbuild target:es2022 + core 源码别名
├── src/
│   ├── index.ts           # 入口：导出 ExampleVaultAbi + EXAMPLE_VAULT_ADDRESS + ExampleProtocol
│   ├── adapter.ts         # 核心：@Protocol 类 + Capability + Query + Receipt
│   └── abis/
│       └── example.ts     # ABI：parseAbi() 字符串，ADR 0007 origin header
└── test/
    ├── adapter.test.ts    # 运行时测试：tree 构建 + Receipt 解析
    └── types.fixture.ts   # 编译期类型测试：@ts-expect-error 验证
```

---

## 文件逐行解析

### 1. package.json

```json
{
  "name": "@themoss/protocol-template",
  "version": "0.0.0",
  "private": true,
  "description": "CHANGEME: Moss protocol adapter for <Protocol> on Monad",
  "license": "MIT",
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap --clean --target es2022",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@themoss/core": "workspace:*",
    "viem": "^2.54.3"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "~5.9.0",
    "vitest": "^3.2.6"
  }
}
```

**要点：**
- `private: true` — 开发阶段保持私有，发布时移除
- `@themoss/core: workspace:*` — 依赖 core 包，版本号跟随 monorepo
- `viem` — 唯一的外部运行时依赖，用于 `parseAbi()`、`decodeEventLog()`、`parseUnits()`
- `tsup` — ESM + DTS 打包，target es2022
- `vitest: ^3.2.6` — pin vitest 3（因为 vite 8 的 oxc 不支持 stage-3 decorators 降级）

### 2. tsconfig.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src", "test"]
}
```

**要点：**
- 继承根级 `tsconfig.base.json`
- `noEmit: true` — 类型检查不输出 JS
- 只包含 src/ 和 test/

### 3. vitest.config.ts

```typescript
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Stage-3 decorators: V8 cannot parse them natively yet, so the esbuild
  // transform must lower them (ADR 0001 toolchain constraint). This is also
  // why the repo pins vitest 3 — vite 8's oxc does not lower them.
  esbuild: { target: "es2022" },
  resolve: {
    alias: {
      "@themoss/core": fileURLToPath(new URL("../../core/src/index.ts", import.meta.url)),
    },
  },
});
```

**要点：**
- `esbuild: { target: "es2022" }` — 降级 stage-3 decorators（`@Protocol`、`@Capability` 等），这是 ADR 0001 的工具链约束
- `alias` — 测试直接引用 core 的 `src/index.ts` 而非 dist，避免 stale build 导致 phantom failures

### 4. src/index.ts

```typescript
export { ExampleVaultAbi } from "./abis/example.js";
export { EXAMPLE_VAULT_ADDRESS, ExampleProtocol } from "./adapter.js";
```

**要点：**
- 只导出三个东西：ABI、地址常量、Protocol 类
- **不做任何注册操作** — Registry 扫描模块 exports 自动发现 `@Protocol` 类
- 没有 import side effect，没有 defineProtocolPackage()

### 5. src/abis/example.ts

```typescript
// ABI origin: CHANGEME (ADR 0007) — pick exactly one tier and document it:
//
//   compiled  — generated from contract source in this package: foundry
//               project + @wagmi/cli foundry plugin
//   explorer  — pulled from the block explorer's VERIFIED contract page.
//               Record the explorer URL and the retrieval date.
//   vendored  — taken from a third-party verifiable source (official SDK on
//               npm, protocol repo). Do NOT hand-copy: commit upstream files
//               verbatim in abis-src/ and add an update:abis script.
//
// Human-readable parseAbi strings and generated `as const` JSON are both
// fine — what matters is that abitype can infer literal types, so Handles
// stay fully typed.
import { parseAbi } from "viem";

export const ExampleVaultAbi = parseAbi([
  "function deposit() payable",
  "function balanceOf(address owner) view returns (uint256)",
  "event Deposited(address indexed account, uint256 amount)",
]);
```

**要点：**
- 使用 `parseAbi()` 字符串数组而非 JSON，因为 abitype 能推断出 literal types
- Handles 需要完整的类型推断，所以 ABI 必须是字面量类型
- ADR 0007 origin header 必须声明恰好一个 tier（compiled/explorer/vendored）
- 三种格式都可用：parseAbi 字符串、`as const` JSON、或 wagmi generateAbi 输出

### 6. src/adapter.ts（核心文件）

```typescript
import {
  Address,
  type AddressValue,
  Capability,
  type Change,
  type Handle,
  type Hex,
  type InferParams,
  type ParamsSpec,
  PositiveDecimalString,
  Protocol,
  Query,
  Receipt,
  type ReceiptResult,
} from "@themoss/core";
import { decodeEventLog, parseUnits } from "viem";
import { ExampleVaultAbi } from "./abis/example.js";

// CHANGEME: replace with an address verified on Monad mainnet.
export const EXAMPLE_VAULT_ADDRESS: AddressValue = "0x0000000000000000000000000000000000000001";

const depositParams = {
  amount: {
    type: PositiveDecimalString,
    description: "Human-readable native MON amount to deposit; MON uses 18 decimals.",
  },
} satisfies ParamsSpec;

const balanceParams = {
  owner: { type: Address, description: "Address whose vault balance is read." },
} satisfies ParamsSpec;

type DepositOutcome = { operation: "deposit"; account: AddressValue; amount: string };

@Protocol({
  name: "template",
  category: "token",
  description: "CHANGEME: describe this Protocol in one sentence.",
  contracts: { vault: { abi: ExampleVaultAbi, addr: EXAMPLE_VAULT_ADDRESS } },
})
export class ExampleProtocol {
  declare vault: Handle<typeof ExampleVaultAbi>;

  @Capability<ExampleProtocol, typeof depositParams>({
    intent: "Deposit native MON into the example vault",
    verb: "supply",
    params: depositParams,
    receipt: "depositReceipt",
    risk: ["fundOut"],
    tags: ["example"],
  })
  async deposit(params: InferParams<typeof depositParams>) {
    return [this.vault.deposit([], { value: parseUnits(params.amount, 18) })];
  }

  @Query({ intent: "Read an example vault balance", params: balanceParams })
  async balanceOf(params: InferParams<typeof balanceParams>) {
    const balance = await this.vault.read.balanceOf([params.owner]);
    return { owner: params.owner, balance: balance.toString() };
  }

  @Receipt()
  depositReceipt(changes: readonly Change[]): ReceiptResult<DepositOutcome> {
    let event: DepositOutcome | undefined;
    let native: Extract<Change, { kind: "nativeTransfer" }> | undefined;
    const parsed = changes.map((change) => {
      if (change.kind === "nativeTransfer") {
        if (native) throw new Error("example deposit emitted multiple native transfers");
        native = change;
        return {
          kind: "change" as const,
          change,
          data: { operation: "nativeTransfer", value: change.value },
          text: `Native MON Transfer: ${change.value} from ${change.from} to ${change.to}`,
        };
      }
      let decoded: ReturnType<typeof decodeEventLog<typeof ExampleVaultAbi>>;
      try {
        decoded = decodeEventLog({
          abi: ExampleVaultAbi,
          topics: change.topics as [Hex, ...Hex[]],
          data: change.data,
          strict: true,
        });
      } catch {
        throw new Error("Unexpected Change: unsupported example vault event");
      }
      if (decoded.eventName !== "Deposited" || event) {
        throw new Error(`Unexpected Change: example vault emitted ${decoded.eventName}`);
      }
      event = {
        operation: "deposit",
        account: decoded.args.account,
        amount: decoded.args.amount.toString(),
      };
      return {
        kind: "change" as const,
        change,
        data: event,
        text: `Example Deposit: ${event.amount} by ${event.account}`,
      };
    });
    if (!event || !native || event.amount !== native.value) {
      throw new Error("example deposit Receipt requires matching Deposited and native Changes");
    }
    return {
      kind: "receipt",
      outcome: event,
      text: `Example Deposit: ${event.amount} by ${event.account}`,
      changes: parsed,
    };
  }
}
```

**架构拆解：**

#### 参数声明模式

```typescript
const depositParams = {
  amount: {
    type: PositiveDecimalString,        // ← context-free Zod 值契约
    description: "Human-readable native MON amount...",  // ← method-specific 用途
  },
} satisfies ParamsSpec;
```

每个参数是一个 `{ type, description }` 对象：
- `type`：可复用的 context-free Zod schema，描述值的表示/单位/约束/示例
- `description`：字段在方法中的具体角色

#### Protocol 装饰器

```typescript
@Protocol({
  name: "template",                    // 唯一 slug
  category: "token",                   // 在 CATEGORIES 闭集中
  description: "...",                  // 非空字符串
  contracts: {                         // 合约配置
    vault: { abi: ExampleVaultAbi, addr: EXAMPLE_VAULT_ADDRESS },
  },
  // protocols: { ... },              // （可选）显式 Protocol 依赖注入
})
```

#### Handle 类型推断

```typescript
declare vault: Handle<typeof ExampleVaultAbi>;
```

`Handle<T>` 是从 ABI 推导出的类型安全网关：
- `this.vault.deposit([])` — encode unsigned tx
- `this.vault.read.balanceOf([addr])` — read state
- 所有方法调用都有完整类型推断

#### Capability 装饰器

```typescript
@Capability<ExampleProtocol, typeof depositParams>({
  intent: "Deposit native MON into the example vault",  // 非空
  verb: "supply",                                         // 在 VERBS 闭集中
  params: depositParams,                                  // 匹配方法签名
  receipt: "depositReceipt",                              // 指向 @Receipt 方法名
  risk: ["fundOut"],                                      // 非空，在 RISK_LABELS 闭集中
  tags: ["example"],                                      // （可选）字符串数组
})
async deposit(params: InferParams<typeof depositParams>) {
  return [this.vault.deposit([], { value: parseUnits(params.amount, 18) })];
}
```

**关键规则：**
- `verb` 是用户视角的操作语义（如 `wrap`、`swap`、`supply`），不是合约函数名
- `risk` 至少一个标签，标记危险类别（fundOut、approval、priceImpact 等）
- `receipt` 名称必须匹配类中一个 `@Receipt()` 标记的方法
- 返回值是 TransactionNode 数组：`[this.vault.deposit(...)]`
- 嵌套 Capability（跨协议调用）放在 children 中，不是 direct TransactionNode

#### Query 装饰器

```typescript
@Query({ intent: "Read an example vault balance", params: balanceParams })
async balanceOf(params: InferParams<typeof balanceParams>) {
  const balance = await this.vault.read.balanceOf([params.owner]);
  return { owner: params.owner, balance: balance.toString() };
}
```

- Query 不需要 `verb`、`risk`、`receipt`
- 返回 JSON-safe 数据，不产生交易

#### Receipt parser

```typescript
@Receipt()
depositReceipt(changes: readonly Change[]): ReceiptResult<DepositOutcome> {
```

**Receipt parser 的核心约束：**
1. **纯函数** — 只接收 `Change[]`，不访问 Runtime/Handle/Query/RPC
2. **保留 exact Change object identity** — `change` 字段是原始 Change 对象的引用
3. **验证顺序和长度** — 输出的 `changes` 数组与输入完全对应
4. **结构化 Outcome** — `outcome` 是 JSON-safe 的 `DepositOutcome`
5. **presentation text** — `text` 是人类可读的描述

**解析流程：**
```
for each change in changes:
  if nativeTransfer → 提取 sender/receiver/value，验证唯一性
  if event → decodeEventLog(ExampleVaultAbi, topics, data)
    → 验证 eventName === "Deposited"
    → 提取 account + amount
  构建 ReceiptChange { kind: "change", change: original, data: decoded, text: human-readable }

验证：event exists AND native exists AND event.amount === native.value
返回：{ kind: "receipt", outcome: event, text: ..., changes: parsed }
```

### 7. test/adapter.test.ts（运行时测试）

```typescript
describe("Protocol template", () => {
  it("registers its exported Protocol directly and builds one transaction", async () => {
    const registry = new Registry(runtime).use(ExampleProtocol);
    const capability = await registry.action("template", "deposit", ACCOUNT, { amount: "1" });
    if (capability.kind !== "capability") throw new Error("expected capability");
    expect(flattenCapabilityTree(capability)[0]?.transaction).toMatchObject({
      to: EXAMPLE_VAULT_ADDRESS,
      value: "0xde0b6b3a7640000",
    });
  });

  it("parses all deposit Changes without replacing their objects", async () => {
    const registry = new Registry(runtime).use(ExampleProtocol);
    const capability = await registry.action("template", "deposit", ACCOUNT, { amount: "1" });
    if (capability.kind !== "capability") throw new Error("expected capability");
    const native = { kind: "nativeTransfer", from: ACCOUNT, to: EXAMPLE_VAULT_ADDRESS, value: "1000000000000000000" };
    const deposited = { kind: "event", address: EXAMPLE_VAULT_ADDRESS, topics: [...], data: [...] };
    const receipt = registry.parseReceipt(capability, [native, deposited]);
    expect(receipt.outcome).toEqual({
      operation: "deposit",
      account: ACCOUNT,
      amount: "1000000000000000000",
    });
  });
});
```

**两个测试覆盖：**
1. **Capability tree 构建** — Registry.action() 返回 CapabilityNode，flatten 后验证 direct TransactionNode 的 to/value
2. **Receipt 解析** — 手动构造 nativeTransfer + Event Changes，验证 parseReceipt 产出正确的 Outcome

### 8. test/types.fixture.ts（编译期类型测试）

这个文件用 `@ts-expect-error` 断言各种错误用法被 TypeScript 拒绝：

| 测试场景 | 断言内容 |
|---------|---------|
| Params 类型推断 | `{ amount: "42" }` 有效，`{ amount: 42 }` 无效（Zod 推断为 string） |
| ProtocolRef 暴露方法而非 Handle | `dependency.deposit` 有效，`dependency.vault` 无效 |
| 依赖注入类型匹配 | `declare example: ProtocolRef<ExampleProtocol>` 有效，省略 declare 无效 |
| 构造函数限制 | Protocol 类不能有 constructor 参数 |
| Receipt 方法名校验 | `receipt: "missingReceipt"` 无效（不存在 @Receipt 方法） |
| Capability 参数类型 | 方法签名参数必须匹配 ParamsSpec 推断类型 |
| Receipt parser 签名 | 只接受 `readonly Change[]`，不接受其他参数 |
| Handle 类型安全 | `handle.withdraw([])` 无效（ABI 中不存在），`handle.read.balanceOf(["not-an-address"])` 无效 |

---

## 创建新协议适配器的标准流程

根据 `_template/README.md` 的 Checklist：

```bash
cp -R packages/protocols/_template packages/protocols/myprotocol
cd packages/protocols/myprotocol
pnpm install
```

然后逐项完成：

1. **重命名 package** — `@themoss/protocol-myprotocol`，替换所有 CHANGEME 占位符
2. **ABI 来源** — 放入 `src/abis/`，带 compiled/explorer/vendored origin header
3. **固定地址** — 记录 canonical source + bytecode check + metadata check
4. **导出 Protocol 类** — 从 `src/index.ts` 直接导出，不单独注册
5. **Protocol 依赖** — 显式声明 `protocols: { erc20: ERC20 }`，使用 `declare erc20: ProtocolRef<ERC20>`
6. **Parameter 声明** — `{ type: Zod, description: string }` 分离
7. **Capability 约束** — 恰好一个 direct TransactionNode + 一个 named Receipt parser
8. **Receipt parser** — 纯函数，preserve exact Change object identity + length + order
9. **编译期测试** — `@ts-expect-error` negative fixtures
10. **运行时测试** — metadata、tree validation、Receipt coverage、failure cases
11. **模拟测试** — Monad-mainnet happy path 零 Warning
12. **Stable exports** — 只导出稳定 Protocol，实验性类保持 internal

---

## 关键设计决策总结

1. **Protocol 类通过顶层导出被发现** — Registry.scan(exports) 找 `PROTOCOL_META` symbol，零注册代码
2. **Handle 是 ABI-generic 类型安全网关** — `Handle<typeof ExampleVaultAbi>` 让所有方法调用有完整类型推断
3. **Receipt parser 是纯函数** — 只接收 `Change[]`，不访问任何外部状态，保证可测试性和确定性
4. **Parameter type/description 分离** — context-free Zod schema 可复用，field purpose 描述方法特定角色
5. **编译期 + 运行时无缝衔接** — `@ts-expect-error` fixture 确保类型契约，runtime test 确保行为正确
6. **Decorator 需要 esbuild 降级** — Stage-3 decorators（`@Protocol`、`@Capability`）V8 原生不支持，必须 `esbuild: { target: "es2022" }`
