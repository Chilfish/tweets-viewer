# 统一 SNS 帖子数据模型（Unified Post Data Model）

> **文档性质**：这是新项目（Unified SNS Viewer）的核心契约 —— 定义所有平台抓取数据清洗后的**统一存储格式**、
> **前端消费的 TypeScript 类型**与 **JSON Schema 校验规则**。它是前端 UI、后端 API、抓取适配器三方的共同语言。
>
> 设计继承自本项目（tweets-viewer）的既有模式：
> - `EnrichedTweet` / `IGPost` 的「结构化字段 + 完整 JSON」双轨结构
> - `Entity[]` 富文本实体化（见 `packages/rettiwt-api/types/enriched/entities.ts` 与 `app/components/RichText.tsx`）
> - `PaginatedResponse<T>` 统一分页协议（`packages/shared/types.ts`）

---

## 1. 设计原则

> ⚠️ **最重要的一条：以「最坏情况」为基线设计，不是以 EnrichedTweet 为基线。**
> X 的 `EnrichedTweet`/`Entity` 是**最富有的平台形态**，绝不是通用前提 —— 大多数平台抓下来就是「纯文本 + 几张图片」。
> 统一模型必须保证：**任何平台的数据（哪怕只是纯文本 + 媒体 URL）都能无损落入统一 schema，并被基础 UI 正确渲染。**

1. **最坏情况优先（Worst-Case First）**：统一模型的核心层（Core）只包含**所有平台的交集**：
   `id / platform / url / text / createdAt / author / media[]`。富文本实体、指标、转帖/引用、标签、语言、尺寸等
   一律是**可选富化层（Rich Layer）**——平台能提供才填，前端按「字段是否存在」渐进增强渲染，而不是按平台分支。
2. **能力分层（Capability Layering）**：字段按三层组织 —— **Core（全平台必有）→ Rich（平台可选提供）→ Extra（平台专属）**。
   层与层之间互不依赖：Core 可以独立渲染；Rich 缺失时回落为文本/无指标/无嵌套；Extra 只由平台特化组件消费。
3. **平台能力矩阵 = 能力上限声明**：矩阵声明的是某平台「最多可能提供」哪些 Rich/Extra 字段（该平台的天花板），
   **不是模型要求**。同一平台不同帖子也可能缺字段（历史帖无指标、抓取失败缺媒体），前端必须都能渲染。
4. **只存「可展示」数据**：清洗过程丢弃反爬噪音、无用嵌套、内部 ID 冗余，输出即前端可直接渲染的 Core 结构；
   Rich/Extra 是「锦上添花」的增强，不影响基础渲染通路。
5. **原文与媒体都保留**：正文存纯文本 `text`；`entities`（Rich 层，可选）由清洗阶段解析（链接/@/#），
   不存在时前端用正则兜底解析（本项目 RichText 已有该能力）。
6. **链接引用不深嵌**：转帖/引用帖子只嵌套**一层**（`repostOf` / `quotedPost`），深层引用扁平化，防止 JSON 爆炸
   （对齐 Twitter 引推处理；这也是 Rich 层的可选字段，Core 无嵌套承诺）。

> **一句话验收标准**：拿「一条只有 text + username + createdAt + 一张图片 URL」的数据，
> 不写任何平台判断，基础 UI 必须能正确渲染成一张可读的帖子卡片。

---

## 2. 平台枚举与能力矩阵

> 能力矩阵是**能力上限声明**：描述该平台「最多可能提供」哪些 Rich/Extra 字段（天花板）；
> **缺字段不是错误**，前端以「字段存在性」渲染，永不假设某平台必有某项。

```ts
/** 平台标识 —— 全部小写字母，作为稳定协议值（存储/路由/图标 key 共用） */
export type UnifiedPlatform =
  | 'x'          // Twitter / X
  | 'instagram'  // Instagram（含 Reels）
  | 'youtube'    // YouTube（社区帖 / Shorts / 普通视频）
  | 'bilibili'   // Bilibili（动态 / 视频）
  | 'weibo'      // 微博
  | 'reddit'     // Reddit
  | 'bluesky'    // Bluesky（AT 协议）
  | 'mastodon'   // Mastodon（ActivityPub）
  | 'threads'    // Threads
  | 'tiktok'     // TikTok / 抖音
  | 'xiaohongshu'// 小红书
  // 注：新增平台 = 加枚举 + 加适配器 + 加能力矩阵行，前端组件零改动（见 §9）
```

```ts
/** 平台能力矩阵 —— 能力上限声明（非模型要求），供前端渐进增强与调试面板使用 */
export interface PlatformCapabilities {
  platform: UnifiedPlatform
  /** 是否有转帖/转发（→ Rich 层 enabled） */
  supportsRepost: boolean
  /** 是否有引用帖子（→ Rich 层 enabled） */
  supportsQuote: boolean
  /** 是否有回复上下文（→ Rich 层 enabled） */
  supportsReply: boolean
  /** 正文是否解析出富文本实体（→ Rich 层 enabled；缺失回退 RichText 正则） */
  hasEntities: boolean
  /** 媒体类型覆盖（Core 层至少 'photo'；视频/音频为扩展） */
  mediaTypes: UnifiedMediaType[]
  /** 指标覆盖（→ Rich 层 metrics 可用集） */
  metrics: ('likes' | 'reposts' | 'replies' | 'views')[]
  /** 是否有平台专属 extra 展示（IG 音乐 / YT 频道等） */
  hasExtra: boolean
}
```

> **实现建议**：`PLATFORM_CAPABILITIES` 作为常量表放在 `packages/shared/`（参考 `constant.ts` 的集中管理模式），
> `UnifiedPlatform` 同时作为路由参数与数据库外键的一部分。

---

## 3. 核心类型定义（TypeScript）

> 拷贝自 `packages/shared/types.ts` 的 `PaginatedResponse<T>` 作为所有列表响应的统一包裹层，**原样复用**。
>
> **分层总览**（本节全部字段按层组织）：

```
┌─ Core 层（所有平台必有，前端基础渲染只依赖这层）───────────────┐
│   id · platform · url · text · createdAt · author · media[]   │
├─ Rich 层（平台可选提供，字段存在才渲染，缺省有回落）──────────┤
│   lang · type · entities · metrics · tags · repostOf ·        │
│   quotedPost · inReplyTo                                       │
├─ Extra 层（平台专属，只由 platform 特化组件消费）──────────────┤
│   extra（IG 音乐 / YT 时长 / 微博来源 / B 站 dynType …）       │
└─ Meta 层（清洗审计，前端不展示）───────────────────────────────┘
```

### 3.1 UnifiedPost —— 统一帖子

```ts
export interface UnifiedPost {
  // ════ Core 层：所有平台都能提供，前端基础渲染只依赖这层 ════
  /** 全局唯一 ID：`${platform}:${platformPostId}`（如 `x:1837721123123`）。数据库主键 */
  id: string
  /** 平台标识（判别字段） */
  platform: UnifiedPlatform
  /** 平台的 URL 深层链接（前端「在源平台查看」用） */
  url: string
  /** 帖子原文（纯文本；媒体说明文案已并入 text，见 §6.2）。**无实体平台只填这层也能完整渲染** */
  text: string
  /** 发布时间 ISO 8601（UTC）。缺失时可用抓取时间近似（见 §6.1） */
  createdAt: string
  /** 作者（内嵌快照，不单独建表 —— 对齐 users 表 + jsonData 模式） */
  author: UnifiedAuthor
  /** 媒体列表（空数组 = 纯文本帖；最低形态 = list of {id,type:'photo',url}） */
  media: UnifiedMedia[]

  // ════ Rich 层：平台具备能力才提供；缺省时前端必有回落渲染 ════
  /** 语言代码（清洗嗅探或源数据）；用于字体回退（app.css 的 [lang] 规则）。缺省按无语言处理 */
  lang?: string
  /** 帖子类型语义（缺省 = 当作普通 post 渲染） */
  type?: UnifiedPostType
  /** 富文本实体（缺省 = 前端 RichText 正则兜底解析，仍能渲染链接/@/#） */
  entities?: UnifiedEntity[]
  /** 指标（缺省 = 不渲染指标行） */
  metrics?: UnifiedMetrics
  /** 话题标签（#tag 清洗提取，供筛选；缺省 = 无标签徽章） */
  tags?: string[]
  /** 转发的原帖（嵌套一层；缺省 = 无转帖横幅） */
  repostOf?: UnifiedPost
  /** 引用的帖子（嵌套一层；缺省 = 无引用框） */
  quotedPost?: UnifiedPost
  /** 回复上下文（缺省 = 无「回复 @xxx」提示） */
  inReplyTo?: {
    /** 被回复的作者 */
    author: Pick<UnifiedAuthor, 'username' | 'displayName'>
    /** 被回复的帖子 URL（可为空） */
    url?: string
  }

  // ════ Extra 层：平台专属，由 platform 特化组件消费 ════
  /** 平台专属扩展数据（类型安全，见 §5）。缺省 = 无特化展示 */
  extra?: UnifiedExtra

  // ════ Meta 层：清洗审计，前端不展示 ════
  meta?: {
    /** 抓取时间 */
    fetchedAt?: string
    /** 是否来自本地归档离线快照（无绝对时间平台的近似时间标记） */
    archived?: boolean
    /** 清洗版本（清洗逻辑变更时递增，用于全量重洗） */
    cleanVersion?: number
  }
}

export type UnifiedPostType =
  | 'post'      // 普通帖子 / 图文 / 动态 / 视频
  | 'repost'    // 转发 / 转帖 / 分享
  | 'quote'     // 引用帖子（带被引内容）
  | 'reply'     // 回复
  | 'article'   // 长文（微博头条文章 / X note / 公众号长文等）
```

### 3.2 UnifiedAuthor —— 统一作者（帖子内嵌快照 + 独立档案两种用法）

> Core 形态 = `{ username, platform, profileUrl }`；`displayName`/头像/认证为 Rich 扩展
> （最坏情况：只有用户名，前端直接展示 username）。

```ts
export interface UnifiedAuthor {
  // ════ Core 层 ════
  /** 平台内唯一用户名（X/IG/微博直接取；无用户名的平台用 ID 兜底） */
  username: string
  /** 平台 */
  platform: UnifiedPlatform
  /** 档案页 URL */
  profileUrl: string

  // ════ Rich 层（缺省回落：显示名缺失时直接展示 username） ════
  /** 展示名 */
  displayName?: string
  /** 头像 URL（清洗阶段做尺寸规整，见 §6.3；缺省 = 首字母 fallback） */
  avatarUrl?: string
  /** 认证标识 */
  verified?: boolean
  /** 简介（作者档案接口才填充；帖子内嵌快照可为空） */
  description?: string
  /** 平台专属作者信息 */
  extra?: Record<string, unknown>
}
```

### 3.3 UnifiedMedia —— 统一媒体项

> Core 形态 = `{ id, type:'photo', url }`（图片 URL 列表，所有平台可得）；视频/音频、尺寸、缩略图、
> 多码率为 Rich 扩展 —— 前端对应渲染分支缺省回落。

```ts
export type UnifiedMediaType = 'photo' | 'video' | 'animated_gif' | 'audio'

export interface UnifiedMedia {
  // ════ Core 层 ════
  /** 平台内媒体 ID（无 ID 时用 URL 的稳定 hash 兜底） */
  id: string
  /** 媒体类型（最坏情况 = 'photo'；其余为平台扩展） */
  type: UnifiedMediaType
  /** 展示用 URL（照片=原图/高清、视频=直链或播放页。见 §6.4 URL 规整） */
  url: string

  // ════ Rich 层（缺省回落：无封面则不显示封面、无尺寸走 aspect-square 兜底） ════
  /** 缩略图/封面 URL（视频/音频一般有；照片可等于 url） */
  previewUrl?: string
  /** 原始尺寸（缺失时前端用 aspectRatio 兜底，参考 MediaCard 的 aspectRatio 样式） */
  width?: number
  height?: number
  /** 备用清晰度列表（大图手术/多码率场景，见 §6.3） */
  variants?: {
    url: string
    width?: number
    height?: number
    /** 视频码率 bps（供前端选择） */
    bitrate?: number
    mime?: string
  }[]
  /** 视频信息（对齐 MediaDetails.video_info；缺省 = 按普通图/未知比例渲染） */
  videoInfo?: {
    /** 秒 */
    duration: number
    /** 宽:高 */
    aspectRatio: [number, number]
  }
  /** 替代文本（无障碍 + 媒体墙索引。最坏情况 = 空串） */
  altText?: string
  /** 平台专属媒体数据（IG 的 tagged_users、YT 的格式列表等） */
  extra?: Record<string, unknown>
}
```

### 3.4 UnifiedMetrics —— 统一指标

```ts
export interface UnifiedMetrics {
  likes?: number
  /** 转发/转帖数 */
  reposts?: number
  replies?: number
  views?: number
}
```

### 3.5 UnifiedEntity —— 统一富文本实体

```ts
/** 对齐本项目 entities.ts 的 Entity 联合，去掉平台特化字段 */
export interface UnifiedEntity {
  /** 在 text 中的顺序索引（渲染顺序） */
  index: number
  /** 原始片段文本 */
  text: string
  type: 'text' | 'hashtag' | 'mention' | 'url' | 'media' | 'separator'
  /** 跳转链接（hashtag/mention/url 有效） */
  href?: string
}
```

> **渲染契约**：`UnifiedEntity[]` 严格按 `index` 升序拼起来应等于 `text`（`media` 实体指正文里被省略的图片占位段，
> 渲染时输出 `null`；`separator` 为多图说明分隔符）。这保证前端 `RichText` 可以零改动渲染（见 UI-DESIGN §4.2）。

---

## 3b. JSON Schema（校验层草案）

TS 类型是编译期契约；运行时校验（导入脚本/API 入参/前端 debug）用 JSON Schema。以 `UnifiedPost` 为核心，
`$id` 建议 `https://unified-sns.dev/schema/unified-post.json`（或本地 `schema/` 目录）。

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://unified-sns.dev/schema/unified-post.json",
  "title": "UnifiedPost",
  "type": "object",
  "required": ["id", "platform", "url", "text", "createdAt", "author", "media"],
  // ↑ required 只含 Core 层字段（id/platform/url/text/createdAt/author/media[]）；
  //   type/entities/metrics/tags/lang/extra 等 Rich/Extra 层全部可选 —— 这就是最坏情况兼容
  "properties": {
    "id":            { "type": "string", "pattern": "^[a-z]+:[A-Za-z0-9_-]+$" },
    "platform":      { "enum": ["x", "instagram", "youtube", "bilibili", "weibo", "reddit", "bluesky", "mastodon", "threads", "tiktok", "xiaohongshu"] },
    "url":           { "type": "string", "format": "uri" },
    "text":          { "type": "string" },
    "lang":          { "type": "string", "pattern": "^[a-z]{2}(-[A-Za-z]{2,4})?$" },
    "createdAt":     { "type": "string", "format": "date-time" },
    "type":          { "enum": ["post", "repost", "quote", "reply", "article"] },
    "author": {
      "type": "object",
      "required": ["username", "displayName", "platform", "profileUrl"],
      "properties": {
        "username": { "type": "string" },
        "displayName": { "type": "string" },
        "platform": { "type": "string" },
        "profileUrl": { "type": "string", "format": "uri" },
        "avatarUrl": { "type": "string", "format": "uri" },
        "verified": { "type": "boolean" }
      }
    },
    "media": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "url"],
        "properties": {
          "id": { "type": "string" },
          "type": { "enum": ["photo", "video", "animated_gif", "audio"] },
          "url": { "type": "string", "format": "uri" },
          "previewUrl": { "type": "string", "format": "uri" },
          "width": { "type": "number", "minimum": 1 },
          "height": { "type": "number", "minimum": 1 },
          "altText": { "type": "string" },
          "videoInfo": {
            "type": "object",
            "required": ["duration", "aspectRatio"],
            "properties": {
              "duration": { "type": "number", "minimum": 0 },
              "aspectRatio": { "type": "array", "items": { "type": "number" }, "minItems": 2, "maxItems": 2 }
            }
          }
        }
      }
    },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["index", "type", "text"],
        "properties": {
          "index": { "type": "number", "minimum": 0 },
          "text": { "type": "string" },
          "type": { "enum": ["text", "hashtag", "mention", "url", "media", "separator"] },
          "href": { "type": "string", "format": "uri" }
        }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "likes": { "type": "number", "minimum": 0 },
        "reposts": { "type": "number", "minimum": 0 },
        "replies": { "type": "number", "minimum": 0 },
        "views": { "type": "number", "minimum": 0 }
      }
    },
    "repostOf":   { "$ref": "#" },   // 嵌套一层（深度限制由清洗器保证）
    "quotedPost": { "$ref": "#" },
    "extra":      { "type": "object" },
    "meta": {
      "type": "object",
      "properties": {
        "fetchedAt": { "type": "string", "format": "date-time" },
        "archived": { "type": "boolean" },
        "cleanVersion": { "type": "number", "minimum": 1 }
      }
    }
  },
  "unevaluatedProperties": true,  // 平台 extra/meta 允许扩展字段
  "additionalProperties": false
}
```

**工具链建议**：`ajv`（Node）做导入脚本校验 + `zod`（本项目 env 校验先例）生成运行时 TS 校验器并推导类型，
`zod` schema 作为 TS 类型的**单一事实来源**（`z.infer` 反推类型，避免 TS/JSON Schema 双写漂移）。
JSON Schema 版本用于非 TS 环境（Python 导入工具校验归档文件）。

---

## 4. 平台差异化槽位（UnifiedExtra）

`extra` 采用**判别联合**：`platform` 决定结构。前端用对应的 `<PlatformExtra />` 组件消费（IG 音乐、YT 均已有本项目先例：
`IGMusicInfo.tsx`、`IGAudio` 类型）。

```ts
export type UnifiedExtra =
  | InstagramExtra
  | YoutubeExtra
  | WeiboExtra
  | BilibiliExtra
  | Record<string, never>  // 无 extra 的平台

export interface InstagramExtra {
  /** 帖子/Reel 附带音频（对齐 IGAudio） */
  audio?: { title?: string, artist?: string, duration?: number, coverUrl?: string }
  /** 位置标签 */
  locationName?: string
  /** 合作者 */
  coauthors?: { username: string, displayName: string }[]
  /** IG 帖子风格：帖子/轮播/Reel */
  kind?: 'post' | 'carousel' | 'reel'
}

export interface YoutubeExtra {
  /** 视频时长（社区帖视频无） */
  duration?: number
  /** 频道标签/栏目 */
  playlists?: string[]
  /** 点赞/不喜欢 可分平台元数据 */
  category?: string
}

export interface WeiboExtra {
  /** 来源客户端（如 "来自 iPhone"） */
  source?: string
  /** 转发时附加的评论 */
  forwardComment?: string
}

export interface BilibiliExtra {
  /** 动态分类：图文 / 视频 / 专栏 / 转发 */
  dynType?: 'plain' | 'image' | 'video' | 'article' | 'forward'
  /** 视频 aid/bvid */
  bvid?: string
}
```

---

## 5. 分页协议（复用 PaginatedResponse）

```ts
// packages/shared/types.ts —— 原样复用
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
    nextCursor?: number | string  // keyset 游标
  }
}
```

- **keyset 排序键**：`createdAt`（ISO 字符串天然字典序 = 时间序）。游标 = 最后一条的 `createdAt` 精确值（可选 `+id` 消歧）。
- **探索模式（无限滚动）**：`?cursor=` 续载，不写 URL；**定位模式（分页器）**：`?page=N` 替换。（对齐本项目 4B 规范）
- **过滤**：`platform` / `author` / `start` / `end` / `q`（全文）/ `type`（repost/quote/…）。过滤器变更 = 硬重载，不做客户端本地过滤。

---

## 6. 清洗规范（Clean Pipeline）

每个平台的**适配器（Adapter）**负责把第三方工具输出 → `UnifiedPost[]`。统一清洗规则如下：

### 6.1 时间归一
- 平台时间字符串 → UTC ISO：`new Date(raw).toISOString()`。
- **无绝对时间的平台**（YouTube 社区帖渲染的是相对时间"2 years ago"）：用**抓取时刻近似**，并置 `meta.archived=true`、
  在 `meta.fetchedAt` 记录抓取时间（本项目 YouTube 调研已确认此坑，见 RESEARCH.md）。

### 6.2 文本归一
- 多段文本拼接：IG caption 把「@用户 正文」合并入 `text`、X note 取 `note_tweet.text`、微博长文取全文——统一成一条连续的 `text`。
- **实体解析规则**：清洗阶段尽量产出 `UnifiedEntity[]`（用源 API 的实体数据）；源没有实体时**省略** `entities`，
  前端 `RichText`（本项目已有实现）做正则兜底。**禁止**在存储时用 HTML/富文本 string 存正文。
- 回复前缀：开头是 `@user ` 的回复，拆出 `inReplyTo`，`text` 保留全文（对齐 RichText.getReplyInfo 语义）。

### 6.3 图片 URL 规整（原图手术）
- **只存原图/最高清晰度**：X/IG/YT 的 CDN 缩略图 URL 都有清晰度参数（`=s0`、`?size=...`），按平台规则替换成原图直链。
- 保留 `variants` 备用：不想破坏原 URL 时，原 URL 进 `variants[0]`，规整后 URL 放 `url`。（首页媒体墙 blur-up 需要高清图）
- **代理标记**：IG/YT 的 CDN URL 在浏览器有 CORS/CORP 拦截风险（本项目踩过 `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`，
  见 `IGCardHeader.tsx` 的 proxyImage）。清洗阶段**不做** URL 改写，由前端 `MediaImage` 组件统一判断是否需要走代理
  （`/api/proxy/image?url=`，见 API.md §6）。

### 6.4 视频直链规则
- 视频一律产出 `url`（mp4 直链）与 `previewUrl`（封面）。多码率 `variants` 按 bitrate 降序。
- 无法拿到直链的平台（部分网页端）：`url` 留空，`previewUrl` 填封面，前端显示「点击前往源平台播放」。

### 6.5 去重与合并
- 主键 = `id`（`platform:postId`），upsert 语义：同日增量抓取用新数据覆盖旧数据全部字段。
- 媒体去重：`extractMediaFromTweets`（本项目 `lib/media.ts`）的 seenUrls 模式推广为「平台+URL」去重，媒体墙不重复。
- 转帖扁平化：`repost` 只嵌一层；若转发链超过一层，取原始帖作为 `repostOf`，中间层丢弃（保留 `meta` 计数）。

### 6.6 version & 审计
- `cleanVersion` 每次清洗逻辑变更 +1；DB 里按 `cleanVersion < N` 全量重洗一次（离线脚本幂等，参考 dailyUpdate 节奏）。

---

## 7. Adapter 接口（抓取侧契约）

> 新项目**第一阶段不实现抓取**（用户先用第三方工具导出 JSON，走 `import` 脚本入库，对齐本项目 `import-ins-data.ts` 思路）。
> Adapter 接口先定义，导出工具的 JSON → 统一格式的转换器即为「适配器」。

```ts
/** 第三方工具/导出物的解析适配器 */
export interface PostAdapter<TToolOutput = unknown> {
  /** 绑定的统一平台 */
  platform: UnifiedPlatform
  /**
   * 把第三方工具输出解析为统一帖子。
   * 必须幂等、无副作用；抛错时返回 [] 并记日志（单条失败不拖垮整批）。
   */
  normalize(input: TToolOutput, ctx: CleanContext): UnifiedPost[]
  /** 可选：作者信息归一 */
  normalizeAuthor?(input: unknown): UnifiedAuthor | null
}

export interface CleanContext {
  platform: UnifiedPlatform
  /** 清洗版本号（写进 post.meta.cleanVersion） */
  version: number
  /** 抓取发生时间（供无绝对时间平台的近似时间） */
  fetchedAt: string
  /** 广告/无关内容过滤回调（对齐本项目过滤广告推文的行为） */
  shouldSkip?: (raw: unknown) => boolean
}
```

**导入脚本流程**（对齐 `apps/scripts/import-ins-data.ts` + `insertToDB.ts`）：

```
第三方工具导出 JSON 文件
        │
        ▼
apps/scripts/import-<platform>.ts   （读文件 → Adapter.normalize → 批量 upsert）
        │
        ▼
数据库统一表：posts（结构化列 + jsonData 全量）
        │
        ▼
server API → UnifiedPost JSON → 前端渲染
```

---

## 8. 数据库 Schema（参考草案）

> 对齐本项目「结构化列 + JSON 列」双轨：结构化列用于查询排序，JSON 列用于完整渲染。

```sql
-- 统一帖子表
CREATE TABLE posts (
  id            BIGSERIAL PRIMARY KEY,          -- 内部主键
  platform      TEXT NOT NULL,                   -- UnifiedPlatform
  post_id       TEXT NOT NULL,                   -- 平台帖子 ID
  full_id       TEXT NOT NULL UNIQUE,            -- `${platform}:${post_id}`（API 主键）
  author_name   TEXT NOT NULL,                   -- 作者用户名（过滤/分组）
  full_text     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL,
  post_type     TEXT NOT NULL DEFAULT 'post',    -- UnifiedPostType
  clean_version INT  NOT NULL DEFAULT 1,
  json_data     JSONB NOT NULL,                  -- 完整 UnifiedPost
  UNIQUE (platform, post_id)
);

-- 联合索引（keyset 分页）
CREATE INDEX idx_posts_author_createdat ON posts (author_name, created_at DESC);
CREATE INDEX idx_posts_platform_createdat ON posts (platform, created_at DESC);
CREATE INDEX idx_posts_media ON posts USING GIN ((json_data->'media') jsonb_path_ops); -- 可选：媒体筛选

-- 作者表（可并入 users 类似结构：author 快照 + 平台档案）
CREATE TABLE authors (
  id            BIGSERIAL PRIMARY KEY,
  platform      TEXT NOT NULL,
  username      TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  json_data     JSONB NOT NULL,                  -- 完整 UnifiedAuthor
  UNIQUE (platform, username)
);
```

> **部署建议**：沿用本项目 Neon Serverless Postgres + Drizzle ORM；也可以第一阶段直接存本地 JSON +
> SQLite（Better-SQLite3）跑通前端，再迁 Postgres。

---

## 9. 扩展新平台 Checklist

1. `UnifiedPlatform` 加枚举值
2. `PLATFORM_CAPABILITIES` 加一行能力声明
3. 写适配器（解析第三方工具输出 → `UnifiedPost[]`）+ 20 行以上测试样本
4. `extra` 判别联合扩展（如有平台专属字段）
5. 前端零改动（媒体/正文/指标都走通用组件）；图标新增一个 lucide icon 映射
6. `import-<platform>.ts` 导入脚本 + 增量抓取接入 `dailyUpdate`

---

## 附：与本项目类型对照表

| 本项目类型 | 统一模型 | 说明 |
|---|---|---|
| `EnrichedTweet`（rettiwt-api） | `UnifiedPost` | 转帖/引用/回复/媒体/指标全部对齐 |
| `IGPost` / `IGMedia` / `IGAudio`（shared） | `UnifiedPost` / `UnifiedMedia` / `InstagramExtra` | IG 专属字段进 extra |
| `Entity`（rettiwt-api entities.ts） | `UnifiedEntity` | 去掉 `translation/aiTranslation`（翻译能力后续单列） |
| `PaginatedResponse<T>` | `PaginatedResponse<UnifiedPost>` | 原样复用 |
| `users.ins_json_data`（IG 档案并入 users） | `authors.json_data` | 平台档案统一入 authors |
| `FlatMediaItem`（web lib/media.ts） | 媒体墙在 API 层派生 | 前端保留该 flatten 派生逻辑 |