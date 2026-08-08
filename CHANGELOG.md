# Changelog

All notable changes to Tweets Viewer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [Unreleased]

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
