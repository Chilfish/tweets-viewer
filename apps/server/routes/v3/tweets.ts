import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { AppType } from '../../common'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Hono } from 'hono'

const app = new Hono<AppType>()

// 预加载所有推文数据
const allTweets = await readFile(path.join(process.cwd(), 'tmp/merged.json'), 'utf8')
  .then(data => JSON.parse(data) as EnrichedTweet[])

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
    nextCursor?: number | string
  }
}

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  let page = Number(c.req.query('page') || 1)
  const pageSize = Number(c.req.query('pageSize') || 20)
  const reverse = c.req.query('reverse') === 'true'

  // Backend internally uses 0-based indexing, frontend sends 1-based
  if (page < 1)
    page = 1
  const internalPage = page - 1

  const userTweets = allTweets
    .filter(tweet => tweet.user.screen_name === name)
    .sort((a, b) => reverse ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id))

  const total = userTweets.length
  const start = internalPage * pageSize
  const end = start + pageSize

  const paginatedData = userTweets.slice(start, end)
  const hasMore = end < total

  const response: PaginatedResponse<EnrichedTweet> = {
    data: paginatedData,
    meta: {
      total,
      page,
      pageSize,
      hasMore,
      nextCursor: hasMore ? page + 1 : undefined,
    },
  }

  return c.json(response)
})

export default app
