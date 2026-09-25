# Backlog（任务清单）

**项目**: Tweets Viewer | **最后更新**: 2026-09-25

> 本清单**只保留当前关注的未决任务**，不累积已完成条目。规划下一阶段时从这里选任务；条目完成后移入归档。
> 已完成里程碑见 [action-plan.md](action-plan.md)（历史记录）与 [../archive/](../archive/README.md)。

## 约定

- 每个条目：`- [ ] <主题>（前置：... / 关联文档：... / 风险：...）`
- 技术债/重构用 `[refactor]` 前缀；UI 精修用 `[ui]` 前缀；体验/稳定性用 `[ux]` 前缀
- 需求变更需要文档跟进时，标注关联文档路径
- 裁决语义：**采纳**（按排期做）/ **延后**（注明并入阶段）/ **删除**（进不做清单，附理由）

## 未决

- [ ] [fix] 恢复 Instagram 每日抓取：刷新已过期的 `INSTAGRAM_COOKIES`（2026-06-21 起，13 个账号全部 `User not found`）后取消 `dailyUpdate.ts` 里的注释；顺带修 `fetch-ins-daily.ts:270` 吞掉用户级错误、不设退出码（job 假绿）的问题（前置：拿到新的 IG cookie；关联：`docs/development-log/2026-09-14.md`；风险：低）
- [ ] [refactor] 补齐 `apps/server` / `packages/database` 的 `typecheck`，把根 `bun run typecheck` 扩到全仓（前置：先隔离 vendored `packages/rettiwt-api` 的历史类型错误；关联：`docs/INDEX.md` §四、CI `typecheck` job；风险：低）
- [ ] [test] 视觉回归（VRT）覆盖扩面：MediaCard / InstagramPostCard / TweetSkeleton / DateDivider × 双主题（前置：CI linux 基线生成流程；关联：`planning/visual-regression-testing.md`；风险：中）
- [ ] [feat] Space 卡片历史数据回填：既有推文的 `jsonData` 没有 `space` 字段（字段是后加的），卡片只在新抓取的推文出现；需按实体里的 `x.com/i/spaces/…` 链接回填 `AudioSpaceById` 结果并回写 DB（前置：确认回填范围与限流预算；关联：`docs/development-log/2026-09-25.md`；风险：低）
- [ ] [ui] Space 卡片 VRT 覆盖：新增 `TweetSpaceCard` 尚未纳入视觉回归（五态 + 窄屏），可并入上一条 VRT 扩面（关联：`docs/Specification.md` §4.6；风险：低）

## 不做清单（裁决为删除/延后，Apple 式减法）

| 条目 | 裁决 | 理由 |
| --- | --- | --- |
| Phase 6（测试纵深 × 数据洞察 × 阅读新体验） | 删除（不接） | 所有者裁定（2026-09-08）「不做了」，6A/6B/6C 三线全部搁置 |
| Fukuoka 数据清洗/去重入库 | 删除（不接） | `apps/scripts` 下 Fukuoka 抓取为**研究脚本，不入库**（2026-08-13 确认） |

## 归档记录

| 日期 | 内容 | 去向 |
| --- | --- | --- |
| 2026-09-25 | 同步 anonTweet 的 rettiwt-api 数据层（JetFuel + Space 请求）+ 端到端 X Space 卡片（五态行动区、正文去重、抓取时挂载 `space`） | 见 `../development-log/2026-09-25.md` |
| 2026-09-17 | API 加固（issue #8 / #9）：字段级参数校验 + 非法游标 400 + medias 日期范围 total 收敛 + 媒体 partial index | 见 `../development-log/2026-09-17.md` |
| 2026-09-14 | 定时抓取全量 403 修复：出口改走 mihomo 代理 + `RettiwtPool` 错误分类硬化（401/403/429 轮换、类型化错误、明细日志） | 见 `../development-log/2026-09-14.md`、`../postmortem/006-x-403-datacenter-egress.md` |
| 2026-09-13 | 工程规范对标：文档体系 + 门禁（INDEX / engineering / reviews / SECURITY / CODE_OF_CONDUCT / cross-env / pre-push 门禁） | 见 `../development-log/2026-09-13.md`、`../postmortem/005-host-node-env-leak.md` |
