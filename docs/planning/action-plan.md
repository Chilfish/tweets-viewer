# 行动计划 (Action Plan)

**项目**: Tweets Viewer | **最后更新**: 2026-08-13

## 里程碑

| 阶段 | 代号 | 状态 |
|---|---|---|
| Phase 1 | 基础阅读器（时间线/媒体/搜索/那年今日） | ✅ 已完成 |
| Phase 2 | IG 归档整合（`/v3/ins/*` + ins_posts + 每日同步） | ✅ 已完成 |
| Phase 3 | 体验打磨与数据补全 | ✅ 已完成 |
| Phase 4 | 地基 → 架构一致 → 产品纵深（见 `roadmap.md`） | 🔄 当前 |

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

## Phase 4 — 当前阶段（见 `docs/planning/roadmap.md`）

### 目标

1. 数据与地基：全文检索索引（pg_trgm）、分页深做（keyset）或删假字段、Workers 缓存头
2. 架构一致：统一分页流为深度模块 hook、SSR 诚实化、媒体链收敛
3. 产品纵深：时间维度导航、全局搜索、档案完整性指示、PWA 补课

> 注：Fukuoka 抓取（T1/T2）确认为**临时研究脚本，不会入库**，原"数据清洗/去重入库"计划取消，详见 `roadmap.md` §二。

## 约定

- 已完成阶段的规划文档归档于 `docs/archive/`，不主动读取
- 活跃文档只在本文件与 `docs/planning/` 内
- 新任务先在此登记，再写代码
