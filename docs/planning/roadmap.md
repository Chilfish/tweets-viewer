# Phase 4 路线图：地基 → 架构一致 → 产品纵深

> 续 `review-r2-action.md` 的第三轮规划（r3）。日期：2026-08-13 | 状态：**✅ 全部完成（2026-08-13）**
>
> 背景：review-r2 的 P0（架构一致性 4 项）/ P1（产品表达 3 项）/ P2（技术债 3 项）已全部完成，进入下一阶段。
> 本文档 = Apple 产品 + 研发双视角锐评总结 + Phase 4 行动计划。

## 一、锐评总结

### 1.1 产品视角（Apple）

**总评：骨相很好，灵魂仍在长——产品身份与核心承诺还有缺口。**

| # | 锐评 | 现状证据 | 处置指向 |
|---|---|---|---|
| P-1 | **产品身份分裂**："一个人的完整人生归档" vs "多账号档案库"叙事打架 | PRD 画像含"归档作者本人"与"粉丝/研究者"；Fukuoka 抓取对象是团体公演周边内容（`#ゆめみた47_福岡`），非本人 | 4C-5「关于归档」页统一叙事，明确定位 |
| P-2 | **时间维度导航缺失**：分页解决页码定位，未解决时间定位；归档阅读器的核心承诺做了一半 | 日期范围筛选是表单不是导航；无"跳转年份/按年浏览"一级交互 | 4C-1 时间维度导航 |
| P-3 | **搜索被用户隔离阉割**：`/search/:name?` 默认限定单用户，缺跨账号、跨时间的"回忆检索" | 全文检索底层还是 `ILIKE %kw%`（见 R-1），产品想做全局搜索工程上撑不起 | 4A-2 → 4C-2 |
| P-4 | **档案完整性无交代**：用户不知道归档覆盖哪些年份、哪里有缺口，缺数据即被误读为"内容少" | 无按年统计端点、无缺口提示 | 4C-3 档案完整性指示 |
| P-5 | **"iOS PWA 原生感"是空头支票**：PRD §4.4 承诺 PWA，实际无 manifest / apple-touch-icon / theme-color | `apps/web-react/public/` 仅 favicon + icon.jpg | 4C-4 PWA 补课 |

### 1.2 研发视角（Apple R&D）

**总评：死代码级硬伤已清，剩结构性软债——性能天花板、协议诚实、抽象收敛。**

| # | 锐评 | 现状证据 | 处置指向 |
|---|---|---|---|
| R-1 | 🔴 **全文检索无索引**：`ILIKE '%kw%'` 全表扫，归档过万条即触顶 | `packages/database/modules/tweet.ts:209` | 4A-2 pg_trgm |
| R-2 | 🔴 **`nextCursor` 假抽象 + OFFSET 深翻页**：协议字段全仓库零使用；snowflake id 本身时间有序，keyset 分页几乎零成本 | `shared` 的 `PaginatedResponse`；`tweet.ts` 五处 + `ins.ts` 全 OFFSET | 4A-3 分页深做或删字段 |
| R-3 | 🟡 **三种分页流三份手写实现**：tweets/memo（store + effect）、media（useState + 守卫）、ins（store）；行为细节不一致（tweets 追加无去重，media 有） | `routes/tweets.tsx` / `media.tsx` / `last-years-today.tsx` / `ins.tsx` | 4B-1 统一 hook |
| R-4 | 🟡 **r2 漏项**：锐评 🟡 P1-1「数据流链路过长」（`tweets.tsx` effect 依赖每次新对象的 `paginatedTweets` 频繁重跑）未进 r2 行动清单 | `routes/tweets.tsx:82-104` | 并入 4B-1 |
| R-5 | 🟡 **SSR 名不副实**：全路由 `clientLoader` + HydrateFallback，首屏骨架屏、动态内容对爬虫≈空壳，与 ADR-006"首屏 SSR"承诺不符 | 全部 route 文件 | 4B-2 SSR 诚实化 |
| R-6 | 🟡 **API 与客户端参数漂移**：`media.tsx` 向 `/tweets/medias/:name` 传 `start/end`，服务端路由不解析，静默无效参数 | `routes/media.tsx:46` vs `server/routes/tweets.ts:127-157` | 4A-5 API 文档修正 |
| R-7 | 🟡 **服务端零集成测试**：route 层无契约测试（分页边界/参数校验/缓存命中）；429 事故已进 postmortem 高频雷区，服务端无对应防护 | `apps/server/__tests__` | 4D-3 |
| R-8 | 🟢 **小债**：`formatDate` ×3 / `snowId2millis` ×2 / 视频代理 URL ×3 跨包重复；媒体查看器 5 层组件链过深；`apps/web-vue` 僵尸目录仍在 workspace glob；IG 抓取依赖登录 Cookie 无容错 | 见代码库 | 4B-3 / 4A-5 / 4D-1 |

## 二、范围外（用户确认）

- **`apps/scripts` 下 Fukuoka 抓取**（`fetchSearchFukuoka.ts` + `fukuoka/`）为**临时研究用途，不会入库**。
  - 原计划中"Fukuoka 数据清洗/去重/入库"（旧 PRD §3.3）**取消**，不列入 Phase 4。
  - `docs/planning/action-plan.md` T1/T2 记录保留为历史，标注"研究用途，不入库"。
- **不影响**：`dailyUpdate.ts` / `fetch-ins-daily.ts`（IG 正式入库链路，Phase 2 已上线）继续维护。

## 三、行动计划

**总原则（Apple 式）：少做、做深、按正确顺序做——先修地基（性能/协议/架构一致），再做产品纵深，最后扩功能。**

### Phase 4A — 数据与地基（✅ 已完成）

| # | 任务 | 要点 | 状态 |
|---|---|---|---|
| 4A-1 | **全文检索升级**：`pg_trgm` GIN 索引（migration 0003 `idx_tweets_fulltext_trgm`） | ILIKE 子串搜索走索引；基准验证留待数据量增长后实测 | ✅ |
| 4A-2 | **分页深做（keyset 转正）**：tweets 5 个查询函数支持 `cursor`，`meta.nextCursor` 转正；排序键表达式索引（migration 0003）；ins 量级小保持 offset（记录决策） | ADR-009；`paginateTweets` 深模块统一 offset/keyset 双模式 | ✅ |
| 4A-3 | **Workers 响应缓存头**：`/v3/tweets/*`、`/v3/ins/*` `s-maxage=3600`；`/v3/users/*` `s-maxage=86400` | CDN 边缘命中 | ✅ |
| 4A-4 | 删 `apps/web-vue` 僵尸目录；media 端点支持 `start/end`（参数转正，不再静默忽略）；API 文档同步 | 顺手清账 | ✅ |

### Phase 4B — 架构一致性纵深（✅ 已完成）

| # | 任务 | 要点 | 状态 |
|---|---|---|---|
| 4B-1 | **统一分页流为 `useUrlPaginatedStream` 深度模块**：tweets/memo/media/ins/search 五条路收敛；状态转移抽纯函数（`lib/paginated-stream.ts`）8 个契约测试；滚动续载走 keyset cursor 不写 URL；**r2 漏项修复**（effect 不再依赖新对象、ins 重试改 revalidator）；删除流 store | Specification §4.1/§4.2 同步 | ✅ |
| 4B-2 | **SSR 诚实化**：评估后保持 SPA-first + 静态壳（迁移 serverLoader 成本高、收益低）；ADR-010 + ADR-006 修订 + Specification §6 + ARCHITECTURE 同步 | 文档先行 | ✅ |
| 4B-3 | 媒体查看器链收敛（TweetDetailDrawer 内联进 MobileMediaViewer）；工具函数去重：`formatDate` 三份 → shared 一份（删 react-tweet/web lib 版）、`snowId2millis/pubTime` 归 shared、视频代理 URL 3 处统一 `proxyMedia()`；删 `getLatestTweets` 死代码 | 行为耦合点（shared 与 UI 时区语义）已统一为 shared 实现 | ✅ |

### Phase 4C — 产品纵深（✅ 已完成）

| # | 任务 | 要点 | 状态 |
|---|---|---|---|
| 4C-1 | **时间维度导航**：`YearNavigator`（按年下拉 + 年份跳转 URL start/end），tweets/media 页工具栏接入 | URL 驱动架构红利 | ✅ |
| 4C-2 | **全局搜索**：`/search` 无 name 全库检索（服务端 name 可选 + 前端按用户分组 `groupTweetsByUser` + 组头展示） | 修复搜索 keyword undefined 真实 bug（集成测试暴露） | ✅ |
| 4C-3 | **档案完整性指示**：`/v3/tweets/stats/:name` 按年统计端点 + YearNavigator 内年份缺口灰显 + 覆盖区间标题 | 4C-1/4C-3 一体实现 | ✅ |
| 4C-4 | **PWA 补课**：manifest.webmanifest + apple-touch-icon + theme-color（light/dark）+ apple-mobile-web-app meta | 兑现 PRD §4.4 | ✅ |
| 4C-5 | **「关于归档」页** `/about`：数据来源/更新频率/隐私承诺/技术实现；sidebar 入口（移动端首页 footer 链接，底栏保持 5 tab） | 产品身份叙事 | ✅ |

### Phase 4D — 发布工程与可观测性（✅ 已完成）

| # | 任务 | 要点 | 状态 |
|---|---|---|---|
| 4D-1 | **cron 健康通知**：`fetch-daily.yml` 失败时 gh issue 告警（含排查提示） | 不再静默断更 | ✅ |
| 4D-2 | **性能预算**：deploy-checklist 增加 LCP/CLS/INP/TBT 预算表（超预算即阻塞） | "性能是功能"文档化 | ✅ |
| 4D-3 | **服务端集成测试**：hono app 级（mock db）7 用例——cursor 传递/缓存头/参数校验/全库搜索/media 日期范围 | 契约固化；**暴露并修复 search keyword bug** | ✅ |

## 四、不做清单（Apple 式克制，防漂移）

- ❌ 不做任何写入/社交（点赞、评论、关注）
- ❌ 不做实时流——静态归档就是产品的定义
- ❌ 不做登录/用户系统（归档内容公开）
- ❌ 不做 Android / iOS 原生 app——PWA 先做到位（4C-4），再评估
- ❌ 不扩 UI 组件库——刚砍到 15 个，守住
- ❌ **不做 Fukuoka 数据入库**（研究用途，见"范围外"）

## 五、优先级与依赖

- **执行顺序**：4A（地基）→ 4B（架构一致）→ 4C（产品纵深），4D 穿插
- **优先起点**：`4A-1`（唯一悬着的性能天花板）+ `4B-1`（性价比最高的工程单点，含 r2 漏项）
- **关键依赖链**：4C-2（全局搜索）依赖 4A-1（检索索引）；4C-1（时间导航）依赖 4A-2（深分页）

## 六、执行纪律

- 每项任务一个原子 commit（`docs/engineering/git-workflow.md`）
- 文档先行：先更新本文档 / Specification / API 文档，再动代码
- 完成一项勾一项，回归 `bun lint` + 各包 test 确认绿
