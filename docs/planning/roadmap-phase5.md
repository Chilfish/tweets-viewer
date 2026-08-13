# Phase 5 路线图：Apple 原生感 × 状态与路由切换的流畅感

> 日期：2026-08-13 | 状态：✅ 已完成（5A×5 / 5B×4 / 5C×4 / 5D×3 / 5E×4，全部原子 commit）
>
> 上一阶段（Phase 4，见 `roadmap.md`）完成功能纵深后，下一版聚焦 **UI/UX 打磨**。
> **核心命题（用户定调）**：主要追求 Apple 的原生感，各种**状态、路由切换之间的流畅感**——
> 动效是手段不是装饰：所有过渡都要有物理感（快、稳、跟手），所有状态变化都要有"来处与去处"。

## 一、现状锐评（UI 层，2026-08-13 通读代码库）

**已立住的**：design tokens 完整（颜色/圆角/`--ease-apple`/`--ease-spring`）、Sticky Glass 工具栏、骨架屏体系、移动端底栏 Tab Bar 范式、URL 驱动状态、`content-visibility` 长列表优化、PWA 基础。

**六个尖锐问题**：

| # | 问题 | 证据 |
|---|---|---|
| 1 | 🔴 **CSS 层自我重复**：`:root`/`.dark`/`@theme inline`/`@layer base` 全部定义两遍，`--font-sans` 两处冲突定义 | `app.css:1-143` vs `157-237` |
| 2 | 🔴 **Tweet 系组件硬编码颜色**：8 个类用 `rgb(...)`/`bg-white`/`dark:bg-[#080808]`，违反"禁止硬编码颜色"铁律；`p.tweet-body` 字体栈硬编码 | `app.css:239-288` |
| 3 | 🟡 **ProfileHeader 套用 tweet 卡片样式**（语义错位），banner 空态 `bg-slate-*` 硬编码 | `ProfileHeader.tsx:25,35` |
| 4 | 🟡 **文案中英混杂**：「已加载全部归档推文」vs `All posts loaded`、emoji `⚠️📭` 与文字图标混用 | `TweetFeedStatus`/`ins.tsx` |
| 5 | 🟡 **交互反馈执行不彻底**：`active:scale` 只做了 home 卡片；`prefers-reduced-motion` 未处理；触控目标 32px < 44px | 规范 §5.1 vs 实现 |
| 6 | 🟢 **文档漂移**：`GENERAL.md` 引用不存在的 `~/hooks/use-media-query` | `GENERAL.md:204-222` |

## 二、行动清单

**顺序原则（Apple 式）**：先修 token 地基（5A，裂缝不补，一切打磨都是白做）→ 再攻路由/状态切换的流畅感（5B/5C，本版主轴）→ 平台原生感收尾（5D）→ 阅读体验深化（5E，后置）。

### Phase 5A — Token 与一致性地基（前置）

| # | 任务 | 要点 |
|---|---|---|
| 5A-1 | `app.css` 去重：token/`@theme`/`@layer base` 收敛一份；`--font-sans` 定稿（系统栈优先 + 中文回退），删多余 Noto Sans Variable 加载 | 消除"改两处"隐患 |
| 5A-2 | Tweet 系硬编码颜色 → token（`bg-card`/`text-foreground`/`border-border` 等），删 `dark:` 补丁 | 与 5E-1 卡片决策联动 |
| 5A-3 | ProfileHeader 独立容器（不再套 `tweet-container`）+ banner 空态 token 化 | 语义归位 |
| 5A-4 | 文案统一：空态/错误态/尾部状态全中文化、语气统一；emoji → lucide 图标 + aria-label | 产品语言一致 |
| 5A-5 | 设计文档同步：删幽灵 hook 引用、核对组件索引 | 文档即事实 |

### Phase 5B — 路由切换的流畅感（本版核心）

| # | 任务 | 要点 |
|---|---|---|
| 5B-1 | **View Transitions API 接入**：React Router v7 的文档级 ViewTransition——路由切换旧页淡出/新页淡入 + 轻微位移；toolbar 等共享元素稳定不跳；`prefers-reduced-motion` 自动降级 | 原生感的最大单点 |
| 5B-2 | 页面进入动画统一：现有 `fade-in duration-300`（layout outlet）升级为与 ViewTransition 协调的进入动画；各 route `handle` 定义过渡类型（默认/淡入/侧滑） | 动效有"来处" |
| 5B-3 | 列表追加动画：无限滚动新推文淡入（`slide-in-from-bottom`）、跳页替换内容淡入；追加不整屏闪动 | 状态切换流畅 |
| 5B-4 | 骨架 → 内容过渡：ProfileHeader/列表骨架到实体的平滑切换（核查现有 `animate-in` + 防 CLS） | 加载体验连贯 |

### Phase 5C — 状态切换的流畅感（交互质感）

| # | 任务 | 要点 |
|---|---|---|
| 5C-1 | 列表四态（加载/空/错误/已全部加载）视觉切换统一：淡入淡出不跳变（TweetFeedStatus / ins / media 收敛为一个状态组件） | 状态机有"去处" |
| 5C-2 | 按压反馈全覆盖：移动端可点元素统一 `active:scale`（规范 §5.1 审计落地） | 物理感 |
| 5C-3 | `prefers-reduced-motion` 全局降级：动画/骨架/过渡关闭或减弱 | Apple a11y 必查 |
| 5C-4 | 触控目标 ≥44px（工具栏/导航按钮）+ 键盘体验（`/` 聚焦搜索、Esc 关闭浮层） | 人人可用 |

### Phase 5D — 平台原生感（iOS / macOS）

| # | 任务 | 要点 |
|---|---|---|
| 5D-1 | iOS 滚动细节：`overscroll-behavior`、滚动回弹、safe-area 全面核查、状态栏/全屏 PWA 细节 | 兑现"iOS 原生感" |
| 5D-2 | 滚动位置记忆：keyset 滚动不写 URL，刷新回锚点——评估 sessionStorage 记忆上次滚动位置（可选） | 流动感不丢失 |
| 5D-3 | 桌面细节：sidebar hover 质感、键盘快捷键（`⌘K` 全局搜索，加分项） | macOS 感 |

### Phase 5E — 阅读体验深化（后置）

| # | 任务 | 要点 |
|---|---|---|
| 5E-1 | **Tweet 卡片视觉决策**：沉浸流式（分隔线、去边框，Twitter 原生）vs 保持卡片统一阴影——建议流式，配合 5A-2 一次做完 | 阅读沉浸感 |
| 5E-2 | 时间线细节：跨天日期分隔线（iOS 消息分组范式）、列表项 hover 高亮 | 长列表导航 |
| 5E-3 | 媒体体验：`MediaImage` 懒加载/模糊占位核查、灯箱手势（滑动切换） | 媒体墙手感 |
| 5E-4 | 首页质感：hero 入场动效、features 卡片 hover、memo 入口强化 | 门面 |

## 三、优先级与依赖

- **执行顺序**：5A（地基）→ 5B（路由流畅感，核心）→ 5C（状态流畅感）→ 5D（原生感）→ 5E（阅读深化）
- **优先起点**：`5A-1` + `5A-2`（裂缝修补，动效的地基）+ `5B-1`（View Transitions，本版最大单点）
- **关键依赖**：5E-1 卡片决策影响 5A-2 写法；5B-1 的过渡类型定义影响 5B-2/5B-3 的动画协调
- **不动清单**：不改功能行为（纯 UI/UX）、不新增组件库依赖（View Transitions 用平台原生 API）、不扩路由

## 四、执行纪律

- 每项一个原子 commit（`docs/engineering/git-workflow.md`）
- 文档先行：动效/视觉规范变更先更新 `docs/ui-design/`，再动代码
- 完成一项勾一项，回归 `bun lint` + `bun --cwd apps/web-react test` + build 确认绿
