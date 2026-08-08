# 行动计划 (Action Plan)

**项目**: Tweets Viewer | **最后更新**: 2026-08-09

## 里程碑

| 阶段 | 代号 | 状态 |
|---|---|---|
| Phase 1 | 基础阅读器（时间线/媒体/搜索/那年今日） | ✅ 已完成 |
| Phase 2 | IG 归档整合（`/v3/ins/*` + ins_posts + 每日同步） | ✅ 已完成 |
| Phase 3 | 体验打磨与数据补全 | 🔄 当前 |

## Phase 3 — 当前阶段

### 目标

1. 数据补全：Fukuoka 归档抓取（关键词 `福岡公演`）
2. 体验打磨：日期范围筛选（DateRangeFilter）、Calendar 迁移 @daypicker/react v10
3. 流程规范化：对标 Float 建立文档体系（ADR / 开发日志 / postmortem / 工程规范）

### 任务清单

| 任务 | 说明 | 状态 |
|---|---|---|
| T1 | `fetchSearchFukuoka.ts` 关键词抓取脚本 | ✅ 已完成 |
| T2 | `apps/scripts/src/fukuoka/` 数据处理模块（fetch/members/simplify） | ✅ 已完成 |
| T3 | DateRangeFilter + 日期范围查询参数 | ✅ 已完成 |
| T4 | Calendar 迁移到 @daypicker/react v10 | ✅ 已完成 |
| T5 | 服务端接受 date-only 日期值 | ✅ 已完成 |
| T6 | 文档体系对标 Float（当前任务） | ✅ 已完成 |
| T7 | CI 门禁（lint + test） | ✅ 已完成 |
| T8 | postmortem 001：Windows symlink mode 残留 | ✅ 已沉淀 |
| T9 | **Apple 视角设计锐评与处置**（P0 架构一致性 ✅ → P1 产品表达 → P2 技术债） | 🔄 进行中，见 `review-r2-action.md`。P1-1 首页重做（去硬编码 `240y_k`、recentUsers 入口、定位文案）✅；P1-2 那年今日仪式感（日期大字 + 按年分组 + 首页入口）✅；P1-3 移动端导航职责重整 ⬜ 待处置 |

## 约定

- 已完成阶段的规划文档归档于 `docs/archive/`，不主动读取
- 活跃文档只在本文件与 `docs/planning/` 内
- 新任务先在此登记，再写代码
