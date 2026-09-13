# 代码规范

**项目**: Tweets Viewer | **最后更新**: 2026-09-13

## TypeScript 代码风格

本项目遵循 [@antfu/eslint-config](https://github.com/antfu/eslint-config)（ESLint + fix 自动修复），配合 TypeScript strict 模式。`bun run lint` 触发 autofix，`bun run lint:check` 为门禁（不改文件）。

### 命名约定

| 类型 | 风格 | 示例 |
| --- | --- | --- |
| 类型/接口 | PascalCase | `EnrichedTweet`, `PaginatedResponse<T>` |
| 函数/方法 | camelCase | `getTweetsByDateRange`, `tweetUrl` |
| 常量 | UPPER_SNAKE_CASE | `PAGE_SIZE`, `DATABASE_URL` |
| 变量/参数 | camelCase | `pageSize`, `hasMore` |
| React 组件 | PascalCase | `DateRangeFilter`, `TweetCard` |
| React Hooks | camelCase + `use` 前缀 | `useTweetStore`, `useSearchParams` |
| 文件命名 | kebab-case | `date-range-filter.tsx`, `tweet-skeleton.tsx` |
| 包名 | kebab-case | `@tweets-viewer/rettiwt-api` |

### 文件组织

```ts
// 1. Imports（按 @antfu 排序：builtin → external → internal → type）
import { formatDate } from '@tweets-viewer/shared'
import { apiClient, enrichmentService } from '../src/common'

// 2. 类型定义
export interface Meta { /* ... */ }

// 3. 常量

// 4. 业务函数 / 组件（纯逻辑优先下沉 app/lib/）

// 5. Private helpers
```

### React / Compose 约定

- 组件优先复用 `~/components/ui/` 下的 Base UI/COSS 组件，不手写 div 模拟
- 回调使用 `onXxx` 命名：`onApply`, `onChange`
- 使用 `cn()` 合并类名，禁止字符串拼接
- 导入路径使用 `~/` 前缀，不使用 `@/`
- 所有颜色使用 CSS 变量 Token，禁止硬编码（详见 `../ui-design/OVERVIEW.md`）
- 所有组件兼容 `.dark` 模式；移动端交互考虑 `active` 态与 ≥44px 触控目标
- **纯逻辑下沉**：分组/分页状态机/日期/媒体 hash 等放 `app/lib/` 并单测；组件只做渲染与 URL 修改

### Zustand 约定

```ts
// ✅ 双括号定义 + selector 订阅
export const useUserStore = create<UserState>()((set, get) => ({ /* ... */ }))
const activeUser = useUserStore(s => s.activeUser)
const { users, activeUser } = useUserStore(useShallow(s => ({ users: s.users, activeUser: s.activeUser })))

// ❌ 直接解构整个 store，触发多余重渲染
const { activeUser } = useUserStore()
```

- `persist` store 必须用 `_hasHydrated` 模式防 SSR mismatch
- 存储迁移（`partialize` 版本变化）必须类型化，禁止静默丢数据

### TypeScript 特性使用

```ts
// PREFER: 显式类型 + 泛型
export function getPaginated<T>(data: T[], page: number): PaginatedResponse<T>

// PREFER: 可选链 + 空值合并
const name = user?.userName ?? 'unknown'

// PREFER: catch 用 unknown + 窄化
try { /* ... */ } catch (error: unknown) {
  if (error instanceof Error) { /* ... */ }
}
```

### 禁止事项

| 禁止 | 替代方案 |
| --- | --- |
| `any` 类型（业务代码） | 明确类型或 `unknown` + 收窄 |
| `catch (error: any)` | `catch (error: unknown)` + `instanceof Error` |
| 硬编码颜色/尺寸 | CSS 变量 Token（`bg-background` 等） |
| 硬编码 URL / API 基址 | `@tweets-viewer/shared` 常量 / `env.server.ts` |
| 直接解构 store | selector + `useShallow` |
| 未使用的 import | 提交前删（ESLint 会标） |
| 字符串拼接类名 | `cn()` |
| `@/` 别名导入 | `~/` 前缀 |
| 脚本里裸写 `NODE_ENV=...`（Windows 失效） | `cross-env NODE_ENV=...`（见下） |
| `git push --no-verify` 绕过门禁 | 修好门禁再 push |

## 测试规范

- **框架**: Vitest（`bun run test` = 全包；单包调试用 `bun --cwd <pkg> test`）
- **命名**: `*.test.ts` / `*.test.tsx`，位于包内 `__tests__/`
- **结构**: `describe` + `it('...')` 描述行为，Given-When-Then
  ```ts
  describe('groupTweetsByYear', () => {
    it('returns tweets within the date range', async () => { /* ... */ })
  })
  ```
- **纯函数优先**：分组/分页状态机/日期/媒体 hash 逻辑必须单测后再接 UI
- **web-react 三 project**（`vitest.config.ts`）：
  - `unit` — 常规单元 + 组件测试（jsdom）
  - `stories` — Storybook portable stories（addon-vitest）
  - `vrt` — 视觉回归（真实 Chromium + `toMatchScreenshot`，`*.vrt.test.tsx`）
  - **纪律**：会接管 `test.include` 的插件（`storybookTest()`）只进自己的 project，否则静默吞测试；
    新增用例后核对 `Test Files` 数量（见 [postmortem 002](../postmortem/002-vitest-component-test-infra.md)）
- **断言存在性（机器强制）**：eslint `test/expect-expect` / `test/no-conditional-expect` / `test/no-standalone-expect`
  —— 每条 `it` 至少一条断言，拦住条件断言与裸 `expect`，防止「测试看起来绿，其实什么都没验」
- **`NODE_ENV` 固定**：所有包脚本经 `cross-env NODE_ENV=test` 运行 Vitest。宿主 `NODE_ENV=production`
  会让 React 加载 production 构建（`React.act` 缺失 → 组件测试全红），也会让 dev server 变生产模式（见 [postmortem 005](../postmortem/005-host-node-env-leak.md)）

## ESLint 配置

配置文件 `eslint.config.mjs`（@antfu/eslint-config）。

- `bun run lint` = `eslint . --fix`
- `bun run lint:check` = `eslint . --max-warnings=0`（CI / pre-push 用）
- `packages/rettiwt-api/**`（vendored Fork）与 `.commandcode/**`（工具产物）豁免 lint

## Lefthook 钩子

| Hook | 命令 | 说明 |
| --- | --- | --- |
| pre-commit | `bun run eslint {staged_files} --fix` | 修复暂存文件，`stage_fixed` |
| pre-push | `lint:check` → `typecheck` → `test` → `build:client` | 真实门禁，全绿才放行 |

**禁止 `--no-verify`** 绕过钩子/CI；门禁红就修门禁。
