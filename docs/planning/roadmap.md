# Phase 4 路线图：地基 → 架构一致 → 产品纵深

> 续 `review-r2-action.md` 的第三轮规划（r3）。日期：2026-08-13 | 状态：规划中
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

### Phase 4A — 数据与地基（约 1-2 周）

| # | 任务 | 要点 | 依赖 |
|---|---|---|---|
| 4A-1 | **全文检索升级**：先写基准测试（万条量级 ILIKE 耗时），再加 `pg_trgm` GIN 索引，验证量级提升 | 测试先行；迁移文件入 `packages/database/migrations` | — |
| 4A-2 | **分页深做或删假字段**：推荐 tweets 表按 snowflake `id` keyset 分页（`nextCursor` 转正），ins 表同理；或至少删除 unused `nextCursor` | "协议诚实化"；改动集中在 database 模块 + 服务端路由 | — |
| 4A-3 | **Workers 响应缓存头**：`/v3/tweets/*`、`/v3/users/*` 加 `s-maxage`（归档数据每日一变，缓存 1h 安全） | 全球延迟边缘命中 | — |
| 4A-4 | 删 `apps/web-vue` 僵尸目录；同步 API 文档（media 端点参数表修正，`start/end` 或支持或删传） | 顺手清账 | R-6 |

### Phase 4B — 架构一致性纵深（约 1 周）

| # | 任务 | 要点 |
|---|---|---|
| 4B-1 | **统一分页流为 `useUrlPaginatedStream` 深度模块**：tweets / media / memo / ins 四条路收敛；"顺序下一页追加 / 跳页替换 / 筛选变化重置 / 重复数据去重"固化为 4 组契约测试 | 含 r2 漏项 R-4 修复（去 effect 依赖新对象 + 追加去重对齐） |
| 4B-2 | **SSR 诚实化**：评估 `serverLoader` 迁移成本；成本高则更新 ADR-006 + Specification，明确"SPA-first + 静态壳 + meta SEO"，删名不副实的 SSR 承诺 | 文档先行 |
| 4B-3 | 媒体查看器组件链收敛到 ≤3 层；`formatDate` / `snowId2millis` / 视频代理 URL 并到 shared | 复用 r2 P2-1 处置手法 |

### Phase 4C — 产品纵深（核心，约 2-3 周）

| # | 任务 | 要点 | 依赖 |
|---|---|---|---|
| 4C-1 | **时间维度导航**（最大单品）：tweets 页"跳转年份"（直接改 URL `start/end`，与现有 loader 天然兼容）；媒体页按年分组浏览 | URL 驱动架构红利 | 4A-2 |
| 4C-2 | **全局搜索**：`/search` 不带 `name` 时全库检索，结果按用户分组 | 产品回应 R-3/P-3 | 4A-1 |
| 4C-3 | **档案完整性指示**：用户页展示覆盖年份范围 + 每年推文数（服务端 `GROUP BY year` 新端点）+ 数据缺口提示 | 新端点 + Specification §2.1 扩展 | — |
| 4C-4 | **PWA 补课**：manifest + apple-touch-icon + theme-color + splash，兑现 PRD §4.4 | 兑现 P-5 支票 | — |
| 4C-5 | **「关于归档」页**：数据来源、更新频率（每日 cron）、只读/无追踪隐私声明 | 回应 P-1 身份叙事 | — |

### Phase 4D — 发布工程与可观测性（穿插进行）

| # | 任务 | 要点 |
|---|---|---|
| 4D-1 | **cron 健康通知**：dailyUpdate 成功后写健康标记 / 失败显式告警；IG Cookie 过期要有明显失败信号而非静默（postmortem 高频雷区联动） | — |
| 4D-2 | **性能预算**：Lighthouse 基线 + LCP < 2s 预算写进 deploy-checklist（"性能是功能"文档化） | — |
| 4D-3 | **服务端集成测试**：hono app 级测试（mock db），固化分页边界 / 参数校验 / 缓存命中契约 | R-7 |

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
