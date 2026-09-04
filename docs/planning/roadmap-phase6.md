# Phase 6 路线图：测试纵深 × 数据洞察 × 阅读新体验

> 日期：2026-09-04 | 状态：🚧 进行中
>
> 上一阶段（Phase 5，见 `roadmap-phase5.md`）完成 UI/UX 打磨 + VRT 地基后，规划清单清空。
> **核心命题（用户定调，三线全选）**：①测试纵深（把防御面从 18 条组件基线扩到核心视觉全家 + 用户流程级 E2E）
> ②数据洞察页（盘活归档数据，给纯阅读器加「回忆杀」维度）③阅读体验新功能（随机回顾 + 时间巡航）。

## 一、现状盘点（2026-09-04）

**测试面**：VRT 地基刚落地（vitest browser mode，18 基线 = FeedStatus×4 / MyTweet×3 / ProfileHeader×1 ×双主题），
但视觉重头戏（媒体墙、IG 卡片、骨架、日期分隔线）无防护；E2E 为零——今日修复的「滚动续载 URL page 不同步」
这类用户流程 bug，现有 61 用例 + 18 基线都拦不住。

**数据面**：归档数据只被「读」，没被「盘」——唯一统计端点 `/v3/tweets/stats/:name`（按年计数）只服务于 YearNavigator。
jsonData 里沉淀的媒体/hashtag/回复构成全是现成原料。

**产品面**：阅读路径单一（时间线→翻页）；归档的「探索感」缺位——没有随机漫步，时间导航只有按年下拉。

## 二、行动清单

**顺序原则**：先测试纵深（6A，防御面先于新功能——后面两线的产品代码从落地第一天就有基线和流程测试护体）
→ 数据洞察（6B，查询→API→UI 纵切）→ 阅读新体验（6C，吃 6B 的统计基建）。

### Phase 6A — 测试纵深（前置）

| # | 任务 | 要点 |
|---|---|---|
| 6A-1 | VRT 基线扩覆盖：MediaCard / InstagramPostCard / TweetSkeleton / DateDivider ×双主题 = 8 基线 | 局部组件级；内联 SVG fixture 纪律延续；CI-only 基线播种走既有 `update-screenshots` 流程 |
| 6A-2 | E2E 地基：`@playwright/test` + `playwright.config.ts` + **本地 mock API server**（fixture 静态服务，`API_URL` 指向它）| 关键认知：SSR loader 在 dev server 进程内发请求，浏览器层 `page.route` 拦不住——mock 必须是独立本地服务，SSR 与客户端请求都命中 fixture，零外网确定性 |
| 6A-3 | E2E 核心用户流程：①无限滚动→URL page 同步（今日修复的回归钉子）②分页器跳页 ③日期范围筛选 ④搜索流程 ⑤主题切换持久化 | 流程级断言（URL/滚动/交互），与组件级 VRT 互补 |
| 6A-4 | CI `e2e` job 接入 | 全量 chromium（非 vitest browser mode 的 --only-shell）；沿用 postmortem 004 铁律：日志里必须看到真实测试统计 |

### Phase 6B — 数据洞察页 `/insights/:name`（stats 物化，2026-09-04 用户定调）

**前提修正**：统计不做每次请求的全量实时聚合——归档是「每日写一次」的数据，洞察读取应当是零聚合表读。
物化形状：`user_stats` 表（`username` UQ + `jsonData` payload + `computedAt`），一行一用户，payload 即 API 响应形状
（延续本仓 jsonData 惯例；不选 PG matview——hashtag 提取必须走应用层；不选规范化计数表——洞察页整块取用，无需 SQL 级查询性）。

| # | 任务 | 要点 |
|---|---|---|
| 6B-1 | 规格先行：Specification 修订（洞察页行为）+ 本 roadmap + action-plan 登记 | SDD 铁律 |
| 6B-2 | schema + 计算模块（测试先行，`packages/database`）：新表 `user_stats` migration；`modules/stats.ts` = `computeUserStats`（月/日计数、构成、hashtag 榜单——时间序列 GROUP BY 走 SQL，hashtag 从 `fullText` 提取走 TS）+ `refreshUserStats`（compute+upsert）+ `getUserStats`（纯表读） | 热力图日计数用稀疏对（仅非零日）控制 payload 体积；既有 `/v3/tweets/stats/:name`（按年）保持实时聚合不动，避免行为漂移 |
| 6B-3 | 刷新链路 + API：`dailyUpdate` 末尾 refresh 全部用户；一次性回填脚本；`GET /v3/stats/:name` = 表读 + LRU，**表无行时惰性 compute+upsert 兜底（自愈，不依赖回填跑全）**；`API_DOCUMENTATION.md` 同步 | 请求路径零聚合 |
| 6B-4 | 前端 `/insights/:name` 路由：统计卡片区 + 月度趋势面积图 + GitHub 式活动热力图 + 构成占比条 + **hashtag 榜单（比例条，不做词云——2026-09-04 用户定调）**——图表技术 **d3 纯函数模块**（`d3-scale` + `d3-shape`，~15KB）：坐标/路径借 D3 数学，渲染为自有 JSX（SSR 完整、token/动效/VRT 全链路吃现有体系）；双主题 + VRT 基线 | 不引 recharts/visx 等带渲染体系的库（`ResponsiveContainer` 客户端测量与 SSR 诚实化冲突） |
| 6B-5 | 导航集成：nav item「洞察」+ 首页 features 入口 + 骨架态 | 与既有五视图并列的第六视图 |

### Phase 6C — 阅读体验新功能

| # | 任务 | 要点 |
|---|---|---|
| 6C-1 | **随机回顾**：API `GET /v3/tweets/random/:name`（计数上限内随机偏移取 1 条）+ `/random/:name` 路由（掷骰子交互：一张大卡片 + 「再掷一次」） | 归档探索感的最低成本兑现 |
| 6C-2 | **时间密度条**：时间线工具栏内嵌按月密度 sparkline（数据来自 6B-2 月度计数），点击月份条 → URL 写入该月 `start/end` 跳转巡航 | 吃 6B 基建；与 YearNavigator 互补（年 → 月粒度） |
| 6C-3 | 收尾：Specification / API_DOCUMENTATION / E2E 流程（随机回顾 + 密度条跳转）| 文档即事实 |

## 三、不动清单

- 不改既有 API 行为（只新增端点）；schema 变更仅限 `user_stats` 物化表一张（6B-2），其余表不动
- 不新增图表**组件库**（recharts/visx 等带渲染/测量体系的库）；仅引 `d3-scale`/`d3-shape` 纯函数模块做数学（2026-09-04 用户定调）
- 不动 Phase 5 的动效体系与 token 体系（洞察页复用，不自成一派）

## 四、验证与收尾

- 每任务一个原子 commit（先写 commit message 再写代码）
- 新基线统一走 PR + `update-screenshots` label 播种（linux），本地 win32 基线保持 gitignore
- 全程 `test` / `test:visual` / `typecheck` / `lint` / `build` 保持绿；E2E 新门禁进 CI 后同样要求日志可见真实统计
