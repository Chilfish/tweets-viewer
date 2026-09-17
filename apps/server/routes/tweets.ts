import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Context } from 'hono'
import type { AppType } from '../common'
import {
  getLastYearsTodayTweets,
  getMediaTweets,
  getMediaTweetsCount,
  getTweets,
  getTweetsByDateRange,
  getTweetsByKeyword,
  getTweetsCount,
  getTweetsYearStats,
} from '@tweets-viewer/database'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { getContext } from 'hono/context-storage'
import { z } from 'zod'
import { SimpleLRUCache } from '../utils/lru-cache'
import {
  dateParameters,
  errorResponse,
  jsonResponse,
  nameParameter,
  paginationParameters,
  tweetQueryParameters,
} from '../utils/openapi'

const app = new Hono<AppType>()

const tweetCountCache = new SimpleLRUCache<string, number>(1000)
const mediaTweetCountCache = new SimpleLRUCache<string, number>(1000)

/** 归档数据每日一变：浏览器 5 分钟 + CDN 1 小时（4A-3） */
const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600'
/** 用户列表变化极低频：CDN 缓存 24h */
const USERS_CACHE_CONTROL = 'public, max-age=300, s-maxage=86400'

/**
 * 布尔 query 参数：接受 `true`/`false`/`1`/`0`（覆盖 OpenAPI boolean 的两种常见序列化），归一化为 boolean。
 * 两类参数共用同一 schema，保证错误文案一致（见 #8）。
 */
const booleanQuerySchema = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform(v => v === 'true' || v === '1')

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  reverse: booleanQuerySchema,
  /**
   * keyset 游标（滚动续载用，见 Specification §4.1）：排序键是 snowflake id，
   * 限制为 1-19 位十进制数字，避免非法值透传到 `CAST(... AS BIGINT)` 触发 500。
   */
  cursor: z.string().regex(/^\d{1,19}$/, 'expected a decimal snowflake id').optional(),
})

/** 把 zod 校验失败格式化为 `字段: 原因` 列表，错误文案精确到字段而非硬编码区域文案（见 #8） */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')
}

function getPaginationParams(c: Context) {
  const parsed = paginationSchema.safeParse(c.req.query())
  if (!parsed.success) {
    return formatIssues(parsed.error)
  }
  return parsed.data
}

function isError(value: unknown): value is string {
  return typeof value === 'string'
}

const nameSchema = z.string().min(1).max(50).regex(/^\w+$/)

function getName(c: Context) {
  const name = c.req.param('name')
  if (!nameSchema.safeParse(name).success) {
    return null
  }
  return name
}

/**
 * `/get/:name` 的完整 query：分页 + 日期范围 + 排除回复。
 * 合并为一个 schema 以便一次性回传全部字段级错误（`noReplies` 不再混进日期范围校验，见 #8）。
 */
const tweetListQuerySchema = paginationSchema.extend({
  start: z.iso.date().optional(),
  end: z.iso.date().optional(),
  noReplies: booleanQuerySchema,
})

/** 解析 start/end（媒体端点允许单独出现，但仅当两者都提供时才在查询中生效） */
function parseOptionalDateRange(c: Context) {
  const start = c.req.query('start')
  const end = c.req.query('end')
  return {
    startDate: start ? new Date(start) : undefined,
    endDate: end ? new Date(end) : undefined,
  }
}

const searchSchema = z.object({
  q: z
    .string('keyword is required (1-200 chars)')
    .min(1, 'keyword is required (1-200 chars)')
    .max(200, 'keyword is too long (max 200 chars)'),
  /** 可选：为空时全库检索（全局搜索） */
  name: z
    .string('invalid name')
    .min(1, 'invalid name')
    .max(50, 'invalid name')
    .regex(/^\w+$/, 'invalid name')
    .optional(),
})

function normalizeSearchParams(searchResult: z.infer<typeof searchSchema>) {
  const { q: keyword, name = '' } = searchResult
  return { keyword, name }
}

app.get('/get/:name', describeRoute({
  tags: ['Tweets'],
  summary: '获取用户推文列表',
  description: '按用户 Screen Name 分页获取推文，支持日期范围、排除回复与 keyset 游标续载。',
  parameters: [nameParameter(), ...tweetQueryParameters],
  responses: {
    200: jsonResponse('分页推文列表', 'PaginatedTweets'),
    400: errorResponse,
  },
}), async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const parsed = tweetListQuerySchema.safeParse(c.req.query())
  if (!parsed.success)
    return c.json({ error: formatIssues(parsed.error) }, 400)

  const { page, pageSize, reverse, cursor, start, end, noReplies } = parsed.data

  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return c.json({ error: 'start and end must both be provided or omitted' }, 400)
  }

  const { db } = getContext<AppType>().var

  let tweets: PaginatedResponse<EnrichedTweet>

  if (startDate && endDate) {
    tweets = await getTweetsByDateRange({
      db,
      name,
      startDate,
      endDate,
      page,
      pageSize,
      reverse,
      noReplies,
      cursor,
    })
  }
  else {
    const cacheKey = noReplies ? `${name}:no-replies` : name
    let total = tweetCountCache.get(cacheKey)

    if (total === undefined) {
      const [{ value }] = await getTweetsCount(db, name, noReplies)
      total = value
      tweetCountCache.set(cacheKey, total)
    }

    tweets = await getTweets({
      db,
      name,
      page,
      pageSize,
      reverse,
      total,
      noReplies,
      cursor,
    })
  }

  c.header('Cache-Control', CACHE_CONTROL)
  return c.json(tweets)
})

app.get('/medias/:name', describeRoute({
  tags: ['Tweets'],
  summary: '获取用户媒体推文',
  description: '获取指定用户所有含图片/视频附件的推文（排除转推）。',
  parameters: [nameParameter(), ...paginationParameters, ...dateParameters],
  responses: {
    200: jsonResponse('分页媒体推文列表', 'PaginatedTweets'),
    400: errorResponse,
  },
}), async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const pagination = getPaginationParams(c)
  if (isError(pagination))
    return c.json({ error: pagination }, 400)

  const { page, pageSize, reverse, cursor } = pagination
  const { startDate, endDate } = parseOptionalDateRange(c)
  const { db } = getContext<AppType>().var

  // 缓存的 total 是「该用户全部媒体」的未过滤值，只在查询不带日期范围时复用；
  // 带范围时必须由 paginateTweets 按 whereClause 重新 count，否则 hasMore 恒为 true（见 #9）。
  let total: number | undefined
  if (!(startDate && endDate)) {
    total = mediaTweetCountCache.get(name)

    if (total === undefined) {
      const [{ value }] = await getMediaTweetsCount(db, name)
      total = value
      mediaTweetCountCache.set(name, total)
    }
  }

  const tweets = await getMediaTweets({
    db,
    name,
    page,
    pageSize,
    reverse,
    cursor,
    startDate,
    endDate,
    total,
  })

  c.header('Cache-Control', CACHE_CONTROL)
  return c.json(tweets)
})

app.get('/stats/:name', describeRoute({
  tags: ['Tweets'],
  summary: '获取用户推文按年统计',
  description: '归档完整性指示：覆盖年份范围 + 每年条数。',
  parameters: [nameParameter()],
  responses: {
    200: jsonResponse('按年份降序的统计', 'TweetsYearStats'),
    400: errorResponse,
  },
}), async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const { db } = getContext<AppType>().var
  const stats = await getTweetsYearStats(db, name)

  c.header('Cache-Control', CACHE_CONTROL)
  return c.json(stats)
})

app.get('/search', describeRoute({
  tags: ['Tweets'],
  summary: '搜索推文',
  description: '在指定用户或全库范围按关键词搜索推文（`name` 缺省为跨用户全局搜索）。',
  parameters: [
    {
      in: 'query',
      name: 'q',
      required: true,
      description: '搜索关键词（1-200 字符）',
      schema: { type: 'string', minLength: 1, maxLength: 200 },
    },
    {
      in: 'query',
      name: 'name',
      required: false,
      description: '限定用户 Screen Name；缺省为全库检索',
      schema: { type: 'string', minLength: 1, maxLength: 50, pattern: '^\\w+$' },
    },
    ...paginationParameters,
  ],
  responses: {
    200: jsonResponse('分页搜索结果', 'PaginatedTweets'),
    400: errorResponse,
  },
}), async (c) => {
  const searchResult = searchSchema.safeParse(c.req.query())
  if (!searchResult.success) {
    return c.json({ error: formatIssues(searchResult.error) }, 400)
  }

  const { keyword, name } = normalizeSearchParams(searchResult.data)
  const pagination = getPaginationParams(c)
  if (isError(pagination))
    return c.json({ error: pagination }, 400)

  const { page, pageSize, reverse, cursor } = pagination
  const { db } = getContext<AppType>().var
  const tweets = await getTweetsByKeyword({
    db,
    name,
    keyword,
    reverse,
    page,
    pageSize,
    cursor,
  })
  c.header('Cache-Control', CACHE_CONTROL)
  return c.json(tweets)
})

app.get('/get/:name/last-years-today', describeRoute({
  tags: ['Tweets'],
  summary: '获取单用户「那年今日」',
  description: '指定用户历史年份同一天的推文（保留转推）。',
  parameters: [nameParameter(), ...paginationParameters],
  responses: {
    200: jsonResponse('分页「那年今日」推文', 'PaginatedTweets'),
    400: errorResponse,
  },
}), async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const pagination = getPaginationParams(c)
  if (isError(pagination))
    return c.json({ error: pagination }, 400)

  const { page, pageSize, reverse, cursor } = pagination
  const { db } = getContext<AppType>().var

  const tweets = await getLastYearsTodayTweets({
    db,
    name,
    reverse,
    page,
    pageSize,
    cursor,
  })
  c.header('Cache-Control', CACHE_CONTROL)
  return c.json(tweets)
})

app.get('/last-years-today', describeRoute({
  tags: ['Tweets'],
  summary: '获取全量「那年今日」',
  description: '全部用户历史年份同一天的推文（跨用户，排除转推）。',
  parameters: [...paginationParameters],
  responses: {
    200: jsonResponse('分页「那年今日」推文', 'PaginatedTweets'),
    400: errorResponse,
  },
}), async (c) => {
  const pagination = getPaginationParams(c)
  if (isError(pagination))
    return c.json({ error: pagination }, 400)

  const { page, pageSize, reverse, cursor } = pagination
  const { db } = getContext<AppType>().var

  const tweets = await getLastYearsTodayTweets({
    db,
    name: '',
    reverse,
    page,
    pageSize,
    cursor,
  })
  c.header('Cache-Control', CACHE_CONTROL)
  return c.json(tweets)
})

export { USERS_CACHE_CONTROL }
export default app
