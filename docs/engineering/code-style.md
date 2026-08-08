# 代码规范

**项目**: Tweets Viewer | **最后更新**: 2026-08-09

## TypeScript 代码风格

本项目遵循 [@antfu/eslint-config](https://github.com/antfu/eslint-config)（ESLint 9 + fix 自动修复），配合 TypeScript strict 模式。`bun lint` 触发。

### 命名约定

| 类型 | 风格 | 示例 |
|---|---|---|
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
import { writeJson } from '../src/utils'

// 2. 类型定义
export interface Meta { ... }

// 3. 常量

// 4. 业务函数 / 组件

// 5. Private helpers
```

### React / Compose 约定

- 组件优先复用 `~/components/ui/` 下的 Base UI/COSS 组件，不手写 div 模拟
- 回调使用 `onXxx` 命名：`onApply`, `onChange`
- 使用 `cn()` 合并类名，禁止字符串拼接
- 导入路径使用 `~/` 前缀，不使用 `@/`
- 所有颜色使用 CSS 变量 Token，禁止硬编码
- 所有组件兼容 `.dark` 模式

### TypeScript 特性使用

```ts
// PREFER: 显式类型 + 泛型
export function getPaginated<T>(data: T[], page: number): PaginatedResponse<T>

// PREFER: 可选链 + 空值合并
const name = user?.userName ?? 'unknown'

// PREFER: 窄化类型，避免 any
```

### 禁止事项

| 禁止 | 替代方案 |
|---|---|
| `any` 类型（业务代码） | 明确类型或 `unknown` + 收窄 |
| 硬编码颜色/尺寸 | CSS 变量 Token（`bg-background` 等） |
| 硬编码 URL | `@tweets-viewer/shared` 常量 |
| 未使用的 import | 提交前删（ESLint 会标） |
| 字符串拼接类名 | `cn()` |
| `@/` 别名导入 | `~/` 前缀 |

## 测试规范

- **命名**: `describe` + `it('...')` 描述行为
- **Given-When-Then** 结构
  ```ts
  describe('getTweetsByDateRange', () => {
    it('returns tweets within the date range', async () => { ... })
  })
  ```
- 测试文件位于包内 `__tests__/` 或 `.test.ts`
- 各子包独立运行：`bun --cwd packages/database test`

## ESLint 配置

配置文件 `eslint.config.mjs`（@antfu/eslint-config）。`bun lint` = `eslint . --fix`。

## Lefthook 钩子

| Hook | 命令 | 说明 |
|---|---|---|
| pre-commit | `bun run eslint {staged_files} --fix` | 修复暂存文件，stage_fixed |
| pre-push | `bun run build:client` | 推送前验证前端构建 |
