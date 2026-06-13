# CLAUDE.md

> Tweets Viewer — 推文归档阅读器 Monorepo

## 项目概述

一个「推文归档阅读器」：数据来自离线归档（PostgreSQL），前端提供沉浸式无限滚动 + 精确分页的阅读体验。纯只读、无社交交互。

- 在线地址：`https://tweet.chilfish.top`
- API 基址：`https://tweet-api.chilfish.top/v3`

## 常用命令

```bash
# 开发
bun dev              # 同时启动 server + client
bun dev:server       # 仅 API (http://localhost:3000)
bun dev:client       # 仅前端 (http://localhost:5173)

# 构建与部署
bun run build:client # 前端构建
bun run deploy       # API 部署到 Cloudflare Workers

# 代码质量
bun lint             # ESLint + fix

# 测试（各子包独立运行）
bun --cwd packages/database test
bun --cwd packages/shared test
bun --cwd apps/server test
bun --cwd apps/web-react test
```

## 仓库结构 (Monorepo, Bun Workspaces)

```
tweets-viewer/
├── apps/
│   ├── web-react/        # 前端 React Router v7 (SSR) + Tailwind v4 + Base UI/COSS
│   ├── server/           # API Hono v4 + Drizzle + Cloudflare Workers (Nitro)
│   └── scripts/          # 离线归档脚本 (抓取/合并/入库)
├── packages/
│   ├── database/         # Drizzle ORM Schema + 查询/写入模块
│   ├── rettiwt-api/      # Twitter API 客户端 (内部 Fork, 免速率限制)
│   └── shared/           # 共享常量、类型、工具
├── docs/                 # 规格文档、架构文档、API 文档、UI 设计系统
└── env.server.ts         # 服务端环境变量 Zod 验证
```

## 架构核心

### 数据流

```
Twitter API → scripts (抓取) → Neon PostgreSQL → server (Hono API) → web-react (SSR)
```

### 关键设计决策

1. **URL 驱动状态**：分页/筛选/排序全部在 URL query params 中，前端不直接调 API，只修改 URL；React Router loader 监听 URL 变化自动请求
2. **服务端驱动分页**：`PaginatedResponse<T>` 包含 `meta.hasMore`，前端据此控制无限滚动
3. **PostgreSQL JSON 列**：`tweets.jsonData` 和 `users.jsonData` 存储完整 `EnrichedTweet`/`EnrichedUser`，结构化列 (`tweetId`, `fullText`, `createdAt`) 辅助查询
4. **双层缓存**：服务端 `SimpleLRUCache`（推文计数），客户端 `axios-cache-interceptor`（API 响应）
5. **SSR + SPA 混合**：首屏 SSR（SEO 友好），后续交互纯客户端

### 数据库 Schema

```
users: id(serial PK), restId, userName(UQ), jsonData(json)
tweets: id(serial PK), tweetId(UQ), userId(FK→users.userName), fullText, createdAt, jsonData(json)
```

索引：`idx_tweets_username_createdat` (复合)、`idx_tweets_createdat` (单列)

### API 路由

| 端点                                        | 说明                                   |
| ------------------------------------------- | -------------------------------------- |
| `GET /v3/tweets/get/:name`                  | 用户推文列表（分页/日期范围/排除回复） |
| `GET /v3/tweets/medias/:name`               | 用户媒体推文（排除转推）               |
| `GET /v3/tweets/search?q=&name=`            | 关键词搜索                             |
| `GET /v3/tweets/get/:name/last-years-today` | "那年今日"                             |
| `GET /v3/users/all`                         | 所有用户                               |
| `GET /v3/users/get/:name`                   | 单个用户                               |

### 前端路由

| URL              | 视图                          |
| ---------------- | ----------------------------- |
| `/`              | 首页 (Hero)                   |
| `/tweets/:name`  | 主时间线（无限滚动 + 分页器） |
| `/media/:name`   | 媒体墙（图片/视频网格）       |
| `/search/:name?` | 搜索视图                      |
| `/memo/:name`    | "那年今日"                    |

## 技术栈

- **运行时**：Bun 1.3+ (packageManager)
- **前端**：React 19, React Router v7 (SSR), Tailwind CSS v4, Base UI/COSS, Zustand v5
- **后端**：Hono v4, Drizzle ORM, Neon Postgres (Serverless), Nitro v3
- **部署**：Vercel (前端) + Cloudflare Workers (API)
- **测试**：Vitest (50 tests)
- **代码质量**：ESLint (@antfu/eslint-config), lefthook (pre-commit)

## 开发规范

### 规格驱动开发 (SDD)

本项目遵循规格驱动开发。关键规格文件：

- `docs/Specification.md` — 功能行为事实来源
- `docs/ARCHITECTURE.md` — 全局架构
- `docs/API_DOCUMENTATION.md` — API 接口
- `docs/ui-design/OVERVIEW.md` — UI 设计系统

### UI 开发准则

- 所有颜色使用 CSS 变量 Token（`bg-background`, `text-muted-foreground` 等），禁止硬编码
- 所有组件兼容 `.dark` 模式
- 优先复用 `~/components/ui/` 下的 Base UI/COSS 组件
- 使用 `cn()` 合并类名，禁止字符串拼接
- 导入路径使用 `~/` 前缀，不使用 `@/`

### 状态管理

- **Zustand**：全局持久化状态（`useAppStore` - 主题/密度, `useUserStore` - 用户列表）
- **Zustand** (非持久化)：推文流状态（`useTweetStore` - tweets/status）
- **URL SearchParams**：分页/筛选状态（与 loader 联动）
- **useState**：组件局部状态

### 环境变量

| 变量           | 用途                 | 位置                    |
| -------------- | -------------------- | ----------------------- |
| `DATABASE_URL` | Neon Postgres 连接串 | `.env`, `wrangler.json` |
| `TWEET_KEYS`   | Twitter API Key 列表 | `.env`, `wrangler.json` |
| `ENVIRONMENT`  | 运行环境             | `env.server.ts`         |
