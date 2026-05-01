# Architecture Overview: Tweets Viewer

> **文档性质**：本文档描述 Tweets Viewer 的整体架构——Monorepo 结构、各子系统职责、数据流向和部署拓扑。

## 1. 仓库结构 (Monorepo)

```
tweets-viewer/
├── apps/
│   ├── web-react/   # 前端 (React Router v7 SSR)
│   ├── server/      # API 服务端 (Cloudflare Workers + Hono)
│   └── scripts/     # 离线归档脚本 (抓取→合并→入库)
├── packages/
│   ├── database/    # 数据库 Schema + 查询/写入模块 (Drizzle ORM)
│   ├── rettiwt-api/ # Twitter API 客户端库 (内部 Fork)
│   └── shared/      # 共享常量、类型、工具
├── docs/            # 项目文档
├── wrangler.toml    # Cloudflare Workers 部署配置
├── env.server.ts    # 服务端环境变量验证 (Zod)
└── bunfig.toml      # Bun 配置 (hoisted 安装模式)
```

**包管理器**：Bun 1.3.13 (Workspaces 模式)，配置于根 `package.json#workspaces: ["packages/*", "apps/*"]`

---

## 2. 各子系统职责

### 2.1 `apps/web-react` — 前端

- **职责**：推文归档的沉浸式阅读终端（只读）
- **技术栈**：React 19 + React Router v7 (SSR mode) + Tailwind CSS v4 + shadcn/ui
- **状态管理**：Zustand (全局持久化) + Jotai (原子化) + useState (组件局部)
- **关键路由**（定义于 `app/routes.ts`）：
  | URL | 视图 |
  |-----|------|
  | `/` | 首页 (Hero + 功能介绍) |
  | `/tweets/:name` | 主时间线（无限滚动 + 分页器 + 日期/排序筛选） |
  | `/media/:name` | 媒体墙（图片/视频网格，瀑布流布局） |
  | `/search/:name?` | 搜索视图（关键词全文检索） |
  | `/memo/:name` | "那年今日"视图（历史同天推文） |
- **状态同步协议**：URL 作为唯一真值来源——前端不直接调用 API，只修改 URL；React Router 的 loader 监听 URL 变化后自动发起请求。
- **部署**：Vercel (React Router v7 preset)，域名为 `tweet.chilfish.top`

### 2.2 `apps/server` — API 服务端

- **职责**：为前端提供推文/用户数据的 REST API
- **技术栈**：Hono v4 (Web 框架) + Drizzle ORM + Neon Postgres (Serverless)
- **路由模块**：
  - `routes/tweets.ts` — 推文列表、媒体列表、搜索、那年今日（含 LRU 缓存）
  - `routes/users.ts` — 用户查询
  - `routes/image.ts` — 随机图片（从静态 JSON 读取）
  - `routes/ins.ts` — Instagram 风格数据端点（从静态文件缓存或远程拉取）
- **缓存策略**：
  - 服务端 LRU 缓存推文总数 (Map-based SimpleLRUCache, 容量 1000)
  - 客户端 axios-cache-interceptor 缓存 API 响应
- **双数据源**：API 主要从 PostgreSQL 查询；同时保留静态 JSON 回退 (`cachedData` + `getData()` in `common.ts`)。
- **速率限制**：Cloudflare Workers 层 (200 req/60s) + 应用层 (hono-rate-limiter)
- **部署**：Cloudflare Workers，通过 Nitro 构建，域名为 `tweet-api.chilfish.top`

### 2.3 `apps/scripts` — 归档脚本

- **职责**：离线抓取推文数据，合并去重，写入数据库
- **核心脚本**：
  | 文件 | 用途 |
  |------|------|
  | `dailyUpdate.ts` | 每日增量同步：遍历所有用户，全量同步推文（游标分页 + 自动重试） |
  | `fetchTimeline.ts` | 抓取指定用户时间线（含回复），保存到缓存文件 |
  | `fetchSearch.ts` | 抓取搜索结果 |
  | `insertToDB.ts` | 读取本地 JSON，批量写入数据库 |
  | `mergeData.ts` | 合并多个时间线 JSON 文件，去重排序 |
- **调度**：GitHub Actions cron (`0 16 * * *` UTC = 北京时间 00:00) + 手动触发
- **工作流**：`.github/workflows/fetch-daily.yml` — checkout → setup Bun → install → run `dailyUpdate.ts`
- **连接池**：`RettiwtPool` 多 API_KEY 轮转，避免速率限制

---

## 3. 共享包 (packages/)

### 3.1 `packages/database` — 数据库层

- **Schema**（定义于 `schema.ts`）：

  ```
  users                        tweets
  ┌────────────────────┐      ┌─────────────────────────────┐
  │ id: serial (PK)    │◄─────│ userId: text (FK → userName) │
  │ restId: text       │      │ tweetId: text (UNIQUE)       │
  │ userName: text (UQ)│      │ fullText: text               │
  │ jsonData: json     │      │ createdAt: timestamp         │
  └────────────────────┘      │ jsonData: json               │
                              └─────────────────────────────┘
  ```

  - `jsonData` 列存储完整的 `EnrichedTweet` / `EnrichedUser` JSON
  - 结构化列 (`tweetId`, `fullText`, `createdAt`) 用于高效查询
  - 外键级联删除：删除用户时自动清除其推文

- **查询模块** (`modules/`)：
  - `tweet.ts`：`getTweets`, `getTweetsByDateRange`, `getTweetsByKeyword`, `getLastYearsTodayTweets`, `getMediaTweets`, `createTweets` (批量 upsert, 1000 条/批次)
  - `user.ts`：`createUser` (upsert), `getAllUsers`, `getUserByName`

### 3.2 `packages/rettiwt-api` — Twitter API 客户端

- **来源**：[Rettiwt-API](https://github.com/Rishikant181/Rettiwt-API) (v6) 的本地 Fork，提供免速率限制的 Twitter API 访问
- **本项目扩展**：
  - `TwitterAPIClient.ts`：底层 HTTP 抓取封装
  - `TweetEnrichmentService.ts`：原始推文 → `EnrichedTweet` 转换（过滤广告、处理引用推文）
  - `RettiwtPool.ts`：多 API_KEY 连接池轮转
  - `types/enriched/`：`EnrichedTweet`, `EnrichedUser` 等增强类型

### 3.3 `packages/shared` — 共享代码

- `constant.ts`：环境判断、API/代理 URL、PAGE_SIZE=15
- `types.ts`：`PaginatedResponse<T>` 统一分页响应格式
- `utils/date.ts`：日期格式化（date-fns, 北京/东京时区）
- `utils/index.ts`：`uniqueObj`, `mergeData`, `tweetUrl`, `snowId2millis`

---

## 4. 数据流向

```
┌────────────────────┐
│  Twitter API       │
│ (Rettiwt-API)      │
└────────┬───────────┘
         │ 原始推文
         ▼
┌────────────────────┐
│  apps/scripts      │───→ 本地 JSON 缓存文件
│  (dailyUpdate.ts   │
│   fetchTimeline.ts)│
└────────┬───────────┘
         │ EnrichedTweet[]
         ▼
┌────────────────────┐
│  Neon PostgreSQL   │  (Drizzle ORM)
└────────┬───────────┘
         │ PaginatedResponse<T>
         ▼
┌────────────────────┐
│  apps/server       │  (Hono + Cloudflare Workers)
│  REST API          │
└────────┬───────────┘
         │ JSON
         ▼
┌────────────────────┐
│  apps/web-react    │  (React Router v7 SSR)
│  浏览器            │
└────────────────────┘
```

---

## 5. 部署拓扑

```
  用户浏览器
      │
      ├──→ Vercel (CDN) ───→ apps/web-react (SSR + SPA)
      │
      └──→ Cloudflare Workers ───→ apps/server (API)
              │
              ├──→ Neon Postgres (主数据源)
              ├──→ p.chilfish.top (静态文件 / 回退数据)
              ├──→ KV: tweet-hono-rate-limiter (限流)
              └──→ RATE_LIMITER binding (200 req/60s)

  GitHub Actions (Cron, 北京时间 00:00)
      │
      └──→ apps/scripts/dailyUpdate.ts ───→ Neon Postgres
```

---

## 6. 环境变量

| 变量           | 用途                              | 位置                                    |
| -------------- | --------------------------------- | --------------------------------------- |
| `DATABASE_URL` | Neon Postgres 连接串              | `.env`, `wrangler.toml`, GitHub Secrets |
| `TWEET_KEYS`   | Twitter API Key 列表（逗号分隔）  | `.env`, `wrangler.toml`, GitHub Secrets |
| `ENVIRONMENT`  | 运行环境 (development/production) | `env.server.ts` (Zod 验证)              |

---

## 7. 关键技术决策

1. **Monorepo + Bun Workspaces**：共享类型/工具零开销引用，避免版本碎片
2. **PostgreSQL JSON 列**：兼顾查询效率（结构化列）和灵活性（完整 JSON），避免 EAV 反模式
3. **URL 驱动状态**：前后端分页/筛选状态统一由 URL 管理，支持书签和分享
4. **服务端驱动分页**：`PaginatedResponse.meta.hasMore` 精确控制列表末尾行为
5. **双层持久化**：Zustand `persist` (localStorage) 缓存用户/设置；axios-cache-interceptor 缓存 API 响应
6. **SSR + SPA 混合**：React Router v7 SSR mode 提供 SEO 友好的初始渲染 + SPA 流畅交互
7. **碳基读取 + 离线写入**：前端纯读库/读静态，抓取入库独立运行，互不干扰
