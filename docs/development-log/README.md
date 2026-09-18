# 开发日志索引

按天记录。新的一天新建 `YYYY-MM-DD.md`，一天内多条变更按时间顺序用 `##` 段落记录。跨天工作按天分开记录，不在同一天续写昨天。

## 时间线（新 → 旧）

| 日期 | 主题 |
|---|---|
| [2026-09-18](2026-09-18.md) | `fetch-tweet-daily` 每日抓取顺带刷新用户资料（`fetchUserDetailsRaw` + `createUser` upsert，粉丝/bio/推文数不再停在入库快照）；Key 级失败判定抽成 `getAbortReason()` 供资料与时间线共用 |
| [2026-09-17](2026-09-17.md) | API 加固（issue #8 / #9）：`noReplies`/`cursor`/`search` 字段级校验（非法游标 400 不再 500）、medias 日期范围下 total/hasMore 收敛、媒体 partial index（migration 0004） |
| [2026-09-14](2026-09-14.md) | 定时抓取全量 403 排查与修复（出口改走 mihomo 代理、`RettiwtPool` 错误分类硬化 + 明细日志、postmortem 006）；IG 抓取暂缓（cookie 过期） |
| [2026-09-13](2026-09-13.md) | 工程规范对标：文档体系（INDEX / engineering / reviews / backlog / SECURITY / CODE_OF_CONDUCT）+ 门禁约束（cross-env NODE_ENV、聚合脚本、pre-push 真实门禁）+ postmortem 005；定时任务异常处理修正（`fetch-tweet-daily` 静默 0 数据）＋ CI Node 24 对齐与失败通知 |
| [2026-09-08](2026-09-08.md) | 全量「那年今日」：`/memo` 无用户模式（按年→按用户两层分组，跨用户回忆）；Phase 6 废弃 |
| [2026-09-04](2026-09-04.md) | 滚动续载同步 URL 页码（page × cursor 双机制收敛）；视觉回归测试地基（VRT） |
| [2026-08-31](2026-08-31.md) | web-react `apiUrl` 去硬编码，改为从 `env.server.ts` / `.env` 环境变量读取（经 `vite.config.ts` 注入 bundle） |
| [2026-08-13](2026-08-13.md) | Phase 4 路线图规划（Apple 锐评续篇 r3）：roadmap 落盘、Fukuoka 确认为研究脚本不入库 |
| [2026-08-09](2026-08-09.md) | 流程规范化：对标 Float 建立文档体系（ADR/开发日志/postmortem/工程规范）；Fukuoka 归档抓取启动；日期范围筛选 + Calendar 迁移收尾 |

## 记录约定

- 新的一天新建 `YYYY-MM-DD.md`；跨天工作按天分开记录
- 一天内多条变更按时间顺序用 `##` 段落记录，同一天的多段共用该日期文件
- 踩坑同步沉淀到 [postmortem](../postmortem/README.md)，日志里可链接引用对应编号
- 文档目录分类见 [docs 索引](../README.md)
