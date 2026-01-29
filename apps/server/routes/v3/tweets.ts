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

  // 日期筛选参数
  const startDateStr = c.req.query('start')
  const endDateStr = c.req.query('end')

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null

  if (page < 1)
    page = 1
  const internalPage = page - 1

  // 1. 过滤用户与日期范围
  let filteredTweets = allTweets.filter(tweet => tweet.user.screen_name === name)

  if (startDate) {
    filteredTweets = filteredTweets.filter(t => new Date(t.created_at) >= startDate)
  }
  if (endDate) {
    // 结束日期通常包含当天，所以设置为当天 23:59:59
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    filteredTweets = filteredTweets.filter(t => new Date(t.created_at) <= end)
  }

  // 2. 排序
  filteredTweets.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return reverse ? timeA - timeB : timeB - timeA
  })

  const total = filteredTweets.length
  const start = internalPage * pageSize
  const endIdx = start + pageSize

  const paginatedData = filteredTweets.slice(start, endIdx)
  const hasMore = endIdx < total

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
