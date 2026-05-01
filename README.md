# Tweets Viewer

一个“推文归档阅读器”：数据来自离线归档（数据库/静态 JSON），前端提供沉浸式无限滚动 + 精确分页的阅读体验。

- 在线地址：`https://tweet.chilfish.top`
- API 基址（生产）：`https://tweet-api.chilfish.top/v3`

> **📘 开发指南（必读）**：本项目遵循 **规格驱动开发 (SDD)**。开始改代码前请先读：
>
> 1. `./docs/SKILLS/README.md`（架构九条宪法/技术栈约束）
> 2. `./docs/Specification.md`（功能规格：URL 作为事实来源、分页/筛选行为等）

## 仓库结构（Monorepo）

- `apps/web-react`：前端（React Router v7 + Tailwind + shadcn/ui + Zustand/Jotai）
- `apps/server`：API（Cloudflare Workers + Hono + Drizzle + Neon Postgres）
- `apps/scripts`：归档脚本（抓取/合并/写入数据库）
- `packages/database`：数据库 schema + 查询/写入模块（Drizzle）
- `packages/rettiwt-api`：推文抓取/数据 enrich（内部库，供 scripts 使用）
- `packages/shared`：共享常量、类型、工具

## 开发环境（本地）

### 1) 安装依赖

项目使用 `bun`（见根目录 `package.json#packageManager`）。

```bash
bun install
```

### 2) 配置环境变量

服务端/脚本用到（至少）：

- `DATABASE_URL`：Neon/Postgres 连接串
- `TWEET_KEYS`：逗号分隔的抓取 key 列表（仅 `apps/scripts` 抓取用）

参考：`./example.env`（建议复制为根目录 `./.env`）。

### 3) 启动开发服务

同时启动 API + 前端：

```bash
bun dev
```

或分别启动：

```bash
bun run dev:server
bun run dev:client
```

## API 概览

详细接口：`./docs/API_DOCUMENTATION.md`

- `GET /v3/users/all`
- `GET /v3/users/get/:name`
- `GET /v3/tweets/get/:name`（支持 `page/pageSize/reverse/start/end/noReplies`）
- `GET /v3/tweets/medias/:name`
- `GET /v3/tweets/search`（`q` 必填，`name` 可选）
- `GET /v3/tweets/get/:name/last-years-today`

## 归档/同步数据（scripts）

`apps/scripts` 提供抓取与入库能力（依赖 `DATABASE_URL`、`TWEET_KEYS`）。

- 抓取 timeline（带自动重试的 PowerShell 调度）：`./apps/scripts/fetch.ps1`
- 直接入库示例：`./apps/scripts/src/insertToDB.ts`
- 每日增量同步示例：`./apps/scripts/src/dailyUpdate.ts`

> 注意：本项目的前端是“读库/读静态”的，展示体验优先；抓取与归档属于离线任务，建议独立运行。

## 文档索引

- `./docs/README.md`（文档入口）
- `./docs/ARCHITECTURE.md`（全局架构：Monorepo 结构、数据流、部署拓扑）
- `./docs/Specification.md`（前端功能规格：事实来源）
- `./docs/SKILLS/README.md`（SDD 规范与架构约束）
- `./docs/API_DOCUMENTATION.md`（API 接口文档）
- `./docs/ui-design/OVERVIEW.md`（UI/交互准则）
