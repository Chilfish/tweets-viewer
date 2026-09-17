# Tweets Viewer

一个「推文归档阅读器」：数据来自离线归档（PostgreSQL），前端提供沉浸式无限滚动 + 精确分页的阅读体验。纯只读，无社交交互。

线上实例：<https://tweet.chilfish.top> ｜ API 基址：<https://tweet-api.chilfish.top/v3>

## 功能

- **时间线**：无限滚动（keyset 续载）+ 分页器混合导航，支持排序、日期范围、排除回复
- **媒体墙**：图片/视频网格浏览
- **搜索**：关键词检索，可按用户限定或全库
- **那年今日**：`/memo` 单用户或全量（按年分组）回顾历史同天内容
- **Instagram**：`/ins/:name` 浏览归档用户的 IG 帖子
- **PWA**：可安装到桌面
- **分享**：推文分享按钮为指向原推文的链接，普通点击渐进增强为 Web Share，降级新标签打开

## 技术栈

- **框架**：React Router v8（SPA-first + 静态壳）
- **运行时**：Bun 1.3+，TypeScript
- **仓库**：Bun Workspaces Monorepo
- **数据源**：Twitter/X 归档（`packages/rettiwt-api` 内部 Fork）、Instagram 归档
- **后端**：Hono v4 + Drizzle ORM + Neon Postgres（Serverless），Nitro v3 → Cloudflare Workers
- **UI**：Tailwind CSS v4、Base UI/COSS、Lucide
- **状态**：Zustand（客户端持久化）、URL 驱动 loader（服务端数据）
- **部署**：Vercel（前端）+ Cloudflare Workers（API）
- **测试**：Vitest（unit / stories / vrt）

## 仓库结构

```
apps/
├── web-react/   # 前端（React Router v8 + Tailwind v4 + Zustand）
├── server/      # API（Hono v4 + Drizzle，部署到 Cloudflare Workers）
└── scripts/     # 离线归档脚本（抓取 / 合并 / 入库）
packages/
├── database/    # Drizzle schema + 查询/写入模块
├── rettiwt-api/ # Twitter API 客户端（内部 Fork）
└── shared/      # 共享常量、类型、工具
docs/            # 文档入口：docs/INDEX.md
```

## 快速开始

环境要求：Bun 1.3 以上（仓库 `packageManager` 为 `bun@1.3.14`）。

```bash
git clone https://github.com/Chilfish/tweets-viewer.git
cd tweets-viewer
bun install
```

### 配置

把 `example.env` 复制成根目录 `.env`，按需修改：

```env
DATABASE_URL="postgresql://..."   # Neon / Postgres 连接串
TWEET_KEYS=""                     # 逗号分隔的抓取 key 列表（仅抓取脚本用）
INSTAGRAM_COOKIES=""              # Instagram 登录 Cookie（仅 IG 抓取用）
API_URL="https://tweet-api.chilfish.top"  # 前端 API 基址（经 vite 注入 bundle）
ENVIRONMENT="development"         # development / production
```

变量由根级 `env.server.ts` 用 Zod 校验，敏感凭据只走 `.env`，不要提交到仓库。

### 启动

```bash
bun dev              # 同时启动 API (localhost:3000) + 前端 (localhost:9080)
```

或分别启动：

```bash
bun run dev:server
bun run dev:client
```

### 数据库（可选）

前端只读依赖已有归档数据。若要自己抓取入库：

```bash
bun --cwd packages/database db:push       # 推送 schema（原型阶段）
bun --cwd packages/database db:generate   # 或生成迁移文件
bun --cwd packages/database db:migrate
```

> `schema.ts` 声明了全部查询索引，因此 `db:push` 不会删除它们；生产库变更优先走 `db:migrate`（迁移文件带 `--> statement-breakpoint`）。

## 归档 / 同步数据（scripts）

`apps/scripts` 提供抓取与入库能力（依赖 `DATABASE_URL`、`TWEET_KEYS`、`INSTAGRAM_COOKIES`）。

| 脚本                                                           | 用途                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| `dailyUpdate.ts`                                               | 每日增量同步（Twitter + IG），由 GitHub Actions cron 调用     |
| `fetch-tweet-daily.ts` / `fetchTimeline.ts` / `fetchSearch.ts` | 推文增量抓取                                                  |
| `fetch-ins-daily.ts`                                           | 从 users 表读取已关联 IG 的用户，抓取最新帖子入库             |
| `insertToDB.ts` / `mergeData.ts` / `import-ins-data.ts`        | 本地 JSON 批量入库 / 合并                                     |
| `mapping.ts`                                                   | IG username → twitter username 映射表（导入 IG 前必须有映射） |

> `fukuoka/` 与 `fetchSearchFukuoka.ts` 是研究脚本，**不入库**。

## 部署

- **前端（Vercel）**：push `main` 自动部署；`bun run build:client` 构建
- **API（Cloudflare Workers）**：`bun run deploy`（Nitro 构建后 `nitro deploy --prebuilt`），需配置 `wrangler.json` 的 `DATABASE_URL` / `TWEET_KEYS` / 限流器

发布前检查见 [`docs/engineering/release-checklist.md`](docs/engineering/release-checklist.md)。

## API 概览

详细接口见 [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)：

- `GET /v3/users/all` · `GET /v3/users/get/:name`
- `GET /v3/tweets/get/:name`（`page` / `pageSize` / `cursor` / `reverse` / `start` / `end` / `noReplies`）
- `GET /v3/tweets/medias/:name`
- `GET /v3/tweets/search?q=&name?`
- `GET /v3/tweets/get/:name/last-years-today` · `GET /v3/tweets/last-years-today`
- `GET /v3/tweets/stats/:name`
- `GET /v3/ins/:name`
- `GET /v3/image/get`（随机归档图片，可选 `name` 按用户）

## 常用命令

```bash
bun dev                  # 开发（server + client）
bun run build:client     # 前端构建
bun run deploy           # API 部署
bun run lint             # ESLint --fix
bun run lint:check       # ESLint --max-warnings=0
bun run typecheck        # 类型检查
bun run test             # 全包测试
bun run test:visual      # 视觉回归
```

## 文档

项目文档唯一入口：[`docs/INDEX.md`](docs/INDEX.md)（规格 / 架构 / API / 需求 / 规划 / 工程规范 / 尸检报告）。

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。提交前请确保 `bun run lint:check && bun run typecheck && bun run test` 通过。

## License

私有项目（`private: true`）。
