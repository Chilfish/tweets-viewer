# 数据结构

接口返回的字段名以实际 JSON 为准。类型定义在仓库里：

- `EnrichedTweet` / `EnrichedUser` / `MediaDetails` / `Card`：`packages/tweet-types/`
- `PaginatedResponse` / `IGPost` / `IGUserInfo` / `IGMedia`：`packages/shared/types.ts`
- OpenAPI schema：`tweets-viewer-openapi.json`

## PaginatedResponse\<T\>

```ts
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
    nextCursor?: number | string
  }
}
```

- `total` 是当前过滤条件下的总数。
- `nextCursor` 只在 `hasMore` 为 true 且本页有数据时返回。
- IG 的 `posts` 也是这个信封，但不返回 `nextCursor`，`pageSize` 固定 15。

## EnrichedTweet

`data[]` 的元素。核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 推文 id（被转原推的 id） |
| `url` | string | 推文链接 |
| `text` | string | 正文，保留 `&amp;` 等 HTML 实体与 `t.co` 短链 |
| `lang` | string | 语言码，如 `en` / `ja` / `zxx` |
| `created_at` | string | Twitter 原生格式，如 `Tue Sep 15 08:00:02 +0000 2026` |
| `user` | `TweetUser` | 作者 |
| `entities` | `Entity[]` | 正文实体（链接、hashtag、mention） |
| `media_details` | `MediaDetails[]` | 图片 / 视频 / GIF |
| `parent_id` | string? | 回复的父推 id |
| `in_reply_to_screen_name` | string? | 回复对象的 Screen Name |
| `quoted_tweet_id` | string? | 被引用推文 id |
| `quoted_tweet` | `EnrichedTweet`? | 被引用推文完整对象 |
| `retweeted_original_id` | string? | **转推动作自身**的事件 id，不是原推 id |
| `like_count` / `retweet_count` / `reply_count` / `view_count` | number? | 计数 |
| `card` / `poll` / `space` | object? | 链接卡片 / 投票 / X Space |

## TweetUser

| 字段 | 说明 |
| --- | --- |
| `id_str` | 用户 id |
| `name` | 显示名 |
| `screen_name` | X Screen Name |
| `profile_image_url_https` | 头像 |
| `is_blue_verified` | 蓝标 |
| `verified` | 认证 |
| `profile_image_shape` | `Circle` / `Square` / `Hexagon` |

## MediaDetails

三种 `type`：`photo` / `video` / `animated_gif`。

| 字段 | 说明 |
| --- | --- |
| `media_url_https` | 图片或视频封面 |
| `type` | 媒体类型 |
| `index` | 在推文中的序号 |
| `original_info` | `{ width, height }` |
| `video_info` | 视频/GIF 独有：`duration`、`aspect_ratio`、`variants[]` |
| `ext_alt_text` | 图片 alt 文本 |

`variants[]` 里取 `content_type === 'video/mp4'` 的 `url` 播放。

## EnrichedUser

`users` 相关端点返回 camelCase 字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 用户 id |
| `userName` | Screen Name |
| `fullName` | 显示名 |
| `profileImage` / `profileBanner` | 头像 / 横幅 |
| `description` | 简介 |
| `createdAt` | 注册时间（ISO） |
| `isVerified` | 认证 |
| `url` | 主页链接 |
| `location` | `{ location?: string }`，注意是对象不是字符串 |
| `followersCount` / `followingsCount` / `statusesCount` / `likeCount` | 计数 |
| `pinnedTweets` | 置顶推文 id 数组 |
| `birthdayString` | 生日文本 |

## YearStat

```ts
{ year: number, count: number }
```

按年份降序。年份按事件时间统计：转推计入转发发生的年份。

## ImageEntry

```ts
{ url: string, tweet: EnrichedTweet }
```

`url` 是随机选中的 `media_details[].media_url_https`，`tweet` 是来源推文完整对象。

## IGUserPageResponse

```ts
{
  user: IGUserInfo | null
  posts: PaginatedResponse<IGPost>
}
```

### IGUserInfo

| 字段 | 说明 |
| --- | --- |
| `username` | IG 用户名 |
| `fullname` | 显示名 |
| `avatar_url` | 头像 |
| `verified` | 认证 |
| `bio` | 简介 |
| `external_url` | 外部链接 |
| `followers_count` / `following_count` / `posts_count` | 计数 |

### IGPost

| 字段 | 说明 |
| --- | --- |
| `id` | shortcode（路由主键） |
| `post_id` | 数字 id |
| `url` | 帖子链接 |
| `username` | IG 用户名 |
| `fullname` | 显示名 |
| `description` | caption |
| `tags` | hashtag 数组 |
| `likes` | 点赞数 |
| `type` | `post` / `reel` |
| `media` | `IGMedia[]` |
| `created_at` | ISO 时间 |
| `location_name` | 位置 |
| `verified` | 作者是否认证 |
| `coauthors` | 合作者数组 |
| `audio` | `IGAudio`，Reel 音乐信息 |

### IGMedia

| 字段 | 说明 |
| --- | --- |
| `num` | 帖子内序号 |
| `media_id` | 媒体 id |
| `shortcode` | 媒体级 shortcode |
| `display_url` | 图片/视频缩略图 |
| `video_url` | 视频地址，图片为 `null` / 缺失 |
| `width` / `height` | 缩略图尺寸 |
| `width_original` / `height_original` | 原图尺寸 |
| `type` | `photo` / `video` |
| `tagged_users` | 被 @ 用户 |

### IGAudio

`title`、`subtitle`、`artist`、`duration`、`cover_artwork_uri`、
`cover_artwork_thumbnail_uri`、`has_lyrics`、`is_explicit`。

## 错误与空结果

业务错误统一为 `{ "error": "..." }`，配 400 / 404 / 500。

`name` 不匹配 `^\w+$`、超过 50 字符、日期格式错误、`cursor` 非 1-19 位数字、
`reverse` / `noReplies` 不是 true/false/1/0，都返回 **400**，文案按字段给出。

未归档用户的语义不同：

| 端点 | 未归档时 |
| --- | --- |
| `/v3/users/get/:name` | **404** `{ "error": "User not found" }` |
| `/v3/tweets/get/:name` | **200** + 空数组 |
| `/v3/tweets/medias/:name` | **200** + 空数组 |
| `/v3/tweets/stats/:name` | **200** + 空数组 |
| `/v3/tweets/get/:name/last-years-today` | **200** + 空数组 |
| `/v3/ins/:name` | 用户无 IG 数据且无帖子时 **404**，响应体仍是 `IGUserPageResponse` |
| `/v3/image/get` | 没有可用图片时 **404** `{ "error": "no image available" }` |
