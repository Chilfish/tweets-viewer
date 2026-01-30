import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { AppType } from '../../common'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Hono } from 'hono'

const app = new Hono<AppType>()

// 预加载所有推文数据
// TODO: 在生产环境中，应该使用真实的数据库
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

/**
 * 提取通用分页参数
 */
function getPaginationParams(c: any) {
  let page = Number(c.req.query('page') || 1)
  if (page < 1)
    page = 1
  const pageSize = Number(c.req.query('pageSize') || 20)
  const reverse = c.req.query('reverse') === 'true'
  return { page, pageSize, reverse }
}

/**
 * 通用分页处理
 */
function paginateTweets(
  tweets: EnrichedTweet[],
  page: number,
  pageSize: number,
  reverse: boolean,
): PaginatedResponse<EnrichedTweet> {
  // 排序
  tweets.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return reverse ? timeA - timeB : timeB - timeA
  })

  const total = tweets.length
  const start = (page - 1) * pageSize
  const endIdx = start + pageSize

  const paginatedData = tweets.slice(start, endIdx)
  const hasMore = endIdx < total

  return {
    data: paginatedData,
    meta: {
      total,
      page,
      pageSize,
      hasMore,
      nextCursor: hasMore ? page + 1 : undefined,
    },
  }
}

// 常规获取推文
app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const { page, pageSize, reverse } = getPaginationParams(c)

  // 日期筛选参数
  const startDateStr = c.req.query('start')
  const endDateStr = c.req.query('end')
  // 搜索关键词
  // const search = c.req.query('search')

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null

  // 1. 过滤用户
  let filteredTweets = allTweets.filter(tweet => tweet.user.screen_name === name)

  // 2. 过滤日期范围
  if (startDate) {
    filteredTweets = filteredTweets.filter(t => new Date(t.created_at) >= startDate)
  }
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    filteredTweets = filteredTweets.filter(t => new Date(t.created_at) <= end)
  }

  // 3. 构造分页响应
  const response = paginateTweets(filteredTweets, page, pageSize, reverse)
  return c.json(response)
})

// 获取那年今日的推文
app.get('/get/:name/last-years-today', async (c) => {
  const name = c.req.param('name')
  const { page, pageSize, reverse } = getPaginationParams(c)

  const today = new Date()
  const currentMonth = today.getMonth() // 0-11
  const currentDate = today.getDate()

  // 1. 过滤用户 & 那年今日逻辑
  const filteredTweets = allTweets.filter((tweet) => {
    if (tweet.user.screen_name !== name)
      return false
    const tweetDate = new Date(tweet.created_at)
    // 匹配月和日，且年份不能是今年（那是“今天”不是“那年今日”）
    // 不过通常显示今天也没关系，但为了区分，可以只显示过去的年份
    return tweetDate.getMonth() === currentMonth
      && tweetDate.getDate() === currentDate
      // && tweetDate.getFullYear() < today.getFullYear()
  })

  // 3. 构造分页响应
  const response = paginateTweets(filteredTweets, page, pageSize, reverse)
  return c.json(response)
})

app.get('/search', async (c) => {
  const name = c.req.query('name')
  const { page, pageSize, reverse } = getPaginationParams(c)

  const startDateStr = c.req.query('start_date')
  const endDateStr = c.req.query('end_date')

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null

  // 1. 过滤用户
  let filteredTweets = allTweets.filter(tweet => tweet.user.screen_name === name)

  // 2. 过滤日期范围
  if (startDate) {
    filteredTweets = filteredTweets.filter(t => new Date(t.created_at) >= startDate)
  }
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    filteredTweets = filteredTweets.filter(t => new Date(t.created_at) <= end)
  }

  // 3. 构造分页响应
  const response = paginateTweets(filteredTweets, page, pageSize, reverse)
  return c.json(response)
})

export default app
