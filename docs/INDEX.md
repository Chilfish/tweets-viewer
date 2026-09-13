# Tweets Viewer 文档索引

> **本文档是项目文档的唯一入口。** AI 和开发者在处理任何任务前，先阅读本文档了解文档全局布局，再根据任务类型按需读取对应的领域文档。规范流程见 [CLAUDE.md](../CLAUDE.md) 的「🔴 强制规范」。

---

## 一、项目概述

Tweets Viewer — 推文归档阅读器：数据来自离线归档（PostgreSQL），前端提供沉浸式无限滚动 + 精确分页的阅读体验。纯只读、无社交交互。

- **在线**: <https://tweet.chilfish.top> ｜ **API**: <https://tweet-api.chilfish.top/v3>
- **框架**: React Router v8（SPA-first + 静态壳）｜ **运行时**: Bun 1.3+
- **仓库**: Bun Workspaces Monorepo（`apps/*` + `packages/*`）
- **后端**: Hono v4 + Drizzle ORM + Neon Postgres（Serverless）+ Nitro v3 → Cloudflare Workers
- **状态**: Zustand v5（client）/ URL 驱动 loader（server）｜ **部署**: Vercel + Cloudflare Workers
- **测试**: Vitest（unit / stories / vrt 三 project）

---

## 二、文档目录结构

```
docs/
├── INDEX.md                # 本文档（唯一入口）
├── Specification.md        # 前端功能规格 — 事实来源 (Source of Truth)
├── ARCHITECTURE.md         # 全局架构（Monorepo / 数据流 / 部署拓扑）
├── API_DOCUMENTATION.md    # REST API 完整说明
├── requirements/           # 需求文档（PRD · 用户故事 · 术语表）
├── planning/               # 规划（architecture ADR · backlog · roadmap）
├── engineering/            # 工程规范（code-style · git-workflow · release-checklist）
├── ui-design/              # UI 设计系统（OVERVIEW + components/GENERAL）
├── unified-sns/            # Unified SNS Viewer 新项目规格（DATA-MODEL · UI-DESIGN · API · RESEARCH · SCAFFOLD）
├── postmortem/             # 尸检报告（历史踩坑沉淀，开写代码前必读）
├── reviews/                # 代码审查记录（review-YYYY-MM-DD-<主题>）
├── development-log/        # 开发日志（按天记录 YYYY-MM-DD.md）
└── archive/                # 已完成阶段的规划文档存档（不主动读取）
```

---

## 三、文档导航 — 什么时候读哪个文档

> **核心原则**：根据任务涉及的代码范围按需读取，不要一次性全读。

| 任务场景 | 必读文档 | 说明 |
| --- | --- | --- |
| **改前端行为 / URL 协议 / 分页** | `Specification.md` | 逻辑行为、领域模型、路由协议的事实来源 |
| **改 API / 加端点** | `API_DOCUMENTATION.md` + `packages/database/schema.ts` | 端点契约、分页/游标协议、错误码 |
| **架构级变更前** | `planning/architecture.md`（ADR-001~010） + `ARCHITECTURE.md` | 先读 ADR 历史决策，再对照架构总览 |
| **规划下一阶段任务** | `planning/backlog.md` | 活跃未决清单（已完成里程碑见 `planning/action-plan.md` / `archive/`） |
| **改 UI 组件 / 页面 / 样式** | `engineering/code-style.md` + `ui-design/OVERVIEW.md` | Token、命名、组件复用、Atom 规范 |
| **改原子组件（Button/Input/…）** | `ui-design/components/GENERAL.md` | Base UI/COSS 组件使用规范 |
| **改数据抓取 / 入库脚本** | `ARCHITECTURE.md` + `apps/scripts` | 数据流、mapping、Fukuoka 为研究脚本不入库 |
| **部署 / 环境配置** | `engineering/release-checklist.md` + `example.env` | Vercel / Workers、环境变量、性能预算 |
| **写码前防复现** | `postmortem/README.md`（+ `TEMPLATE.md`） | 高频雷区自查；新 Bug 模式写 postmortem |
| **每次 commit / PR** | `engineering/git-workflow.md` | 分支模型、Conventional Commits、门禁 |
| **测试 / 视觉回归** | `planning/visual-regression-testing.md` + `engineering/code-style.md#测试规范` | Vitest projects 拆分、VRT 基线管理 |
| **了解历史决策 / 审查** | `reviews/` + `development-log/` + `archive/` | 评审记录、按天开发日志、已完成阶段存档 |

### 按文档类型速查

| 需要什么 | 去哪里 |
| --- | --- |
| 系统架构总览（Monorepo / 数据流） | `ARCHITECTURE.md` |
| 架构决策记录（ADR） | `planning/architecture.md` |
| 未决任务清单（backlog） | `planning/backlog.md` |
| 已完成里程碑 | `planning/action-plan.md` + `archive/` |
| 代码规范（TS/React/Tailwind） | `engineering/code-style.md` |
| Git / Commit / PR 流程 | `engineering/git-workflow.md` |
| 发布前检查 | `engineering/release-checklist.md` |
| 开发日志（按天） | `development-log/README.md` |
| 尸检报告索引 | `postmortem/README.md` |
| 代码审查记录 | `reviews/README.md` |
| 产品需求 / 用户故事 / 术语 | `requirements/` |
| Unified SNS 新项目规格 | `unified-sns/README.md` |

---

## 四、验证与门禁

本仓库无独立 verify 套件，测试即门禁：**Vitest（unit / stories / vrt）按包独立运行**。

| 命令 | 说明 |
| --- | --- |
| `bun run lint:check` | ESLint（`--max-warnings=0`，不改文件） |
| `bun run typecheck` | react-router typegen + tsc（web-react） |
| `bun run test` | 全包 Vitest（shared + database + server + web-react） |
| `bun run test:visual` | VRT 视觉回归（本地 win32 基线对 CI 无效，见 `planning/visual-regression-testing.md`） |
| `bun run build:client` | 前端生产构建 |

`lefthook` pre-push = `lint:check + typecheck + test + build:client`，**禁止 `--no-verify`**。详见 `engineering/git-workflow.md`。

> 已知缺口：`apps/server` / `packages/database` 尚无 `typecheck` 脚本（`packages/rettiwt-api` 为 vendored Fork，历史类型错误未清），当前 `typecheck` 只覆盖 web-react（与 CI 一致）。

---

## 五、常用开发命令

```bash
bun install              # 安装依赖
bun dev                  # 开发（server + client 同时启动）
bun run build:client     # 前端构建
bun run deploy           # API 部署到 Cloudflare Workers
bun run lint             # ESLint --fix
bun run lint:check       # ESLint --max-warnings=0
bun run typecheck        # 类型检查
bun run test             # 全包测试
bun run test:visual      # 视觉回归
```

---

## 六、文档体系约定（流程与反馈闭环）

> 文档按「规格 → 规划 → 工程 → 反馈」组织，历史教训固化为规则，防止同类问题复现。

### 文档生命周期

```
规格事实源   docs/Specification.md · API_DOCUMENTATION.md · ARCHITECTURE.md
需求         docs/requirements/（PRD · user-stories · glossary）
规划         docs/planning/（architecture ADR · backlog · roadmap）
工程规范     docs/engineering/（code-style · git-workflow · release-checklist）
UI 设计      docs/ui-design/（OVERVIEW · components/GENERAL）
反馈闭环     docs/postmortem/ · docs/reviews/ · docs/development-log/
存档         docs/archive/（git mv 已完成阶段计划，不主动读取）
```

### 何时写入（养成机制）

| 事件 | 动作 |
| --- | --- |
| 功能行为变更 | 先改 `Specification.md`，再动代码 |
| API 变更 | 同步 `API_DOCUMENTATION.md` |
| 架构级决策 | 记录 ADR 到 `planning/architecture.md` |
| 新 Bug 模式 | 写 `postmortem/0NN-*.md`（模板 `TEMPLATE.md`），预防项同步 `CLAUDE.md` |
| 每次代码审查 | 记录到 `reviews/review-YYYY-MM-DD-<主题>.md` |
| 每天收尾 | 记入 `development-log/YYYY-MM-DD.md` |
| 阶段计划完成 | 计划文档 `git mv` 到 `archive/` |
| 里程碑发布 | 走 `engineering/release-checklist.md` |

### 文档语言

所有文档用中文（根级 `README` / `CHANGELOG` / `CONTRIBUTING` / `LICENSE` 用英文例外）。

---

## 七、根目录文档

| 文档 | 说明 |
| --- | --- |
| [../README.md](../README.md) | 项目介绍、技术栈、快速开始 |
| [../CHANGELOG.md](../CHANGELOG.md) | 变更日志 |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南 |
| [../SECURITY.md](../SECURITY.md) | 安全政策与漏洞报告渠道 |
| [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | 行为准则（Contributor Covenant 2.1） |
