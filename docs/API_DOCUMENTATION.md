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
    nextCursor?: number | string
  }
}
```

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
  - `start` (string, ISO Date, optional): 筛选开始日期
  - `end` (string, ISO Date, optional): 筛选结束日期
  - `noReplies` (boolean, default: false): 是否排除回复推文

- **Response**: `PaginatedResponse<EnrichedTweet>`

### 2. 搜索推文

在指定用户或全局范围内搜索关键词推文。

- **Endpoint**: `GET /v3/tweets/search`

- **Query Parameters**:
  - `q` (string, **required**): 搜索关键词
  - `name` (string, optional): 指定用户的 Screen Name；若不填则返回空
  - `page` (number, default: 1): 页码
  - `pageSize` (number, default: 10): 每页数量
  - `reverse` (boolean): 排序方向

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

### 4. 获取媒体推文列表

获取指定用户所有含图片/视频附件的推文（排除转推）。

- **Endpoint**: `GET /v3/tweets/medias/:name`

- **Params**:
  - `name` (string): 用户 Screen Name

- **Query Parameters**:
  - `page` (number, default: 1): 页码
  - `pageSize` (number, default: 10): 每页数量
  - `reverse` (boolean): 排序方向

- **Response**: `PaginatedResponse<EnrichedTweet>`

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

提供 Instagram 风格的静态数据端点，从远程 JSON (`p.chilfish.top`) 缓存后返回。

- **Endpoint**: `GET /v3/ins/*`
- **详细路由**: 见 `apps/server/routes/ins.ts`
