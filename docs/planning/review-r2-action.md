# Apple 视角设计锐评与处置方案

> 从 Apple 产品与研发双重视角对项目整体设计进行锐评，并给出 P0/P1/P2 行动清单。
> 日期：2026-08-09 | 状态：P1 全部完成（P0 ✅ / P1 ✅ / P2 待处置）

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

| # | 任务 | 设计决策 | 状态 |
|---|---|---|---|
| P1-1 | 首页重做：去硬编码 `240y_k`，加用户/最近浏览入口，讲清"完整人生归档" | ① 删除硬编码 CTA；② hero/meta 文案定位改为「完整人生归档」（时间/记忆/完整性），去掉"第三方查看器"自我矮化；③ `useUserStore` 新增持久化 `recentUserNames`（去重、上限 6）+ `pushRecentUser`，layout loader 解析 activeUser 时记录；④ 首页新增「继续浏览 / 最近浏览 / 归档用户」入口 | ✅ 已完成 |
| P1-2 | "那年今日"升级为仪式感体验（日期大字 + 按年分组 + 首页入口） | ① 仪式感头部：大字日期「8月9日」+ 回忆总数（取 `meta.total`）；② 推文按年分组（`groupTweetsByYear` 纯函数，连续段分组 + 年分隔线，不破坏时间线顺序）；③ 首页「那年今日」卡片入口（目标用户 = activeUser ?? recentUsers[0] ?? users[0]） | ✅ 已完成 |
| P1-3 | 移动端导航职责重整（底栏全局 / 顶栏仅上下文） | ① 顶栏 = `UserSelector` 完整版（头像 + 用户名合并）承载上下文，有用户时不再显示独立 `@user` 标题（用户名只出现一处）；无用户（首页）显示站点名；主题切换靠右；② 底栏 = 全局导航，恢复「图标 + 文字标签」（iOS Tab Bar 范式）；③ 桌面 Sidebar 不变；④ 规范写入 Specification §5.4 | ✅ 已完成 |

### P2 — 技术债清扫

| # | 任务 | 状态 |
|---|---|---|
| P2-1 | 统一 `react-tweet` fork 与自研 Tweet 渲染 | ✅ 已完成 |
| P2-2 | 清理未使用的 UI 组件 | ✅ 已完成 |
| P2-3 | 补 web UI 测试（Storybook + 组件测试） | 🔄 进行中 |

#### P2-1 统一 Tweet 渲染 — 分析与处置范围

> ✅ **已完成（2026-08-09）**：修 `is_inline_meida` → `is_inline_media` 拼写 bug（含删类型 typo 字段）；删 fork 死文件（tweet-not-found / fork tweet-skeleton / skeleton.tsx）+ barrel 修剪；删 utils 死导出（TweetCoreProps / convertDate）；删自研死组件 `TweetPagination`。验证：typecheck ✅ lint ✅ 19 tests ✅

**分析结论**：主线本就单链（所有页面统一 `MyTweet → TweetNode → fork 子组件`），不存在真并行渲染线。真实债是合并残留的**死代码 + 一个字段拼写 bug**。

- **修 bug**：`react-tweet/tweet-media.tsx:36` 读 `tweet.is_inline_meida`（typo），数据源写 `is_inline_media`；类型 `packages/rettiwt-api/types/enriched/index.ts:45-46` 两个字段**都声明了**，typecheck 漏过 → inline 媒体布局分支（`flex flex-col gap-0`）永不触发。修读端 + 删 typo 字段
- **删 fork 死文件**：`react-tweet/tweet-not-found.tsx`（零引用）、`react-tweet/tweet-skeleton.tsx`（与自研 `tweet/tweet-skeleton.tsx` 重复且后者活）、`react-tweet/skeleton.tsx`（未进 barrel，整文件死）
- **清 utils 死导出**：`TweetCoreProps`（接口，零引用）、`convertDate`（与 `@tweets-viewer/shared` 逐行相同，零引用）
- **删自研死组件**：`tweet/TweetPagination.tsx`（零引用，与活着的 `TweetNavigation` 功能重复）→ 连锁使 `ui/pagination.tsx` 变为死代码，归入 P2-2
- **工具函数重复（记录不处理）**：`formatDate` 3 份（fork/shared/lib）、`snowId2millis/pubTime` 2 份、视频代理 URL 拼接 3 处 —— 行为耦合且跨包，不属本次清扫，另行评估

#### P2-2 清理未用 UI 组件 — 处置范围（用户已确认「全部删除」）

> ✅ **已完成（2026-08-09）**：删除全部 33 个未用组件 + P2-1 连锁的 `ui/pagination` + 孤儿 `hooks/use-infinite-scroll`；移除 12 个僵尸 npm 依赖；修剪 6 个 optimizeDeps 条目；同步设计文档（`OVERVIEW.md` §7 索引收敛到实际 15 个组件、`GENERAL.md` 删 Card/Dialog/Toast 段、删 `SETTINGS.md` 与 `select-best-practices.md`——两者描述的 settings-layout 从未实现且 Switch/Select 已删）。验证：typecheck ✅ lint ✅ 19 tests ✅ build ✅

`ui/` 下 48 个组件，**33 个无人引用**（14 个在用 + 2 个仅作内部依赖 input/textarea 保留）：

- **删 4 个仅文档引用**：`card` / `dialog` / `select` / `switch`（`docs/ui-design/components/GENERAL.md`、`SETTINGS.md`、`select-best-practices.md` 提及）→ 同步更新文档
- **删 29 个零引用**：accordion / alert-dialog / alert / autocomplete / breadcrumb / checkbox / checkbox-group / collapsible / empty / field / fieldset / form / frame / group / kbd / label / meter / preview-card / progress / radio-group / slider / spinner / table / toast / toggle / toolbar / tooltip / waterfall（`alert` 仅被未用的 `waterfall` 引用，连锁删）
- **删重复实现**：`menu`（≈ `dropdown-menu`，后者在用）、`ui/spinner`（≈ `components/spinner`，后者在用）、`ui/pagination`（P2-1 连锁）
- **删 12 个僵尸 npm 依赖**（web-react 源码零 import）：cmdk / input-otp / vaul / recharts / react-resizable-panels / embla-carousel-react / sonner / next-themes / react-hook-form / @hookform/resolvers / yet-another-react-lightbox / zod
- **清 vite `optimizeDeps` 残留**：`@base-ui/react/{accordion,checkbox,select,switch,toast,toggle,tooltip}`

#### P2-3 补 web UI 测试 — 处置范围

现有 19 用例全为纯逻辑测试（store/lib），0 组件渲染测试、6 个路由页面零覆盖。Storybook 已配 4 addon 但 addon-vitest 未接入 vitest。

- 装 `@testing-library/react` + `@testing-library/jest-dom` + `jsdom`（或复用 workspace 已有 happy-dom）
- `vitest.config.ts` 扩展 DOM environment + setupFiles + coverage
- 接入 Storybook addon-vitest portable stories（现有 6 story → 自动变测试）
- 补关键组件测试：`MyTweet`/`TweetNode`（核心内容组件）、首页入口（user-entry / memo-entry）等

## 五、执行纪律

- 每项 P0 一个原子 commit（见 `docs/engineering/git-workflow.md`）
- 文档先行：先记录开发日志与本文件状态，再动代码
- 完成一项勾一项，回归 `bun lint` + 各包 test 确认绿
