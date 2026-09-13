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

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  reverse: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  /** keyset 游标（滚动续载用，见 Specification §4.1） */
  cursor: z.string().min(1).max(64).optional(),
})

function getPaginationParams(c: Context) {
  const parsed = paginationSchema.safeParse(c.req.query())
  if (!parsed.success) {
    const messages = parsed.error.issues.map(i => `${i.path}: ${i.message}`).join(', ')
    return messages
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

const dateRangeSchema = z.object({
  start: z.iso.date().optional(),
  end: z.iso.date().optional(),
  noReplies: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
})

/** 解析 start/end（可单独提供，与 getTweets 的"必须成对"不同——媒体按年浏览只需 start） */
function parseOptionalDateRange(c: Context) {
  const start = c.req.query('start')
  const end = c.req.query('end')
  return {
    startDate: start ? new Date(start) : undefined,
    endDate: end ? new Date(end) : undefined,
  }
}

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  /** 可选：为空时全库检索（全局搜索） */
  name: z.string().min(1).max(50).regex(/^\w+$/).optional(),
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

  const pagination = getPaginationParams(c)
  if (isError(pagination))
    return c.json({ error: `invalid pagination: ${pagination}` }, 400)

  const dateResult = dateRangeSchema.safeParse(c.req.query())
  if (!dateResult.success)
    return c.json({ error: 'invalid date range' }, 400)

  const { page, pageSize, reverse, cursor } = pagination
  const { start, end, noReplies } = dateResult.data

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
    return c.json({ error: `invalid pagination: ${pagination}` }, 400)

  const { page, pageSize, reverse, cursor } = pagination
  const { startDate, endDate } = parseOptionalDateRange(c)
  const { db } = getContext<AppType>().var

  let total = mediaTweetCountCache.get(name)

  if (total === undefined) {
    const [{ value }] = await getMediaTweetsCount(db, name)
    total = value
    mediaTweetCountCache.set(name, total)
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
    return c.json({ error: 'keyword is required (1-200 chars)' }, 400)
  }

  const { keyword, name } = normalizeSearchParams(searchResult.data)
  const pagination = getPaginationParams(c)
  if (isError(pagination))
    return c.json({ error: `invalid pagination: ${pagination}` }, 400)

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
    return c.json({ error: `invalid pagination: ${pagination}` }, 400)

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
    return c.json({ error: `invalid pagination: ${pagination}` }, 400)

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
