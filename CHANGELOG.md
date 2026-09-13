# Changelog

All notable changes to Tweets Viewer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [Unreleased]

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
