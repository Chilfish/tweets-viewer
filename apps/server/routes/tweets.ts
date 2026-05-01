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
} from '@tweets-viewer/database'
import { Hono } from 'hono'
import { getContext } from 'hono/context-storage'
import { z } from 'zod'
import { SimpleLRUCache } from '../utils/lru-cache'

const app = new Hono<AppType>()

const tweetCountCache = new SimpleLRUCache<string, number>(1000)
const mediaTweetCountCache = new SimpleLRUCache<string, number>(1000)

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  reverse: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
})

function getPaginationParams(c: Context) {
  const parsed = paginationSchema.safeParse(c.req.query())
  if (!parsed.success) {
    return null
  }
  return parsed.data
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
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  noReplies: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
})

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  name: z.string().min(1).max(50).regex(/^\w+$/).default(''),
})

app.get('/get/:name', async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const pagination = getPaginationParams(c)
  if (!pagination)
    return c.json({ error: 'invalid pagination params' }, 400)

  const dateResult = dateRangeSchema.safeParse(c.req.query())
  if (!dateResult.success)
    return c.json({ error: 'invalid date range' }, 400)

  const { page, pageSize, reverse } = pagination
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
    })
  }

  return c.json(tweets)
})

app.get('/medias/:name', async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const pagination = getPaginationParams(c)
  if (!pagination)
    return c.json({ error: 'invalid pagination params' }, 400)

  const { page, pageSize, reverse } = pagination
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
    total,
  })

  return c.json(tweets)
})

app.get('/search', async (c) => {
  const searchResult = searchSchema.safeParse(c.req.query())
  if (!searchResult.success) {
    return c.json({ error: 'keyword is required (1-200 chars)' }, 400)
  }

  const { q: keyword, name } = searchResult.data
  const pagination = getPaginationParams(c)
  if (!pagination)
    return c.json({ error: 'invalid pagination params' }, 400)

  const { page, pageSize, reverse } = pagination
  const { db } = getContext<AppType>().var
  const tweets = await getTweetsByKeyword({
    db,
    name,
    keyword,
    reverse,
    page,
    pageSize,
  })
  return c.json(tweets)
})

app.get('/get/:name/last-years-today', async (c) => {
  const name = getName(c)
  if (!name)
    return c.json({ error: 'invalid name' }, 400)

  const pagination = getPaginationParams(c)
  if (!pagination)
    return c.json({ error: 'invalid pagination params' }, 400)

  const { page, pageSize, reverse } = pagination
  const { db } = getContext<AppType>().var

  const tweets = await getLastYearsTodayTweets({
    db,
    name,
    reverse,
    page,
    pageSize,
  })
  return c.json(tweets)
})

export default app
