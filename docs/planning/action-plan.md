# 行动计划 (Action Plan)

**项目**: Tweets Viewer | **最后更新**: 2026-09-04

## 里程碑

| 阶段 | 代号 | 状态 |
|---|---|---|
| Phase 1 | 基础阅读器（时间线/媒体/搜索/那年今日） | ✅ 已完成 |
| Phase 2 | IG 归档整合（`/v3/ins/*` + ins_posts + 每日同步） | ✅ 已完成 |
| Phase 3 | 体验打磨与数据补全 | ✅ 已完成 |
| Phase 4 | 地基 → 架构一致 → 产品纵深（见 `roadmap.md`） | ✅ 已完成 |
| Phase 5 | UI/UX 打磨：Apple 原生感 × 状态/路由切换流畅感（见 `roadmap-phase5.md`） | ✅ 已完成 |

## Phase 3 — 当前阶段

### 目标

1. 数据补全：Fukuoka 归档抓取（关键词 `福岡公演`）
2. 体验打磨：日期范围筛选（DateRangeFilter）、Calendar 迁移 @daypicker/react v10
3. 流程规范化：对标 Float 建立文档体系（ADR / 开发日志 / postmortem / 工程规范）

### 任务清单

| 任务 | 说明 | 状态 |
|---|---|---|
| T1 | `fetchSearchFukuoka.ts` 关键词抓取脚本（**研究用途，不入库**） | ✅ 已完成 |
| T2 | `apps/scripts/src/fukuoka/` 数据处理模块（fetch/members/simplify，**研究用途，不入库**） | ✅ 已完成 |
| T3 | DateRangeFilter + 日期范围查询参数 | ✅ 已完成 |
| T4 | Calendar 迁移到 @daypicker/react v10 | ✅ 已完成 |
| T5 | 服务端接受 date-only 日期值 | ✅ 已完成 |
| T6 | 文档体系对标 Float（当前任务） | ✅ 已完成 |
| T7 | CI 门禁（lint + test） | ✅ 已完成 |
| T8 | postmortem 001：Windows symlink mode 残留 | ✅ 已沉淀 |
| T9 | **Apple 视角设计锐评与处置**（P0 架构一致性 ✅ → P1 产品表达 ✅ → P2 技术债） | ✅ **全部完成**（P0 4 项 / P1 3 项 / P2 3 项，见 `review-r2-action.md`） |

## Phase 4 — 地基 → 架构一致 → 产品纵深（✅ 已完成，见 `docs/planning/roadmap.md`）

### 目标

1. 数据与地基：全文检索索引（pg_trgm）、分页深做（keyset 转正）、Workers 缓存头
2. 架构一致：统一分页流为深度模块 hook、SSR 诚实化、媒体链收敛 + 工具去重
3. 产品纵深：时间维度导航、全局搜索、档案完整性指示、PWA 补课、关于归档页
4. 发布工程：cron 健康通知、性能预算文档、服务端集成测试（暴露并修复 search keyword bug）

> 注：Fukuoka 抓取（T1/T2）确认为**临时研究脚本，不会入库**，原"数据清洗/去重入库"计划取消，详见 `roadmap.md` §二。
> Phase 4 全部任务（4A×4 / 4B×3 / 4C×5 / 4D×3）已于 2026-08-13 完成并各自原子 commit。

## Phase 5 — UI/UX 打磨：Apple 原生感 × 状态/路由切换流畅感（当前，见 `docs/planning/roadmap-phase5.md`）

### 目标（用户定调：主要追求 Apple 的原生感，各种状态、路由切换之间的流畅感）

1. **Token 与一致性地基（5A）**：`app.css` 去重、Tweet 系硬编码色 → token、ProfileHeader 独立容器、文案统一
2. **路由切换流畅感（5B，核心）**：View Transitions API 接入、页面进入动画统一、列表追加动画、骨架→内容过渡
3. **状态切换流畅感（5C）**：列表四态视觉统一、按压反馈全覆盖、`prefers-reduced-motion` 降级、触控目标/键盘体验
4. **平台原生感（5D）**：iOS 滚动/safe-area 细节、滚动位置记忆、桌面快捷键
5. **阅读体验深化（5E，后置）**：Tweet 卡片视觉决策（流式）、时间线日期分隔线、媒体墙体验、首页质感

> 不动清单：不改功能行为、不新增组件库依赖（View Transitions 用平台原生 API）、不扩路由。

### 任务清单（每项一个原子 commit，见 `roadmap-phase5.md`）

| 任务 | 说明 | 状态 |
|---|---|---|
| 5A-1 | `app.css` 去重：token/`@theme`/`@layer base` 收敛一份；`--font-sans` 定稿（系统栈优先 + 中文回退），删多余 Noto Sans Variable 加载 | ✅ |
| 5A-2 | Tweet 系硬编码颜色 → token（`bg-card`/`text-foreground`/`border-border` 等），删 `dark:` 补丁 | ✅ |
| 5A-3 | ProfileHeader 独立容器（不再套 `tweet-container`）+ banner 空态 token 化 | ✅ |
| 5A-4 | 文案统一：空态/错误态/尾部状态全中文化、语气统一；emoji → lucide 图标 + aria-label | ✅ |
| 5A-5 | 设计文档同步：删幽灵 hook 引用、核对组件索引 | ✅ |
| 5B-1 | View Transitions API 接入（文档级过渡 + `prefers-reduced-motion` 降级） | ✅ |
| 5B-2 | 页面进入动画统一：route `handle` 定义过渡类型，与 ViewTransition 协调 | ✅ |
| 5B-3 | 列表追加动画：新推文淡入（`slide-in-from-bottom`）、跳页替换淡入 | ✅ |
| 5B-4 | 骨架 → 内容平滑过渡（ProfileHeader/列表，防 CLS） | ✅ |
| 5C-1 | 列表四态视觉切换统一（TweetFeedStatus / ins / media 收敛为一个状态组件） | ✅ |
| 5C-2 | 按压反馈全覆盖：移动端可点元素统一 `active:scale` | ✅ |
| 5C-3 | `prefers-reduced-motion` 全局降级（动画/骨架/过渡关闭或减弱） | ✅ |
| 5C-4 | 触控目标 ≥44px + 键盘体验（`/` 聚焦搜索、Esc 关闭浮层） | ✅ |
| 5D-1 | iOS 滚动细节：`overscroll-behavior`、safe-area、状态栏/PWA 核查 | ✅ |
| 5D-2 | 滚动位置记忆：sessionStorage 记忆上次滚动位置（可选） | ✅ |
| 5D-3 | 桌面细节：sidebar hover 质感、`⌘K` 全局搜索（加分项） | ✅ |
| 5E-1 | Tweet 卡片视觉决策：沉浸流式（分隔线、去边框），配合 5A-2 一次做完 | ✅ |
| 5E-2 | 时间线细节：跨天日期分隔线（iOS 消息分组范式）、列表项 hover 高亮 | ✅ |
| 5E-3 | 媒体体验：`MediaImage` 懒加载/模糊占位核查、灯箱手势（滑动切换） | ✅ |
| 5E-4 | 首页质感：hero 入场动效、features 卡片 hover、memo 入口强化 | ✅ |

## Phase 5 收尾修复 — URL 页码随滚动续载同步（2026-09-04，用户实测反馈）

### 问题

滚动续载（无限滚动追加）走 keyset cursor 拉取下一页，但 URL `page` 不更新——翻到很后面了 URL 还停留在
前一页（如始终 `?page=1`），分页器显示也停留在锚点页，刷新/分享无法定位当前阅读进度。

### 任务清单

| 任务 | 说明 | 状态 |
|---|---|---|
| B1 | Specification §4.2 探索模式状态载体修订：滚动续载成功后 `replace` 同步 URL `page` = 已加载页数 | ✅ |
| B2 | `lib/paginated-stream.ts` 状态机增加 `loadedPages`（loader 吸收对齐 URL page，续载 +1） | ✅ |
| B3 | `useUrlPaginatedStream` 滚动续载成功后同步 URL `page`（replace，无历史记录；跳页/筛选期间不抢写） | ✅ |
| B4 | 五条路由容器 key 从 `searchParams` 改为 filterKey（滚动同步页码不触发整屏重挂载闪动） | ✅ |
| B5 | 契约测试补 `loadedPages` 断言；跑绿测试（typecheck ✅ lint ✅ build ✅） | ✅ |
| B6 | 开发日志 + 本登记 | ✅ |

## 视觉回归测试地基（2026-09-04，方案见 `visual-regression-testing.md`）

### 目标

组件级视觉回归自动化：核心组件 × 双主题截图基线进 CI 门禁，零外部服务（Vitest browser mode `toMatchScreenshot`，非 Chromatic）。

| 任务 | 说明 | 状态 |
|---|---|---|
| V1 | 方案文档（选型依据/架构/基线管理/CI 接入）+ 本登记 | ✅ |
| V2 | vitest `vrt` project（chromium headless）+ devDeps + 脚本 + win32 基线 gitignore | ✅ |
| V3 | 核心组件 vrt 用例：FeedStatus 四态 / MyTweet 三形态 / ProfileHeader（× light/dark，共 18 基线） | ✅ |
| V4 | CI `visual` job（playwright + fonts-noto-cjk） | ✅ |
| V5 | `update-screenshots` workflow（PR label `update-screenshots` 触发，CI-only 基线生成） | ✅ |
| V6 | PR 打 label 播种 linux 基线 → CI 全绿 → 合并 | ✅ |

## 约定

- 已完成阶段的规划文档归档于 `docs/archive/`，不主动读取
- 活跃文档只在本文件与 `docs/planning/` 内
- 新任务先在此登记，再写代码
