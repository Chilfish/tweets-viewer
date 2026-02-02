# API Documentation

本文档描述了 `/v3/tweets` 和 `/v3/users` 模块的 API 接口定义。

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

- **Response**: `PaginatedResponse<EnrichedTweet>`

### 2. 搜索推文

在指定用户或全局范围内搜索关键词推文。

- **Endpoint**: `GET /v3/tweets/search`

- **Query Parameters**:
  - `q` (string, **required**): 搜索关键词
  - `name` (string, optional): 指定用户的 Screen Name，若不填则可能为全局或默认范围
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
