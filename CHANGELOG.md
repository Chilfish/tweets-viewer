# Changelog

All notable changes to Tweets Viewer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [Unreleased]

### 工程（2026-11-19）

- **Removed** CI 的 `visual` job（VRT 像素门禁）与 `.github/workflows/update-screenshots.yml` 基线生成 workflow；VRT 收缩为本地可选检查 `bun run test:visual`
- **Changed** 视觉回归基线不再入库：`.gitignore` 忽略 `**/__screenshots__/`，删除已提交的 24 张 linux 基线

### 数据层（2026-11-19）

- **Changed** Twitter 抓取运行时从内部 Fork 切到 `@chilfish/tweet@0.2.0`；归档 JSON 仍是 snake_case，DB / server / web-react 不变
- **Added** `apps/scripts/src/lib/tweet.ts`：`TWEET_KEYS` fail-fast 校验 + SDK camelCase → 归档 snake_case 递归映射
- **Changed** 每日抓取错误分类改用 `AuthError` / `RateLimitError`；Bun 代理走 `RettiwtPool({ proxy })` 原生 `fetch`
- **Fixed** 新入库推文的 `retweet_count` 改取真实转推数（旧 Fork 误取 `quote_count`）；存量数据无 raw 无法回填
- **Added** `apps/scripts` Vitest 工程与 mapper 单测，接入根 `test` 链路
- **Removed** `packages/rettiwt-api`（vendored Fork）；归档类型收敛到新包 `packages/tweet-types`（纯类型）
- **Changed** 所有包改为从 `@tweets-viewer/tweet-types` type-only 引用；`ITweetFilter` 从 `@chilfish/tweet` 导入
- **Changed** `apps/scripts/src/common.ts` 的 `RettiwtPool` 支持 `TWEET_PROXY`

### 工程规范对标（2026-09-13）

- **Added** `docs/INDEX.md`（文档唯一入口）、`docs/reviews/`、`docs/requirements/README.md`、`docs/planning/backlog.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`、`docs/engineering/release-checklist.md`（原 deploy-checklist 更名）
- **Added** postmortem 005（宿主 `NODE_ENV=production` 泄漏进 Vitest / 脚本内联赋值失效）+ 高频雷区「构建与测试环境」
- **Changed** 文档与门禁对标参考项目：`CLAUDE.md` 重写、`engineering/code-style.md` 与 `git-workflow.md` 重写、PR 模板 / CONTRIBUTING / README 修正事实（React Router v8、路由、命令、路径）
- **Changed** 各包 `test` / `dev` / `build` 脚本经 `cross-env` 固定 `NODE_ENV`；根新增 `lint:check` / `typecheck` / `test` / `test:visual` 聚合脚本
- **Changed** `lefthook.yml` pre-push 升级为真实门禁（`lint:check + typecheck + test + build:client`）；eslint 启用 `test/expect-expect` / `no-conditional-expect` / `no-standalone-expect`，忽略 `.commandcode/**`
- **Fixed** `@vitest/browser-playwright` 缺失导致 web-react Vitest 配置加载失败；NODE_ENV 泄漏导致 22 个组件测试假红

### 体验与数据

- **Added** `fetchSearchFukuoka.ts` — Fukuoka 归档关键词抓取（`福岡公演`），支持游标循环多页
- **Added** `apps/scripts/src/fukuoka/` — 数据处理模块（fetch / members / simplify）
- **Added** DateRangeFilter 并入推文工具栏（草稿模式 + 显式应用）
- **Changed** Calendar 迁移到 @daypicker/react v10
- **Fixed** 服务端接受 date-only 值（`2023-01-01`）作为日期范围

### 工程与流程

- **Changed** CLAUDE.md 弃用 AGENTS.md（符号链接），改为真实普通文件，新增强制规范
- **Added** 完整文档体系对标 Float：ADR / 开发日志 / postmortem / 工程规范（Git Workflow / Code Style / Deploy Checklist）

## [0.0.0] - 初始

- 推文归档阅读器基础：时间线、媒体墙、搜索、那年今日
- IG 归档整合：`/v3/ins/*` + `ins_posts` 表 + 每日同步
- Monorepo（Bun Workspaces）：web-react / server / scripts + database / shared / rettiwt-api

---

[Unreleased]: https://github.com/Chilfish/tweets-viewer/compare/main...HEAD
