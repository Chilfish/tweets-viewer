# API Documentation

本文档描述了 Tweets Viewer API 的完整接口定义，涵盖 `/v3/tweets`、`/v3/users`、`/v3/image` 和 `/v3/ins` 模块。

> 基础 URL：`https://tweet-api.chilfish.top` (生产) / `http://localhost:3000` (开发)

## 通用类型定义

### PaginatedResponse<T>

通用分页响应格式。

```typescript
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
    nextCursor?: number | string  // keyset 游标（滚动续载用，见下）
  }
}
```

> **分页协议（keyset 转正，2026-08-13）**：
> - `meta.nextCursor` 在 `hasMore` 为 true 时返回（tweets 系列端点）。无限滚动用 `?cursor=<值>` 续载下一页，
>   深翻页不随页码退化；分页器跳页仍用 `?page=N`（offset 定位）。
> - 排序键 = `COALESCE(jsonData->>'retweeted_original_id', "tweetId")`（snowflake，时间有序）。
> - IG 帖子量级小，保持 offset 分页，`nextCursor` 不返回。

### 缓存头

归档数据每日一变，所有 `/v3/tweets/*`、`/v3/ins/*` 响应带 `Cache-Control: public, max-age=300, s-maxage=3600`（浏览器 5 分钟 + CDN 1 小时）；`/v3/users/*` 带 `s-maxage=86400`（24h）。

### EnrichedTweet

推文详情对象，包含推文内容、媒体信息、统计数据等。
(类型定义引用自 `@tweets-viewer/rettiwt-api`)

### EnrichedUser

用户详情对象，包含用户资料、关注数、粉丝数等。
(类型定义引用自 `@tweets-viewer/rettiwt-api`)

---

## Tweets 模块 ( `/v3/tweets`)

### 1. 获取用户推文列表

获取指定用户的推文列表，支持分页和按日期范围筛选。

- **Endpoint**: `GET /v3/tweets/get/:name`

- **Params**:
  - `name` (string): 用户 Screen Name (ID)

- **Query Parameters**:
  - `page` (number, default: 1): 页码
  - `pageSize` (number, default: 10): 每页数量
  - `reverse` (boolean, default: false): 是否按时间倒序排列 (true 为旧 -> 新, false 为新 -> 旧)
  - `cursor` (string, optional): keyset 游标，滚动续载下一页（优先于 `page`）
  - `start` (string, ISO Date, optional): 筛选开始日期
  - `end` (string, ISO Date, optional): 筛选结束日期
  - `noReplies` (boolean, default: false): 是否排除回复推文

- **Response**: `PaginatedResponse<EnrichedTweet>`

### 2. 搜索推文

在指定用户或全局范围内搜索关键词推文。

- **Endpoint**: `GET /v3/tweets/search`

- **Query Parameters**:
  - `q` (string, **required**): 搜索关键词
  - `name` (string, optional): 指定用户的 Screen Name；**不填时全库检索**（跨用户全局搜索）
  - `page` (number, default: 1): 页码
  - `pageSize` (number, default: 10): 每页数量
  - `reverse` (boolean): 排序方向
  - `cursor` (string, optional): keyset 游标

- **Response**: `PaginatedResponse<EnrichedTweet>`

- **Error Response**:
  - 400 Bad Request: `{ "error": "keyword is required" }` (当缺少 `q` 参数时)

### 3. 获取“那年今日”推文

获取指定用户在历史年份同一天的推文。

- **Endpoint**: `GET /v3/tweets/get/:name/last-years-today`

- **Params**:
  - `name` (string): 用户 Screen Name

- **Query Parameters**:
  - `page` (number, default: 1)
  - `pageSize` (number, default: 10)
  - `reverse` (boolean)
  - `cursor` (string, optional): keyset 游标

- **Response**: `PaginatedResponse<EnrichedTweet>`

### 4. 获取用户推文按年统计

用户推文按年分布（档案完整性指示：覆盖年份范围 + 每年条数）。

- **Endpoint**: `GET /v3/tweets/stats/:name`

- **Params**:
  - `name` (string): 用户 Screen Name

- **Response**: `{ year: number, count: number }[]`（按年份降序）

### 5. 获取媒体推文列表

获取指定用户所有含图片/视频附件的推文（排除转推）。

- **Endpoint**: `GET /v3/tweets/medias/:name`

- **Params**:
  - `name` (string): 用户 Screen Name

- **Query Parameters**:
  - `page` (number, default: 1): 页码
  - `pageSize` (number, default: 10): 每页数量
  - `reverse` (boolean): 排序方向
  - `cursor` (string, optional): keyset 游标
  - `start` / `end` (string, ISO Date, optional): 日期范围（媒体按年/日期段浏览，可单独提供）

- **Response**: `PaginatedResponse<EnrichedTweet>`

---

## Users 模块 ( `/v3/users`)

### 1. 获取所有用户

获取数据库中记录的所有用户信息。

- **Endpoint**: `GET /v3/users/all`
- **Response**: `EnrichedUser[]`

### 2. 获取指定用户信息

根据 Screen Name 获取单个用户信息。

- **Endpoint**: `GET /v3/users/get/:name`

- **Params**:
  - `name` (string): 用户 Screen Name

- **Response**: `EnrichedUser`

- **Error Response**:
  - 404 Not Found: `{ "error": "User not found" }`

---

## Image 模块 ( `/v3/image`)

### 1. 获取随机图片

- **Endpoint**: `GET /v3/image/get`
- **Response**: `{ url: string, ... }` — 随机图片数据

### 2. 获取所有图片

- **Endpoint**: `GET /v3/image/all`
- **Response**: 图片数据数组

### 3. 更新图片缓存

- **Endpoint**: `GET /v3/image/update`
- **Response**: `{ success: boolean, size?: number }`

---

## Ins 模块 ( `/v3/ins`)

提供 Instagram 帖子和用户信息的查询端点。`:name` 参数为 **twitter username**（非 IG username），服务端通过 `users.ins_json_data` 查找对应的 IG 用户信息。

### 1. 获取 IG 用户信息与帖子

- **Endpoint**: `GET /v3/ins/:name`

- **Params**:
  - `name` (string): 用户的 twitter userName

- **Query Parameters**:
  - `page` (number, default: 1): 页码

- **Response**: `{ user: IGUserInfo | null, posts: PaginatedResponse<IGPost> }`

- **Error Response**:
  - 404 Not Found: `{ user: null, posts: { data: [], meta: {...} } }` (用户无 IG 数据且无帖子时)

### IGUserInfo

```typescript
interface IGUserInfo {
  username: string       // Instagram 用户名
  fullname: string       // 显示名称
  avatar_url?: string    // 头像 URL
  verified?: boolean     // 是否认证
  bio?: string           // 简介
  external_url?: string  // 外部链接
  followers_count?: number
  following_count?: number
  posts_count?: number
}
```

### IGPost

```typescript
interface IGPost {
  id: string             // 短码 (shortcode)
  post_id: string        // 帖子 ID
  url: string            // 帖子链接
  username: string       // IG 用户名
  fullname: string       // 显示名称
  description: string    // 帖子描述
  tags?: string[]        // 标签
  likes: number          // 点赞数
  type: 'post' | 'reel'  // 帖子类型
  media: IGMedia[]       // 媒体列表（图片/视频）
  avatar_url?: string    // 头像
  created_at: string     // 发布时间 (ISO)
  location_name?: string // 位置标签
  audio?: IGAudio        // 音频信息 (Reels)
  coauthors?: unknown[]  // 协作者
  verified?: boolean     // 是否认证
}
```
