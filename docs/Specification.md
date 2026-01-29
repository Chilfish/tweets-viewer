# Frontend Functional Specification: Tweets Viewer

> **文档性质**：本文档是 Tweets Viewer 前端系统的**功能规格说明书 (Functional Spec)** 。它定义了系统的逻辑行为、数据流转规则和用户交互标准，与具体的技术选型无关。

## 1. 系统定义 (System Definition)

**Tweets Viewer** 是一个**归档导向**的推特内容浏览终端。它不直接连接 Twitter 实时流，而是作为一个**静态数据的动态阅读器**。

### 核心原则

1. **只读性 (Read-Only)** : 系统不提供任何写入（发推、点赞、关注）功能。
2. **流动性 (Fluidity)** : 尽管数据是静态归档，但浏览体验必须是连续的、无缝的流式体验。
3. **用户隔离 (User-Isolated)** : 系统的上下文始终被限定在“当前选定的归档用户”范围内。
4. **混合导航 (Hybrid Navigation)** : 结合“无限滚动”的沉浸感与“分页器”的精确控制能力。

---

## 2. 领域模型 (Domain Models)

本节定义系统核心的逻辑实体及其属性，这些实体构成了前端的状态基础。

### 2.1 用户上下文 (User Context)

系统必须维护一份**已归档用户列表**和**当前活跃用户**。

- **行为规格**：
  - **自动同步**: 当路由参数变化时，系统需自动切换“当前活跃用户”。
  - **上下文重置**: 切换用户是一次“硬重置”操作，必须清除所有先前用户的推文数据、页码状态和临时过滤器，防止数据串扰。
  - **元数据缓存**: 用户的基础信息（头像、ID、简介）应在客户端持久化，以支持离线访问和秒级切换。

### 2.2 推文流 (Tweet Stream)

推文流是系统的主体内容实体。

- **属性**:
  - `FullText`: 推文正文。
  - `Media`: 图片/视频附件集合。
  - `Metrics`: 转推/点赞/引用数。
  - `Context`: 是否为回复、引用或转推。

- **逻辑状态**:
  - `Idle`: 初始状态。
  - `Fetching`: 正在请求数据。
  - `Ready`: 数据已加载且可渲染。
  - `Exhausted`: 已无更多数据（End of List）。
  - `Error`: 数据获取失败。

### 2.3 过滤器 (Filters)

过滤器是决定推文流内容的参数集合。

- **定义**:
  - `SortOrder`: 排序方向（最新优先/最旧优先）。
  - `DateRange`: 起始日期与结束日期。
  - `Keyword`: 全文搜索关键字。

- **行为规格**:
  - **互斥性**: 过滤器的任何变更（Change Event）都必须触发推文流的**完全重载 (Hard Reload)** 。不存在客户端本地过滤，所有筛选均为服务端驱动。

---

## 3. 路由与视图拓扑 (Routing & View Topology)

系统采用**以用户为中心**的路由策略。URL 是视图状态的唯一真值来源 (Source of Truth)。

### 3.1 URL 结构规范

所有视图路径均包含 `:userId` 作为核心锚点。

| 逻辑视图     | URL 模式          | 职责描述                               | Query Params 支持 |
| :----------- | :---------------- | :------------------------------------- | :---------------- |
| **主时间线** | `/tweets/:userId` | 展示全量推文流，支持标准过滤。         | `page`, `reverse`, `start`, `end` |
| **媒体墙**   | `/media/:userId`  | 仅展示图片/视频网格，点击查看详情。    | `page` |
| **搜索视图** | `/search/:userId` | 基于关键词的搜索结果流。               | `q` |

### 3.2 状态同步协议 (State Sync Protocol)

前端状态必须与 URL 查询参数 (Query Params) 保持双向强一致性。

1. **初始化 (Hydration)** : 应用启动时，自动并将 URL 参数注入到数据获取层。
2. **序列化 (Serialization)** : 用户在 UI 上修改 filters 后，系统**仅更新 URL**。
3. **响应式 (Reactivity)** : 数据层监听 URL 变化，自动触发 `resetStream` 和重新加载数据。前端不手动调用 API，只负责操作 URL。

---

## 4. 功能行为规格 (Functional Behaviors)

### 4.1 服务端驱动分页 (Server-Driven Pagination)

不再依赖客户端的长度猜测，改用服务端元数据驱动。

- **协议**: 后端响应必须包含标准的 `PaginatedResponse` 包裹层：
  ```ts
  interface Meta {
    total: number     // 归档总数（用于计算总页数）
    hasMore: boolean  // 是否存在下一页（用于控制触发器）
    nextCursor?: string // (可选) 游标
  }
  ```
- **守卫逻辑**: 只有当 `meta.hasMore` 为 `true` 且当前不处于 `Fetching/Error` 状态时，才允许发起下一页请求。

### 4.2 混合导航模式 (Hybrid Navigation Model)

系统需同时支持两种浏览模式，且互不冲突：

1.  **探索模式 (Infinite Scroll)**:
    -   **行为**: 向下滚动到底部时，自动加载下一页并 *追加 (Append)* 到列表末尾。
    -   **目的**: 提供沉浸式的连续阅读体验。

2.  **定位模式 (Discrete Pagination)**:
    -   **行为**: 通过分页器跳转到特定页码。
    -   **副作用**: 触发 *列表替换 (Replace)* 而非追加，并重置滚动位置到顶部。
    -   **目的**: 允许用户快速访问归档的特定部分（如最早的内容）。

---

## 5. UI 系统规格 (UI System Specs)

### 5.1 布局响应策略

采用 Apple 风格的 **Sticky Glass Layout**。

- **顶部工具栏 (Feed Toolbar)**:
  - **位置**: Sticky Top (`z-40`)。
  - **材质**: `bg-background/80` + `backdrop-blur-xl` + 底部微弱边框。
  - **内容**:
    - **左侧**: 分页导航器 (Navigation) —— 显示当前进度 `1 / 52`，支持下拉跳转。
    - **右侧**: 视图工具 (Actions) —— 排序、日期筛选、搜索。
  - **交互**: 无论列表滚动多深，工具栏始终悬浮在顶部且不遮挡内容。

### 5.2 加载反馈 (Loading Feedback)

抛弃传统的 Spinner，全面拥抱 **Skeleton Screens**。

- **Profile Header**: 加载用户信息时，展示包含 Banner、Avatar 占位符的骨架屏，防止布局抖动。
- **Tweet List**: 初始加载或硬重置时，展示 3-5 个 Tweet Skeleton 列表。
- **Infinite Loading**: 仅在追加数据时，于底部展示小型 Spinner。

### 5.3 筛选器交互 (Filter Interactions)

- **草稿状态 (Draft State)**: 复杂的筛选器（如日期范围）应支持“草稿模式”，用户选择时不立即生效。
- **显式确认**: 提供明确的“应用/确认”按钮，点击后才将参数写入 URL 并触发刷新。
- **可读性**: 筛选器按钮在激活后应显示具体的筛选值（如 "2023/01/01 - 2023/12/31"），而非泛泛的“已筛选”。

---

## 6. 非功能性需求 (Non-Functional Requirements)

1. **SRP 原则**: 组件只负责渲染和 URL 修改，不负责数据获取逻辑。
2. **SEO 友好**: 所有分页和筛选状态都反映在 URL 中，支持分享和书签。
3. **错误恢复**: 网络请求失败时，必须在列表底部提供“点击重试”机制。
