import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { AppType } from '../common'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { Hono } from 'hono'
import { getData } from '../common'

const app = new Hono<AppType>()

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 1)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await getData(name)
  const total = tweets.length

  // reverse=true: oldest first (正序), reverse=false: newest first (默认倒序)
  const ordered = reverse ? [...tweets].reverse() : tweets
  const offset = (page - 1) * PAGE_SIZE
  const data = ordered.slice(offset, offset + PAGE_SIZE)

  const response: PaginatedResponse<EnrichedTweet> = {
    data,
    meta: {
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: offset + data.length < total,
    },
  }

  return c.json(response)
})

export default app
