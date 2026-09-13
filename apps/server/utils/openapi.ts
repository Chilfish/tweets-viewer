import type { Hono } from 'hono'
import type { GenerateSpecOptions } from 'hono-openapi'
import type { AppType } from '../common'
import { Scalar } from '@scalar/hono-api-reference'
import { openAPIRouteHandler } from 'hono-openapi'

/** OpenAPI schema 对象类型（从 hono-openapi 选项推导，避免额外依赖） */
type SchemaObject = NonNullable<NonNullable<GenerateSpecOptions['documentation']['components']>['schemas']>[string]

/** 构造指向 `components.schemas` 的 `$ref` */
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

/** 标准 JSON 响应描述 */
export function jsonResponse(description: string, schema: string) {
  return {
    description,
    content: { 'application/json': { schema: ref(schema) } },
  }
}

export const errorResponse = jsonResponse('错误响应', 'ErrorResponse')

/** 分页 query 参数（tweets 系列共用，与 routes/tweets.ts 的 zod schema 对齐） */
export const paginationParameters = [
  {
    in: 'query' as const,
    name: 'page',
    required: false,
    description: '页码（offset 定位，分页器跳页用）',
    schema: { type: 'integer' as const, minimum: 1, default: 1 },
  },
  {
    in: 'query' as const,
    name: 'pageSize',
    required: false,
    description: '每页数量（1-100）',
    schema: { type: 'integer' as const, minimum: 1, maximum: 100, default: 10 },
  },
  {
    in: 'query' as const,
    name: 'reverse',
    required: false,
    description: '排序方向：true = 旧→新，false = 新→旧',
    schema: { type: 'boolean' as const, default: false },
  },
  {
    in: 'query' as const,
    name: 'cursor',
    required: false,
    description: 'keyset 游标（滚动续载，优先于 page）',
    schema: { type: 'string' as const, minLength: 1, maxLength: 64 },
  },
]

/** `/v3/*` 用户路由的 path 参数 */
export function nameParameter(name = 'name') {
  return {
    in: 'path' as const,
    name,
    required: true,
    description: '用户 Screen Name（`\\w+`）',
    schema: { type: 'string' as const, minLength: 1, maxLength: 50, pattern: '^\\w+$' },
  }
}

export const dateParameters = [
  {
    in: 'query' as const,
    name: 'start',
    required: false,
    description: '起始日期（ISO date，与 end 成对提供；媒体端点可单独提供）',
    schema: { type: 'string' as const, format: 'date' },
  },
  {
    in: 'query' as const,
    name: 'end',
    required: false,
    description: '结束日期（ISO date）',
    schema: { type: 'string' as const, format: 'date' },
  },
]

const noRepliesParameter = {
  in: 'query' as const,
  name: 'noReplies',
  required: false,
  description: '是否排除回复推文',
  schema: { type: 'boolean' as const, default: false },
}

/** 分页信封的 meta 部分 */
const paginationMeta: SchemaObject = {
  type: 'object',
  properties: {
    total: { type: 'integer' },
    page: { type: 'integer' },
    pageSize: { type: 'integer' },
    hasMore: { type: 'boolean' },
    nextCursor: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
  },
  required: ['total', 'page', 'pageSize', 'hasMore'],
}

const igMediaSchema: SchemaObject = {
  type: 'object',
  properties: {
    num: { type: 'integer', description: '在帖子里的序号' },
    media_id: { type: 'string' },
    shortcode: { type: 'string' },
    display_url: { type: 'string', description: '图片/视频缩略图 CDN URL' },
    video_url: { oneOf: [{ type: 'string' }, { type: 'null' }] },
    width: { type: 'integer' },
    height: { type: 'integer' },
    width_original: { type: 'integer' },
    height_original: { type: 'integer' },
    type: { type: 'string', enum: ['photo', 'video'] },
    tagged_users: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          full_name: { type: 'string' },
        },
        required: ['id', 'username', 'full_name'],
      },
    },
  },
  required: ['num', 'media_id', 'display_url', 'width', 'height', 'type'],
}

const igAudioSchema: SchemaObject = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    artist: { type: 'string' },
    duration: { type: 'number' },
    cover_artwork_uri: { type: 'string' },
    cover_artwork_thumbnail_uri: { type: 'string' },
    has_lyrics: { type: 'boolean' },
    is_explicit: { type: 'boolean' },
  },
}

/** OpenAPI `components.schemas` — 复用的领域模型与响应信封 */
const schemas: Record<string, SchemaObject> = {
  ErrorResponse: {
    type: 'object',
    properties: { error: { type: 'string' } },
    required: ['error'],
  },
  PaginationMeta: paginationMeta,
  EnrichedTweet: {
    type: 'object',
    additionalProperties: true,
    description: '推文详情（EnrichedTweet）。完整字段见 packages/rettiwt-api/types/enriched。',
  },
  EnrichedUser: {
    type: 'object',
    additionalProperties: true,
    description: '用户详情（EnrichedUser）。完整字段见 packages/rettiwt-api/types/enriched。',
  },
  PaginatedTweets: {
    type: 'object',
    properties: {
      data: { type: 'array', items: ref('EnrichedTweet') },
      meta: ref('PaginationMeta'),
    },
    required: ['data', 'meta'],
  },
  EnrichedUserList: { type: 'array', items: ref('EnrichedUser') },
  YearStat: {
    type: 'object',
    properties: { year: { type: 'integer' }, count: { type: 'integer' } },
    required: ['year', 'count'],
  },
  TweetsYearStats: {
    type: 'array',
    items: ref('YearStat'),
    description: '按年份降序的推文数量统计',
  },
  IGMedia: igMediaSchema,
  IGAudio: igAudioSchema,
  IGPost: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'URL shortcode，作路由主键' },
      post_id: { type: 'string' },
      url: { type: 'string' },
      username: { type: 'string' },
      fullname: { type: 'string' },
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      likes: { type: 'integer' },
      type: { type: 'string', enum: ['post', 'reel'] },
      media: { type: 'array', items: ref('IGMedia') },
      avatar_url: { type: 'string' },
      created_at: { type: 'string' },
      location_name: { type: 'string' },
      coauthors: {
        type: 'array',
        items: {
          type: 'object',
          properties: { username: { type: 'string' }, fullname: { type: 'string' } },
          required: ['username', 'fullname'],
        },
      },
      verified: { type: 'boolean' },
      audio: ref('IGAudio'),
    },
    required: ['id', 'post_id', 'url', 'username', 'fullname', 'description', 'likes', 'type', 'media'],
  },
  IGUserInfo: {
    type: 'object',
    properties: {
      username: { type: 'string' },
      fullname: { type: 'string' },
      avatar_url: { type: 'string' },
      verified: { type: 'boolean' },
      bio: { type: 'string' },
      external_url: { type: 'string' },
      followers_count: { type: 'integer' },
      following_count: { type: 'integer' },
      posts_count: { type: 'integer' },
    },
    required: ['username', 'fullname'],
  },
  PaginatedIGPosts: {
    type: 'object',
    properties: {
      data: { type: 'array', items: ref('IGPost') },
      meta: ref('PaginationMeta'),
    },
    required: ['data', 'meta'],
  },
  IGUserPageResponse: {
    type: 'object',
    properties: {
      user: { oneOf: [ref('IGUserInfo'), { type: 'null' }] },
      posts: ref('PaginatedIGPosts'),
    },
    required: ['user', 'posts'],
  },
  ImageItem: {
    type: 'object',
    additionalProperties: true,
    description: '图片归档条目（含 `urls` 数组）',
  },
  ImageList: { type: 'array', items: ref('ImageItem') },
  ImageRandom: {
    type: 'object',
    additionalProperties: true,
    description: '随机图片条目（含 `url`，`urls` 已移除）',
  },
  ImageUpdateResult: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      size: { type: 'integer' },
      message: { type: 'string' },
    },
    required: ['success'],
  },
  RootStatus: {
    type: 'object',
    properties: {
      today: { type: 'string' },
      message: { type: 'string' },
      tweetsSize: { type: 'object', additionalProperties: { type: 'integer' } },
    },
    required: ['today', 'message', 'tweetsSize'],
  },
}

const documentation = {
  info: {
    title: 'Tweets Viewer API',
    version: '3.0.0',
    description: '推文 / Instagram 归档只读 API。完整说明见仓库 `docs/API_DOCUMENTATION.md`。',
  },
  servers: [
    { url: 'https://tweet-api.chilfish.top', description: '生产（Cloudflare Workers）' },
    { url: 'http://localhost:3000', description: '本地开发' },
  ],
  tags: [
    { name: 'Tweets', description: '推文查询' },
    { name: 'Users', description: '用户信息' },
    { name: 'Instagram', description: 'Instagram 归档' },
    { name: 'Image', description: '随机图片' },
    { name: 'Meta', description: '服务状态' },
  ],
  components: { schemas },
}

/** tweets 系列端点的查询参数集合 */
export const tweetQueryParameters = [
  ...paginationParameters,
  ...dateParameters,
  noRepliesParameter,
]

/** 挂载 OpenAPI 规范与文档 UI（生产同样可访问） */
export function registerOpenAPI(app: Hono<AppType>) {
  app.get('/openapi.json', openAPIRouteHandler(app, { documentation }))
  app.get(
    '/scalar',
    Scalar({ url: '/openapi.json', pageTitle: 'Tweets Viewer API', theme: 'saturn' }),
  )
}
