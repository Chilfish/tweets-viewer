# Apple 视角设计锐评与处置方案

> 从 Apple 产品与研发双重视角对项目整体设计进行锐评，并给出 P0/P1/P2 行动清单。
> 日期：2026-08-09 | 状态：P0 处置中

## 一、总评

**技术骨相很好，产品灵魂缺失。**

- 技术架构（URL 驱动状态 / 服务端分页 / JSON 列 / SSR+SPA 混合）是教科书级决策
- 但产品目前是"功能堆叠的技术演示"，不是"有产品灵魂的归档阅读器"
- Apple 视角：车造得很好，但没想清楚副驾是谁、要去哪

## 二、产品视角锐评

### 1. 少即是多（Focus）—— 功能太多，核心没立住

核心价值应该是 **"把一个人的完整网络人生归档，随时翻阅"**（时间、记忆、完整性）。

- **首页 CTA 硬编码** `to="/tweets/240y_k"`（`home.tsx:36`）—— 无用户入口
- **"那年今日"是全场最 Apple 的功能**（回忆/时光倒流，如 iOS Memories），却无首页入口、无仪式感
- meta description 自我矮化为 "第三方 Twitter 查看器"

### 2. 端到端体验 —— 导航三层皮，用户会迷路

| 导航 | 位置 | 职责 |
|---|---|---|
| `sidebar.tsx` | 桌面 | 全局导航 |
| `top-nav.tsx` | 移动 | 顶部（现显示 `@user` title）|
| `bottom-nav.tsx` | 移动 | 底部 |

- 移动端顶栏 `title` 与 `UserSelector` **重复显示用户名**
- Apple 移动端范式：底栏 = 全局导航，顶栏 = 上下文标题，当前职责不清

### 3. 情感连接 —— 最动人的功能没有仪式感

"那年今日"当前是普通列表页。应做成沉浸体验：日期大字仪式、按年份分组、媒体优先。

## 三、研发视角锐评

### 🔴 P0-1：三种分页模式并存，违背"一条路做到最好"

| 页面 | 模式 | 分页状态 |
|---|---|---|
| `tweets/search/memo` | URL + loader + `useTweetStore` | 在 URL |
| `media` | 纯 `useState` + `useCallback` | **不在 URL** |
| `ins` | URL + loader + `useIGStore` | 在 URL |
| `use-paginated-data.ts` | **死代码**（121 行无人引用）| — |

- `media.tsx` 违反核心决策 #1（URL 驱动状态），`page` 不在 URL
- `use-paginated-data.ts` 是半途而废的抽象，留第四种模式误导后人

### 🔴 P0-2：被注释掩盖的 hydration bug

`ins.tsx:44-45`：
> `// Return empty data ... avoiding the root ErrorBoundary's hydration bug.`

**已知 bug 用 workaround 绕过**，会吞错、显示假空态。Apple 不允许。

### 🟡 P1-1：数据流链路过长

`tweets.tsx` 无限滚动 = 改 URL → loader 重跑 → effect append。`useEffect` 依赖每次都是新对象的 `paginatedTweets`，频繁重跑，大数量下是性能隐患。

### 🟡 P1-2：`window.location.reload()` 做重试

`tweets.tsx:142` / `search.tsx:148` / `last-years-today.tsx:141` —— 整页刷新。应做行内重试。

### 🟢 P2：技术债

- `react-tweet/`（fork）与自研 `tweet/Tweet.tsx` 两套渲染并存
- `top-nav` title + `UserSelector` 重复
- 60+ UI 组件库，未用组件待清理
- 媒体查看器 6 个组件职责重叠待核查
- web 测试弱（50 tests 中 web 仅 10）

## 四、行动清单

### P0 — 架构一致性

| # | 任务 | 文件 | 状态 |
|---|---|---|---|
| P0-1 | 删除 `use-paginated-data.ts` 死代码 | `lib/use-paginated-data.ts` | ✅ 已完成 |
| P0-2 | `media.tsx` 并入 URL 驱动分页 | `routes/media.tsx` | ✅ 已完成 |
| P0-3 | 修 `ins.tsx` 错误处理，去 workaround | `routes/ins.tsx` | ✅ 已完成 |
| P0-4 | 重试机制改为行内重试（去 reload） | `tweet/TweetFeedStatus.tsx` + 各 route | ✅ 已完成 |

### P1 — 产品表达

| # | 任务 | 状态 |
|---|---|---|
| P1-1 | 首页重做：去硬编码 `240y_k`，加用户/最近浏览入口，讲清"完整人生归档" | ⬜ |
| P1-2 | "那年今日"升级为仪式感体验（日期大字 + 按年分组 + 首页入口） | ⬜ |
| P1-3 | 移动端导航职责重整（底栏全局 / 顶栏仅上下文） | ⬜ |

### P2 — 技术债清扫

| # | 任务 | 状态 |
|---|---|---|
| P2-1 | 统一 `react-tweet` fork 与自研 Tweet 渲染 | ⬜ |
| P2-2 | 清理未使用的 UI 组件 | ⬜ |
| P2-3 | 补 web UI 测试（Storybook + 组件测试） | ⬜ |

## 五、执行纪律

- 每项 P0 一个原子 commit（见 `docs/engineering/git-workflow.md`）
- 文档先行：先记录开发日志与本文件状态，再动代码
- 完成一项勾一项，回归 `bun lint` + 各包 test 确认绿
