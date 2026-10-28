# 术语表

**项目**: Tweets Viewer | **最后更新**: 2026-08-09

---

## 业务术语

| 术语 | 英文 | 说明 |
|---|---|---|
| 归档 | Archive | 通过 scripts 离线抓取并存库的数据集合 |
| 推文列表 | Tweet List | 主时间线里的一组推文，含正文 / 媒体 / 指标 / 上下文 |
| 那年今日 | Last Years Today | 往年同月同日的推文集合 |
| 图片和视频 | Media | 只含图片或视频附件的推文网格 |
| IG 帖子 | IG Post | Instagram 帖子（含图片/视频/Reels），存于 `ins_posts` 表 |
| 无限滚动 | Infinite Scroll | 滚动到底部自动加载下一页的浏览模式 |
| 分页器 | Pagination | 精确跳转特定页码的浏览模式 |

## 产品术语

| 术语 | 英文 | 说明 |
|---|---|---|
| 两种浏览方式 | Infinite Scroll + Pagination | 可以一直往下滚，也可以按页跳 |
| 整段重新加载 | — | 筛选变化时重新请求整段列表，不在客户端本地过滤 |
| 选完再应用 | — | 日期范围选好后点「应用」才写入 URL |
| URL 和页面的同步 | — | URL 变化触发 loader 重新取数，页面只改 URL |
| 只看当前用户 | — | 上下文始终限定在当前选中的归档用户 |

## 文案用词

界面和文档共用一个概念一个名字。改文案前先查这张表。

| 概念 | 统一叫法 | 不要用 |
| --- | --- | --- |
| 离线数据集合 | 归档 | 存档、存库 |
| 时间线 | 时间线 | 推文流（技术文档可用） |
| 图片/视频页 | 媒体（导航）、图片和视频（正文） | 媒体墙 |
| 往年同月同日 | 那年今日（功能名）、往年今天（正文） | 历史上的今天、每年今日 |
| 推文的回复 | 回复 | 评论 |
| 转推动作 | 转推 | 转发 |
| Twitter 内容 | 推文 | 帖子（帖子只用于 IG） |
| 站点首页 | 首页 | 主页 |
| 浏览方式 | 无限滚动 + 翻页 | 混合导航 |

写用户文案时，先说“能做什么”，再说怎么做。不要用“无缝、沉浸式、高效、精准、海量、即时、完整人生、永不结束”这类形容词撑场面。

## 技术术语

| 术语 | 英文 | 说明 |
|---|---|---|
| 服务端驱动分页 | Server-Driven Pagination | `PaginatedResponse.meta.hasMore` 控制加载 |
| 结构化列 | Structured Column | `tweetId`/`fullText`/`createdAt` 等用于高效查询的列 |
| JSON 列 | JSON Column | `jsonData` 存储完整 `EnrichedTweet`/`EnrichedUser` |
| 两层缓存 | Two-Layer Cache | 服务端 `SimpleLRUCache` + 客户端 `axios-cache-interceptor` |
| URL 驱动状态 | URL-Driven State | 分页/筛选/排序全在 URL query params |
| ins→twitter 映射 | Mapping | `mapping.ts` 维护 IG username → twitter username |
| 不做首屏 SSR | SPA-first | 首屏是静态壳 + 骨架屏，内容由客户端渲染 |

## 类型/实体术语

| 术语 | 说明 |
|---|---|
| `EnrichedTweet` | 增强推文类型（过滤广告、处理引用），存于 `tweets.jsonData` |
| `EnrichedUser` | 增强用户类型，存于 `users.jsonData` |
| `PaginatedResponse<T>` | 统一分页响应：`{ data, meta: { total, page, pageSize, hasMore, nextCursor } }` |
| `IGUserInfo` | IG 用户信息（username/fullname/bio/followers 等），存于 `users.ins_json_data` |
| `IGPost` | IG 帖子类型（含 media/type: post\|reel/audio 等），存于 `ins_posts.jsonData` |
| `RettiwtPool` | Twitter API 多 Key 连接池轮转 |
| `TweetEnrichmentService` | 原始推文 → `EnrichedTweet` 转换服务 |

## 语言/环境

| 术语 | 说明 |
|---|---|
| `userName` | Twitter Screen Name（URL 锚点，如 `ritsu_yumemita`） |
| `insUsername` | Instagram 用户名（nullable，并入 users 表） |
| `ENVIRONMENT` | 运行环境 (development/production)，`env.server.ts` Zod 验证 |
