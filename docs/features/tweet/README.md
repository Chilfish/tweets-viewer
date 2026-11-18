# 推文富卡片

> 本目录记录推文内嵌卡片的解析与渲染约定。范围：链接卡、媒体轮播卡、投票卡、Trending 卡、Space 卡。
> X Article（长文）暂不在此范围（本项目归档场景暂时用不到）。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [carousel-card.md](./carousel-card.md) | `image_card` / `image_carousel` / `video_card` 的解析与渲染 |
| [poll-card.md](./poll-card.md) | 投票推文（文字 / 带图）的解析与只读展示 |
| [trending-card.md](./trending-card.md) | `jetfuel_attachment` → Trending 卡片增强 |
| [transaction-id.md](./transaction-id.md) | X client transaction ID 与外壳 cookie 修复 |

## 代码落点

| 层 | 文件 |
| --- | --- |
| 原始请求 | `packages/rettiwt-api/requests/Tweet.ts` |
| 外壳 / transaction | `packages/rettiwt-api/services/public/FetcherService.ts` |
| 卡片解析 | `packages/rettiwt-api/helper/parseTweet.ts` · `packages/rettiwt-api/parsers/{jetfuel,poll}.ts` |
| 数据模型 | `packages/rettiwt-api/types/enriched/{card,poll,index}.ts` |
| 渲染 | `apps/web-react/app/components/tweet/{TweetCard,CarouselCard,PollCard,TrendingCard,TweetSpaceCard}.tsx` |

## 渲染顺序

在 `TweetNode` 中，正文之后的顺序固定为：

1. 投票卡（`tweet.poll`）
2. 媒体（`tweet.media_details`，图片 / 视频）
3. 媒体 alt 文本
4. 链接卡：Trending → 媒体轮播 → 普通卡（由 `TweetLinkCard` 内部分发）
5. Space 卡（`tweet.space`）
6. 引用推文（`tweet.quoted_tweet`）

同一份内容不重复渲染：Space / 文章 / 轮播卡承载的链接不再额外渲染成普通链接卡。

## 归档场景的差异

与在线 BFF 不同，本项目是离线归档阅读器：

- 没有媒体代理，`MediaImage` 直接用 `pbs.twimg.com` / `video.twimg.com` 原始 URL（全站 `referrer=no-referrer` 绕过防盗链）。
- 没有截图导出、翻译、AI Vision，卡片组件只负责只读展示。
- 没有读时回填：卡片解析在抓取入库时完成，旧数据重新抓取后自然升级。
