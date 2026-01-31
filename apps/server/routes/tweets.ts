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
import { SimpleLRUCache } from '../utils/lru-cache'

const app = new Hono<AppType>()

// 简单的 LRU 缓存，用于存储用户的推文总数
// Key: userName (string), Value: totalCount (number)
const tweetCountCache = new SimpleLRUCache<string, number>(1000)
const mediaTweetCountCache = new SimpleLRUCache<string, number>(1000)

/**
 * 提取通用分页参数
 */
function getPaginationParams(c: Context) {
  let page = Number(c.req.query('page') || 1)
  if (page < 1)
    page = 1
  const pageSize = Number(c.req.query('pageSize') || 10)
  const reverse = c.req.query('reverse') === 'true'
  return { page, pageSize, reverse }
}

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const { page, pageSize, reverse } = getPaginationParams(c)

  // 日期筛选参数
  const startDateStr = c.req.query('start')
  const endDateStr = c.req.query('end')

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null

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
    })
  }
  else {
    // 尝试从缓存获取总数
    let total = tweetCountCache.get(name)

    if (total === undefined) {
      const [{ value }] = await getTweetsCount(db, name)
      total = value
      tweetCountCache.set(name, total)
    }

    tweets = await getTweets({
      db,
      name,
      page,
      pageSize,
      reverse,
      total,
    })
  }

  return c.json(tweets)
})

app.get('/medias/:name', async (c) => {
  const name = c.req.param('name')
  const { page, pageSize, reverse } = getPaginationParams(c)

  const { db } = getContext<AppType>().var

  // 尝试从缓存获取媒体推文总数
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
  const name = c.req.query('name') || ''
  const { page, pageSize, reverse } = getPaginationParams(c)
  const keyword = c.req.query('q')

  if (!keyword)
    return c.json({ error: 'keyword is required' }, 400)

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
  const name = c.req.param('name')
  const { page, pageSize, reverse } = getPaginationParams(c)

  const { db } = getContext<AppType>().var

  // 即使是"那年今日"，也支持分页，尽管通常数据量不大
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
