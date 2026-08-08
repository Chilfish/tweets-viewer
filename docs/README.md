# Tweets Viewer 文档索引

> **AI 指令**：在进行任何代码生成、架构设计或逻辑重构之前，请务必阅读以下文档。完整流程规范见 [工程规范](#工程规范-engineering)。

## 需求（requirements/）

| 文档 | 说明 |
|---|---|
| [PRD](requirements/PRD.md) | 产品需求文档 — 愿景、用户画像、功能需求、非功能需求、成功指标 |
| [User Stories](requirements/user-stories.md) | 用户故事 — 按角色、场景、验收标准组织 |
| [Glossary](requirements/glossary.md) | 术语表 — 业务/产品/技术术语定义 |

## 核心规格（docs/ 根）

| 文档 | 说明 |
|---|---|
| [功能规格说明书 (Specification)](./Specification.md) | **事实来源 (Source of Truth)** — 逻辑行为、领域模型、URL 路由协议 |
| [架构总览 (Architecture)](./ARCHITECTURE.md) | Monorepo 结构、数据流向、依赖关系、部署拓扑 |
| [API 接口文档](./API_DOCUMENTATION.md) | REST API 完整说明：`/v3/tweets/*`, `/v3/users/*`, `/v3/image/*`, `/v3/ins/*` |
| [UI 设计系统](./ui-design/OVERVIEW.md) | Apple 风格 Glass 材质、圣杯布局、响应式断点、组件规范索引 |

## 规划（planning/）

| 文档 | 说明 |
|---|---|
| [架构决策记录 (ADR)](planning/architecture.md) | 关键技术决策及理由 — URL 驱动状态 / JSON 列 / SSR 混合 等 |
| [行动计划 (Action Plan)](planning/action-plan.md) | 整体行动计划与当前阶段状态 |

## 工程规范（engineering/）

| 文档 | 说明 |
|---|---|
| [Code Style](engineering/code-style.md) | TypeScript/React/Tailwind 代码规范、命名约定、ESLint 规则 |
| [Git Workflow](engineering/git-workflow.md) | 分支模型、Commit 规范 (Conventional Commits)、PR 流程、审查清单 |
| [部署清单 (Deploy Checklist)](engineering/deploy-checklist.md) | 前端 Vercel + API Cloudflare Workers 发布前检查项 |

## 项目记录

| 文档 | 说明 |
|---|---|
| [开发日志](development-log/README.md) | 开发日志（按天记录） |
| [Postmortem](postmortem/README.md) | 尸检报告索引 — 历史踩坑沉淀，开写代码前必读 |

## 存档（archive/）

| 文档 | 说明 |
|---|---|
| [存档说明](archive/README.md) | 已完成阶段的规划文档归档于此，**仅供历史查阅，不再主动读取** |

## 约定

- 所有文档使用中文（README, CHANGELOG, CONTRIBUTING 除外）
- 功能行为变更 → 先更新 `Specification.md` 再动代码
- API 变更 → 同步更新 `API_DOCUMENTATION.md`
- 架构决策 → 记录到 `planning/architecture.md` (ADR)
- 开发日志按天记录在 `development-log/`（新的一天新建 `YYYY-MM-DD.md`）
- 踩坑 → 沉淀到 `postmortem/`，写码前先读
- **阶段完成的规划文档移入 `archive/`**：存档 = 历史记录，不主动读取；活跃文档只留 `planning/` 与根目录
