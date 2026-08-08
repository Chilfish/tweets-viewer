# 术语表

**项目**: Tweets Viewer | **最后更新**: 2026-08-09

---

## 业务术语

| 术语 | 英文 | 说明 |
|---|---|---|
| 归档 | Archive | 通过 scripts 离线抓取并存库的数据集合 |
| 推文流 | Tweet Stream | 主时间线的主体内容实体，含 FullText/Media/Metrics/Context |
| 那年今日 | Last Years Today | 历史年份同月同日的推文集合 |
| 媒体墙 | Media Wall | 仅含图片/视频附件的推文网格视图 |
| IG 帖子 | IG Post | Instagram 帖子（含图片/视频/Reels），存于 `ins_posts` 表 |
| 无限滚动 | Infinite Scroll | 滚动到底部自动加载下一页的浏览模式 |
| 分页器 | Pagination | 精确跳转特定页码的浏览模式 |

## 产品术语

| 术语 | 英文 | 说明 |
|---|---|---|
| 混合导航 | Hybrid Navigation | 无限滚动（沉浸）+ 分页器（定位）并存 |
| 硬重载 | Hard Reload | 过滤器变更时推文流完全重载，非客户端本地过滤 |
| 草稿模式 | Draft State | 复杂筛选器选择时不立即生效，点"应用"才写入 URL |
| 状态同步协议 | State Sync Protocol | URL 与前端状态双向强一致（React Router loader 驱动） |
| 用户隔离 | User-Isolated | 上下文始终限定在当前选定归档用户范围内 |

## 技术术语

| 术语 | 英文 | 说明 |
|---|---|---|
| 服务端驱动分页 | Server-Driven Pagination | `PaginatedResponse.meta.hasMore` 控制加载 |
| 结构化列 | Structured Column | `tweetId`/`fullText`/`createdAt` 等用于高效查询的列 |
| JSON 列 | JSON Column | `jsonData` 存储完整 `EnrichedTweet`/`EnrichedUser` |
| 双层缓存 | Double-Layer Cache | 服务端 `SimpleLRUCache` + 客户端 `axios-cache-interceptor` |
| URL 驱动状态 | URL-Driven State | 分页/筛选/排序全在 URL query params |
| ins→twitter 映射 | Mapping | `mapping.ts` 维护 IG username → twitter username |
| SSR + SPA 混合 | SSR + SPA Hybrid | 首屏服务端渲染，后续交互纯客户端 |

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
