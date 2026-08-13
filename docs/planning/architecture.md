# 架构决策记录

> 记录关键架构决策及其理由。格式: 日期 / 决策 / 背景 / 后果。

## ADR-001: Monorepo + Bun Workspaces

- **日期**: 2026-06
- **决策**: 使用 Bun Workspaces (`packages/*`, `apps/*`) 单仓库管理
- **背景**: 需要共享类型/常量（shared 包）与查询模块（database 包），避免版本碎片
- **理由**: Bun 1.3 原生 workspaces + 快速启动；共享代码零开销引用
- **后果**: 三个 app（web-react/server/scripts）+ 三个 package（database/shared/rettiwt-api）依赖关系清晰

## ADR-002: PostgreSQL JSON 列

- **日期**: 2026-06
- **决策**: `tweets.jsonData` / `users.jsonData` / `ins_posts.jsonData` 存储完整 `EnrichedTweet`/`EnrichedUser`/`IGPost`，结构化列辅助查询
- **背景**: 推文结构复杂多变，纯 EAV 或全结构化列都难以维护
- **理由**: 兼顾查询效率（结构化列：`tweetId`, `fullText`, `createdAt`）和灵活性（完整 JSON），避免 EAV 反模式
- **后果**: 写入时需同时维护结构化列与 JSON 列；索引 `idx_tweets_username_createdat` (复合)、`idx_tweets_createdat`

## ADR-003: URL 驱动状态（State in URL）

- **日期**: 2026-06
- **决策**: 分页/筛选/排序全部在 URL query params 中，前端不直接调 API，只修改 URL
- **背景**: 需要支持书签/分享，且筛选状态需在前后端保持一致
- **理由**: URL 是唯一真值来源 (Source of Truth)；React Router loader 监听 URL 变化自动请求
- **后果**: 状态同步协议 = 初始化(Hydration) → 序列化(Serialization) → 响应式(Reactivity)

## ADR-004: 服务端驱动分页

- **日期**: 2026-06
- **决策**: `PaginatedResponse<T>` 包含 `meta.hasMore`，前端据此控制无限滚动
- **背景**: 客户端猜测"是否还有更多"会出错，需服务端元数据驱动
- **理由**: `meta: { total, page, pageSize, hasMore, nextCursor }` 精确控制列表末尾行为
- **后果**: 无限滚动 + 分页器混合导航，两者互不冲突

## ADR-005: 双层缓存

- **日期**: 2026-06
- **决策**: 服务端 `SimpleLRUCache`（推文计数，容量 1000）+ 客户端 `axios-cache-interceptor`（API 响应）
- **背景**: 归档数据静态不变，重复请求浪费资源
- **理由**: 服务端缓存热点计数，客户端缓存完整响应，双层降低延迟
- **后果**: 数据变更后缓存可能短暂失效；scripts 入库脚本不受影响（直接写库）

## ADR-006: SSR + SPA 混合

- **日期**: 2026-06
- **决策**: React Router v7 (SSR mode)，首屏服务端渲染，后续交互纯客户端
- **背景**: 需要 SEO 友好 + 流畅交互
- **理由**: 首屏 SSR 提供可分享/可索引的初始渲染，SPA 提供无刷新交互
- **后果**: 服务端需处理加载器（loader）数据获取；客户端 Hydration 后接管
- **修订 (2026-08-13, 见 ADR-010)**: 实现为全路由 `clientLoader` + HydrateFallback 骨架屏，
  动态内容由客户端渲染（SPA-first）。本文档"首屏 SSR 渲染内容"的表述**已废弃**，以 ADR-010 为准。

## ADR-007: IG 用户信息并入 users 表

- **日期**: 2026-07
- **决策**: 不建独立 `ins_users` 表，IG 用户信息（`ins_username` + `ins_json_data`）并入 `users` 表
- **背景**: 一个 twitter 用户最多关联一个 IG 账号，独立表造成 join 负担
- **理由**: 单对单关系用列表达更简单；`ins_posts.username` 存 twitter userName 作外键
- **后果**: `mapping.ts` 维护 ins→twitter 映射；`/v3/ins/:name` 通过 `users.ins_json_data` 找 IG 信息

## ADR-008: Nitro 构建 Cloudflare Workers

- **日期**: 2026-06
- **决策**: `apps/server` 用 Nitro v3 构建部署到 Cloudflare Workers
- **背景**: Hono v4 + Drizzle + Neon Postgres (Serverless) 需要 Serverless 部署
- **理由**: Nitro 提供 Workers 友好的构建链；Hono 轻量适配
- **后果**: 部署命令 `bun run deploy`；限流在 Workers 层 (200 req/60s) + 应用层 (hono-rate-limiter)

## ADR-009: Keyset 分页（nextCursor 转正）

- **日期**: 2026-08-13
- **决策**: tweets 系列端点支持 `cursor` 参数做 keyset 续载；`meta.nextCursor` 转正为滚动协议
- **背景**: 原协议声明 `nextCursor` 字段但全仓库零使用，所有分页为 OFFSET；深翻页（page 5000）随页码退化
- **理由**: snowflake id 时间有序（排序键 = `COALESCE(retweeted_original_id, tweetId)`），keyset 零额外索引成本
  （migration 0003 补表达式索引）；无限滚动（流动）与分页器（定位）各用其长
- **后果**: 滚动续载不写 URL（见 Specification §4.1/§4.2 修订）；分页器跳页仍走 offset；
  `ins_posts` 量级小，保持 offset 不引入 keyset（见 `modules/ins.ts` 注释）

## ADR-010: SSR 诚实化（SPA-first + 静态壳）

- **日期**: 2026-08-13
- **决策**: 保持全路由 `clientLoader`（SPA-first），不再宣称"首屏 SSR 渲染内容"
- **背景**: ADR-006 宣称首屏 SSR（SEO 友好），但实现为 `clientLoader` + HydrateFallback，
  首屏是静态壳 + 骨架屏，动态内容由客户端请求渲染，爬虫拿到的是空壳
- **理由**: 迁移 `serverLoader` 需重构全部 loader + 服务端缓存/水合/持久化适配，收益（动态内容 SEO）
  对个人归档项目有限；路由 `meta()` 已覆盖主要 SEO 表面（title/description）
- **后果**: 首屏 = 静态壳 + 骨架屏，内容客户端渲染；URL 驱动状态保证可分享/可书签；
  Specification §6 更新渲染模型表述

## 技术栈总览

| 层 | 技术 |
|---|---|
| 运行时 | Bun 1.3+ (packageManager) |
| 前端 | React 19, React Router v7 (SSR), Tailwind CSS v4, Base UI/COSS, Zustand v5 |
| 后端 | Hono v4, Drizzle ORM, Neon Postgres (Serverless), Nitro v3 |
| 部署 | Vercel (前端) + Cloudflare Workers (API) |
| 测试 | Vitest (50 tests) |
| 质量 | ESLint (@antfu/eslint-config), lefthook (pre-commit) |
