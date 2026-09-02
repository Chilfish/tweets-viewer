# 统一 SNS API 接口契约（API Contract）

> **文档性质**：新项目后端 REST API 接口定义（前端消费契约）。风格完全继承本项目
> `docs/API_DOCUMENTATION.md`：`PaginatedResponse<T>` 包裹、keyset 游标、Cache-Control 头。
>
> 基础 URL 约定：开发 `http://localhost:3000`；生产按部署环境注入（本项目的 `API_URL` 由
> `vite.config.ts` 注入 `import.meta.env.VITE_API_URL` 模式原样保留）。

---

## 1. 通用约定

### 1.1 PaginatedResponse（复用 `packages/shared/types.ts`）

```ts
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
    nextCursor?: string   // keyset 游标：排序列 = created_at（ISO 字符串字典序）
  }
}
```

- **游标协议**：`meta.nextCursor` 在 `hasMore=true` 时返回；客户端无限滚动用 `?cursor=<值>` 续载，不写 URL。
- **分页器**：定位模式用 `?page=N`（offset 定位），URL 驱动（对齐本项目「URL 作为唯一真值来源」）。
- **过滤器变更 = 硬重载**：`platform` / `start` / `end` / `q` / `type` 任一变化，前端重置流（不做客户端本地过滤）。

### 1.2 缓存头

- 帖子/媒体列表：`Cache-Control: public, max-age=300, s-maxage=3600`（浏览器 5 分钟 + CDN 1 小时）。
- 作者列表：`s-maxage=86400`（24h）。
- 与归档更新节奏（每日增量）匹配；`cleanVersion` 变更时服务端可主动失效。

### 1.3 错误格式

```json
{ "error": "keyword is required", "code": 400 }
```

错误码：`400` 参数缺失/非法 · `404` 资源不存在 · `429` 限流 · `500` 服务端。

---

## 2. 端点总览

| 端点 | 说明 |
|---|---|
| `GET /api/v1/authors` | 全部归档作者（跨平台档案） |
| `GET /api/v1/authors/:username` | 单个作者档案（含平台账号列表） |
| `GET /api/v1/posts` | 统一帖子流（分页/平台/时间/搜索/回复过滤） |
| `GET /api/v1/posts/:platform/:postId` | 单条帖子 |
| `GET /api/v1/media` | 媒体墙（展平媒体项，分页） |
| `GET /api/v1/posts/:username/last-years-today` | 「那年今日」 |
| `GET /api/v1/stats` | 归档统计（按平台/年份） |
| `GET /api/proxy/image?url=` | 媒体图片代理（跨域 CORS） |

---

## 3. Authors 模块

### 3.1 获取全部作者

- **Endpoint**: `GET /api/v1/authors`
- **Response**: `UnifiedAuthor[]`（跨平台合并：同一自然人多个平台账号合为一个作者条目，`platforms: UnifiedPlatform[]`）

```jsonc
[
  {
    "id": "yuno",
    "displayName": "千石ユノ",
    "platforms": ["x", "instagram", "youtube"],
    "accounts": [
      { "platform": "x", "username": "yuno_yumemita", "profileUrl": "https://x.com/yuno_yumemita", "avatarUrl": "..." },
      { "platform": "instagram", "username": "yuno_ig", "profileUrl": "..." }
    ]
  }
]
```

### 3.2 获取单个作者

- **Endpoint**: `GET /api/v1/authors/:username`
- **Response**: 作者档案对象（同上结构 + `description` / `followersCount` 等平台统计）
- **404**: `{ "error": "Author not found" }`

---

## 4. Posts 模块（核心）

### 4.1 统一帖子流

- **Endpoint**: `GET /api/v1/posts`

- **Query Parameters**:

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `username` | string | — | 限定作者（可选；不填 = 跨作者全库检索） |
| `platform` | string | — | 平台过滤（`x/instagram/youtube/...`；可逗号分隔多值 `platform=x,instagram`） |
| `type` | string | — | 帖子类型过滤（`post/repost/quote/reply`；`exclude=repost` 支持排除转帖，对齐 noReplies 语义） |
| `q` | string | — | 全文关键词搜索 |
| `start` / `end` | string(ISO) | — | 日期范围 |
| `sort` | `desc` / `asc` | `desc` | 时间序（`reverse` 语义改名，保持 `reverse=true` 兼容亦可） |
| `page` | number | 1 | 定位页码 |
| `pageSize` | number | 15 | 每页（对齐 PAGE_SIZE） |
| `cursor` | string | — | keyset 续载（优先于 `page`） |

- **Response**: `PaginatedResponse<UnifiedPost>`

> ⚠️ **响应分层**：`UnifiedPost` 是「最坏情况兼容」模型（DATA-MODEL §1/§3）—— 响应体可能**只含 Core 字段**
> （`id/platform/url/text/createdAt/author/media[]`），`type/entities/metrics/tags/lang/extra` 等 Rich/Extra 字段
> 仅在平台提供时出现。前端必须按字段存在性渲染，**禁止假设任何响应含富文本实体或指标**。
> 下面的示例是「全字段最富有形态」，仅作演示：

```jsonc
{
  "data": [
    {
      "id": "x:1837721123123",
      "platform": "x",
      "url": "https://x.com/yuno_yumemita/status/1837721123123",
      "text": "ライブありがとうございました！",
      "lang": "ja",
      "createdAt": "2026-08-31T15:00:00.000Z",
      "author": { "username": "yuno_yumemita", "displayName": "千石ユノ", "platform": "x", "profileUrl": "..." },
      "entities": [ { "index": 0, "type": "text", "text": "ライブありがとうございました！" } ],
      "type": "post",
      "media": [],
      "metrics": { "likes": 1221, "reposts": 89, "views": 30211 },
      "tags": ["ライブ"]
    }
  ],
  "meta": { "total": 4217, "page": 1, "pageSize": 15, "hasMore": true, "nextCursor": "2026-08-30T10:00:00.000Z" }
}
```

### 4.2 单条帖子

- **Endpoint**: `GET /api/v1/posts/:platform/:postId`
- **Response**: `UnifiedPost`（含嵌套 `repostOf/quotedPost` 一层）

### 4.3 那年今日

- **Endpoint**: `GET /api/v1/posts/last-years-today`（`?username=` 必填 + 日期 `?date=MM-DD`，缺省当日）
- **Response**: `PaginatedResponse<UnifiedPost>`（跨平台合并回忆）

---

## 5. Media 模块

### 5.1 媒体墙

- **Endpoint**: `GET /api/v1/media`
- **Query**: `username` / `platform` / `start` / `end` / `page` / `pageSize` / `cursor` / `type`（photo/video）
- **Response**: `PaginatedResponse<FlatMediaItem>` —— 服务端直接派生平铺结构，前端零转换：

```jsonc
{
  "data": [
    {
      "id": "instagram:aBc123-2",        // postId-mediaIndex
      "postId": "instagram:aBc123",
      "platform": "instagram",
      "url": "https://cdn...jpg",
      "type": "photo",
      "width": 1080,
      "height": 1350,
      "aspectRatio": 1.25,
      "altText": "",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "post": { "id": "instagram:aBc123", "platform": "instagram", "url": "...", "text": "...", ... }
    }
  ],
  "meta": { "total": 892, "page": 1, "pageSize": 30, "hasMore": true, "nextCursor": "..." }
}
```

> 前端 `MediaWall` 依赖的 `FlatMediaItem` 字段（`lib/media.ts`）由服务端保证，`post` 内嵌提供灯箱详情。

---

## 6. 代理与静态

### 6.1 媒体图片代理

- **Endpoint**: `GET /api/proxy/image?url=<encoded>`
- **用途**：IG/YT CDN 图在浏览器有 `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` 风险（本项目 `IGCardHeader.tsx` 踩坑）；
  MediaImage 组件对该类 URL 自动改走代理。
- **Response**: 图片流（`Content-Type` 跟随源）+ `Cache-Control`。仅允许白名单域名（`cdninstagram.com` / `fbcdn.net` / `yt3.ggpht.com` 等）。

> 实现参考：本项目 dev 阶段用 vite proxy 把 `/api` 转发到 API 服务；生产由 API 服务（Cloudflare Workers/Hono）实现
> 同源代理路由（`fetch` 源图回传），避免前端碰到跨域。

### 6.2 静态回退

- 保留本项目 `staticUrl` 模式：归档可导出静态 JSON 快照（`/static/posts.json`），无 API 时前端读静态壳（fallback 数据）。

---

## 7. 实现备注（继承本项目服务端模式）

1. **Hono + Drizzle**：`routes/posts.ts` 参照 `routes/tweets.ts` + `routes/ins.ts`（Hono 子应用、`c.var.db`、Cache-Control 头）。
2. **服务端缓存**：`SimpleLRUCache`（本项目 `utils/lru-cache.ts`）缓存总数/分页扫描；客户端 `axios-cache-interceptor` 缓存响应。
3. **限流**：Cloudflare Workers 层 + `hono-rate-limiter`（对齐本项目 200 req/60s + KV binding）。
4. **keyset 索引**：`(author_name, created_at DESC)` + `(platform, created_at DESC)` 复合索引，游标过滤 `WHERE created_at < :cursor`（游标仅字符串 ISO）。
5. **可选扩展**：`?translate=true` 把 XX 翻译字段并入响应（对齐本项目 Entity.translation 的先例，需清洗侧预留）；`/api/v1/export` 下载归档 JSON。