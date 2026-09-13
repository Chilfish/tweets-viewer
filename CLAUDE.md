# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Tweets Viewer — 推文归档阅读器：数据来自离线归档（PostgreSQL），前端提供沉浸式无限滚动 + 精确分页的阅读体验。纯只读、无社交交互。

## Project Context

- **Online**: <https://tweet.chilfish.top> ｜ **API**: <https://tweet-api.chilfish.top/v3>
- **框架**: React Router v8（SPA-first + 静态壳，`clientLoader`，见 ADR-010）
- **运行时**: Bun 1.3+（`packageManager: bun@1.3.14`）
- **仓库**: Bun Workspaces Monorepo（`apps/*` + `packages/*`）
- **后端**: Hono v4 + Drizzle ORM + Neon Postgres（Serverless）+ Nitro v3 → Cloudflare Workers
- **数据源**: Twitter/X 归档（`packages/rettiwt-api` 内部 Fork）+ Instagram 归档
- **前端状态**: Zustand v5（persist）｜ **服务端状态**: URL 驱动 loader + `axios-cache-interceptor`
- **UI**: Tailwind CSS v4 + Base UI/COSS + Lucide React
- **部署**: Vercel（前端）+ Cloudflare Workers（API）
- **测试**: Vitest（unit / stories / vrt 三 project，按包独立运行）
- **VCS**: GitHub（`Chilfish/tweets-viewer`），Conventional Commits

## Essential Commands

```bash
# 开发
bun dev              # 同时启动 server + client
bun dev:server       # 仅 API (http://localhost:3000)
bun dev:client       # 仅前端 (http://localhost:9080)

# 构建与部署
bun run build:client # 前端构建（Vercel 部署前）
bun run deploy       # API 部署到 Cloudflare Workers

# 质量门禁（pre-push 同款，提交前本地先过）
bun run lint         # ESLint --fix
bun run lint:check   # ESLint --max-warnings=0（门禁用，不改文件）
bun run typecheck    # react-router typegen + tsc（web-react）
bun run test         # 全包 Vitest（shared + database + server + web-react）
bun run test:visual  # VRT 视觉回归（本地 win32 基线不进门禁，见下）

# 单包测试（调试时）
bun --cwd packages/shared test
bun --cwd apps/web-react test
```

> `bun run` 脚本内的 `NODE_ENV` 一律经 `cross-env` 固定（`test`/`dev`/`build`），
> 避免宿主环境的 `NODE_ENV=production` 泄漏进 Vitest（React 会加载 production 构建 → `React.act` 缺失），
> 以及 dev server 变生产模式。见 postmortem 005。

## 仓库结构 (Bun Workspaces)

```
tweets-viewer/
├── apps/
│   ├── web-react/        # 前端 React Router v8（SPA-first）+ Tailwind v4 + Base UI/COSS + Zustand
│   ├── server/           # API Hono v4 + Drizzle + Cloudflare Workers (Nitro)
│   └── scripts/          # 离线归档脚本（抓取/合并/入库；fukuoka/ 为不入库的研究脚本）
├── packages/
│   ├── database/         # Drizzle ORM Schema + 查询/写入模块
│   ├── rettiwt-api/      # Twitter API 客户端（内部 Fork，vendored，lint 豁免）
│   └── shared/           # 共享常量、类型、工具（date/group 纯函数）
├── docs/                 # 文档入口：docs/INDEX.md（规格 / 架构 / 工程规范 / 踩坑）
└── env.server.ts         # 服务端环境变量 Zod 验证（根级单源）
```

## 架构核心

### 数据流

```
Twitter API → apps/scripts（抓取） → Neon PostgreSQL → apps/server（Hono API） → apps/web-react
```

### 关键设计决策（完整 ADR 见 `docs/planning/architecture.md`）

1. **URL 驱动状态**：分页/筛选/排序全部在 URL query params 中，前端不直接调 API，只修改 URL；React Router loader 监听 URL 变化自动请求
2. **服务端驱动分页**：`PaginatedResponse<T>` 的 `meta.hasMore` 控制无限滚动；滚动续载走 keyset 游标（`meta.nextCursor`），分页器跳页走 offset `page`
3. **PostgreSQL JSON 列**：`tweets.jsonData` / `users.jsonData` / `ins_posts.jsonData` 存完整 `EnrichedTweet` / `EnrichedUser` / `IGPost`，结构化列（`tweetId` / `fullText` / `createdAt`）辅助查询
4. **双层缓存**：服务端 `SimpleLRUCache`（推文计数）+ 客户端 `axios-cache-interceptor`（API 响应）
5. **SPA-first + 静态壳**：全路由 `clientLoader` + HydrateFallback 骨架屏，动态内容客户端渲染（ADR-010，不承诺首屏 SSR 内容）

### 数据库 Schema（`packages/database/schema.ts`）

```
users:     id(serial PK), restId, userName(UQ), jsonData(json), daily_fetch(bool),
           ins_username(UQ, nullable), ins_json_data(json, nullable)
tweets:    id(serial PK), tweetId(UQ), userName(FK→users.userName), fullText, createdAt, jsonData(json)
ins_posts: id(serial PK), post_id(UQ), username(FK→users.userName), created_at, jsonData(json)
```

- 索引：`idx_tweets_username_createdat`（复合）+ `idx_tweets_createdat`（单列）+ keyset 表达式索引
- IG 用户信息并入 `users` 表，不再有独立 `ins_users`；`ins_posts.username` 存的是 **twitter userName**，IG → twitter 映射维护在 `apps/scripts/src/mapping.ts`

### API 路由（`apps/server/routes/`，详情见 `docs/API_DOCUMENTATION.md`）

| 端点                                            | 说明                                                |
| ----------------------------------------------- | --------------------------------------------------- |
| `GET /v3/tweets/get/:name`                      | 用户推文列表（分页 / 日期范围 / 排除回复 / cursor） |
| `GET /v3/tweets/medias/:name`                   | 用户媒体推文（排除转推）                            |
| `GET /v3/tweets/search?q=&name?`                | 关键词搜索（`name` 可选 = 全库）                    |
| `GET /v3/tweets/get/:name/last-years-today`     | 单用户"那年今日"                                    |
| `GET /v3/tweets/last-years-today`               | 全量"那年今日"（无 `name`，排除转推）               |
| `GET /v3/tweets/stats/:name`                    | 归档统计（年份/计数）                               |
| `GET /v3/users/all` · `GET /v3/users/get/:name` | 用户列表 / 单个用户                                 |
| `GET /v3/ins/:name`                             | IG 用户信息 + 帖子（分页）                          |
| `GET /v3/image/*`                               | 媒体代理                                            |

> 交互式文档：`GET /openapi.json`（OpenAPI 3.1）+ `GET /scalar`（Scalar UI），生产可访问；元数据在 `routes/*.ts` 的 `describeRoute`、复用 schema 在 `apps/server/utils/openapi.ts`。

### 前端路由（`apps/web-react/app/routes.ts`）

| URL              | 视图                                       |
| ---------------- | ------------------------------------------ |
| `/`              | 首页（Hero + 归档用户入口 + 那年今日入口） |
| `/tweets/:name`  | 主时间线（无限滚动 + 分页器）              |
| `/media/:name`   | 媒体墙（图片/视频网格）                    |
| `/search/:name?` | 搜索视图（`name` 缺省 = 全库）             |
| `/memo/:name?`   | 那年今日（`name` 缺省 = 全量，按年分组）   |
| `/ins/:name`     | Instagram 帖子浏览                         |

### Scripts（`apps/scripts/src/`）

| 文件                                                           | 用途                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| `dailyUpdate.ts`                                               | 每日增量同步（Twitter + IG），GitHub Actions cron 调用 |
| `fetch-ins-daily.ts`                                           | 从 users 表读取已关联 IG 的用户，抓取最新帖子入库      |
| `fetch-tweet-daily.ts` / `fetchTimeline.ts` / `fetchSearch.ts` | 推文增量抓取                                           |
| `insertToDB.ts` / `mergeData.ts` / `import-ins-data.ts`        | 本地 JSON 批量入库 / 合并                              |
| `mapping.ts`                                                   | IG username → twitter username 映射表                  |
| `fukuoka/` + `fetchSearchFukuoka.ts`                           | 研究脚本，**不入库**                                   |

### 环境变量（`env.server.ts` 单源 Zod 校验）

| 变量                | 用途                                             |
| ------------------- | ------------------------------------------------ |
| `DATABASE_URL`      | Neon Postgres 连接串                             |
| `TWEET_KEYS`        | 逗号分隔的抓取 key 列表（仅抓取脚本用）          |
| `INSTAGRAM_COOKIES` | Instagram 登录 Cookie（仅 IG 抓取用）            |
| `API_URL`           | 前端 API 基址（经 `vite.config.ts` 注入 bundle） |
| `ENVIRONMENT`       | 运行环境（`development` / `production`）         |

参考 `example.env`，复制为根目录 `.env`。敏感凭据只走 `.env` + `env.server.ts`，绝不硬编码。

## Key Conventions

- **规格驱动（SDD）**：功能行为变更先改 `docs/Specification.md`（事实来源），API 变更同步 `docs/API_DOCUMENTATION.md`，再动代码
- **URL 是唯一状态源**：组件只改 URL，不手动调 API；筛选/分页全走 query params
- **纯函数下沉**：分组/分页状态机/日期/媒体 hash 等逻辑放 `app/lib/` 并单测（参考 `app/lib/__tests__/`）
- **组件优先复用**：`~/components/ui/` 下的 Base UI/COSS 组件，不手写 div 模拟
- **导入路径**：用 `~/` 前缀，不用 `@/`
- **样式**：Tailwind v4 语义 token（`bg-background` / `text-muted-foreground` 等），禁止硬编码颜色；`cn()` 合并类名；全组件兼容 `.dark`
- **Zustand**：`create<T>()()` 双括号；用 selector 订阅 + `useShallow`；`persist` store 用 `_hasHydrated` 防 SSR mismatch
- **类型安全**：`catch` 用 `unknown` + `instanceof Error`，禁用 `catch (error: any)`
- **IG→twitter 映射**：`ins_posts.username` 存 twitter userName，导入前确认 `mapping.ts` 存在映射

### 🔴 强制规范（必须遵循）

1. **先写 commit message 再写代码**（详见 `docs/engineering/git-workflow.md#commit-纪律`）。每个 commit 是单一关注点的原子提交，避免"上帝 commit"；diff >10 文件或 >200 行时必须拆分。

2. **文档先行（docs-first）**：每个任务第一步先更新相关文档（开发日志 `docs/development-log/README.md`、任务状态 `docs/planning/backlog.md`、方案文档），再开始写代码；实施中随实际反馈同步修改文档，而非事后补记。阶段完成的规划文档 `git mv` 进 `docs/archive/`——**历史记录，不主动读取**。

3. **规格驱动（SDD）**：功能行为变更必须先更新 `docs/Specification.md`（事实来源），API 变更同步 `docs/API_DOCUMENTATION.md`；架构级决策记录到 `docs/planning/architecture.md`（ADR）。

4. **开写代码前先读尸检报告**（`docs/postmortem/README.md`）：本仓库历史踩坑沉淀于此，写码/重构前对照「高频雷区」自查。遇到新的返工/事故按 `docs/postmortem/TEMPLATE.md` 沉淀一条 postmortem。

5. **测试先行 + 门禁全绿**：新增纯函数 / 查询模块先写 Vitest 测试再实现；`NODE_ENV` 一律走 `cross-env` 固定，禁止依赖宿主环境（见 postmortem 005）。**每次 commit 前本地跑 `bun run lint:check && bun run typecheck && bun run test`**，pre-push 门禁另跑 `bun run build:client`；**禁止 `--no-verify` 绕过**，不要等钩子/CI 才发现违规。

6. **只读性**：系统不提供任何写入功能（发推/点赞/关注），数据全部来自离线归档。

## Current State

**Phase 1~4 全部完成**：基础阅读器 → IG 归档整合 → 体验打磨与数据补全 → 地基/架构一致/产品纵深（pg_trgm 全文索引、keyset 分页转正、统一分页流 hook、SSR 诚实化、时间导航、全局搜索、PWA）。

**Phase 5 — UI/UX 打磨（Apple 原生感 × 状态/路由切换流畅感）**：✅ 已完成（token 去重、View Transitions 文档级过渡、列表四态统一 `FeedStatus`、按压反馈、触控目标 ≥44px、日期分隔线、媒体 blur-up + 灯箱手势等）。

**Phase 6 — 测试纵深 / 数据洞察 / 阅读新体验**：❌ 已废弃（2026-09-08 定调不做了）。

**近期增量**：全量"那年今日"`/memo`（无用户模式，按年分组 + 组内时间平铺，排除转推）；推文分享按钮改为「净化后的链接 + Web Share API」（右键/修饰键保留原生链接行为）。

**2026-09-13 — 工程规范对标**：文档体系与门禁对齐参考项目——`docs/INDEX.md` 唯一入口、工程规范（code-style / git-workflow / release-checklist）、`docs/reviews`、`docs/planning/backlog.md`、SECURITY / CODE_OF_CONDUCT、PR 模板；约束层补齐 `cross-env` NODE_ENV 固定、`bun run test`/`typecheck` 聚合脚本、pre-push 真实门禁（lint + typecheck + test + build）。

## GitHub CLI Flow

```bash
gh issue list --state open                            # 查看活跃任务
gh pr create --title "feat(scope): ..." --body "..."  # 开 PR
gh pr checks <N>                                      # 验证 CI
gh pr merge <N> --merge --delete-branch               # Create a Merge Commit
```

## Git Hooks（`lefthook.yml`）

- `pre-commit`：ESLint autofix（staged files，`stage_fixed`）
- `pre-push`：真实门禁 — `lint:check + typecheck + test + build:client`，全绿才放行

## 文档索引

完整文档体系见 [docs/INDEX.md](docs/INDEX.md)：

- 核心规格（`docs/` 根）— `Specification.md`（事实来源）/ `ARCHITECTURE.md` / `API_DOCUMENTATION.md`
- 需求（`docs/requirements/`）— PRD / 用户故事 / 术语表
- 规划（`docs/planning/`）— ADR / backlog / roadmap
- 工程规范（`docs/engineering/`）— code-style / git-workflow / release-checklist
- UI 设计（`docs/ui-design/`）— 设计系统总览 + 组件规范
- 开发日志（`docs/development-log/`）— 按天记录
- 尸检报告（`docs/postmortem/`）— 踩坑沉淀，开写代码前必读
- 代码审查（`docs/reviews/`）— review-YYYY-MM-DD-<主题>
- 存档（`docs/archive/`）— 历史记录，不主动读取
