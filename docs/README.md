# Tweets Viewer Documentation Index

> **AI 指令 (AI Agent Instructions)**：
> 在进行任何代码生成、架构设计或逻辑重构之前，请务必阅读以下文档。
>
> 1. 首先阅读 [SKILLS/README.md](./SKILLS/README.md) 获取开发规范。
> 2. 其次阅读 [Specification.md](./Specification.md) 了解业务逻辑与交互规格。
> 3. 如需理解整体数据流与子系统关系，阅读 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 核心文档汇总

### 1. [架构总览 (Architecture)](./ARCHITECTURE.md)

Monorepo 结构、数据流向、依赖关系图、部署拓扑。覆盖全部 3 个应用（web-react, server, scripts）和 3 个共享包（database, shared, rettiwt-api）。

### 2. [开发规范 (AI Skills)](./SKILLS/README.md)

包含项目的"架构九条宪法"、技术栈约束（React 19, Zustand, Jotai, Tailwind CSS v4, shadcn/ui, Bun）以及 SDD (规格驱动开发) 的核心原则。**这是 AI 编写代码的首要参考标准。**

### 3. [功能规格说明书 (Functional Specification)](./Specification.md)

定义了系统的逻辑行为、领域模型（User Context, Tweet Stream, Filters）、URL 路由协议以及功能行为。这是系统行为的**事实来源 (Source of Truth)**。

### 4. [API 接口文档](./API_DOCUMENTATION.md)

REST API 完整说明：`/v3/tweets/*`, `/v3/users/*`, `/v3/image/*`, `/v3/ins/*`。通用 `PaginatedResponse<T>` 格式、查询参数、错误响应。

### 5. [状态管理规范](./SKILLS/zustand-state-management.md)

Zustand 最佳实践：Hydration 注意事项、Selector 精准订阅、`persist` 中间件陷阱、Zustand v4→v5 迁移指南。

### 6. [UI 设计系统](./ui-design/OVERVIEW.md)

Apple 风格 Glass 材质、圣杯布局、响应式断点、Base UI data-attribute 驱动样式、组件规范索引。

---

## 快速导航

- **技术栈**：Bun 1.3, React 19, React Router v7 (SSR), Tailwind CSS v4, shadcn/ui, Zustand v5, Jotai v2, Hono v4, Drizzle ORM, Cloudflare Workers, Neon Postgres
- **架构准则**：强制单一职责 (SRP)、重构优先、禁止过度设计
- **逻辑核心**：服务端驱动分页、混合导航模式（无限滚动 + 分页器）、URL 驱动状态
- **部署**：前端 Vercel (`tweet.chilfish.top`)，API Cloudflare Workers (`tweet-api.chilfish.top`)
