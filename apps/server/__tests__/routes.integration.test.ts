import { contextStorage } from 'hono/context-storage'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import tweetsApp from '../routes/tweets'

// mock database 模块：路由的查询函数全部替换为可控 stub，断言参数传递与响应契约
vi.mock('@tweets-viewer/database', () => ({
  getTweets: vi.fn(),
  getTweetsByDateRange: vi.fn(),
  getLastYearsTodayTweets: vi.fn(),
  getTweetsByKeyword: vi.fn(),
  getTweetsCount: vi.fn(),
  getMediaTweets: vi.fn(),
  getMediaTweetsCount: vi.fn(),
  getTweetsYearStats: vi.fn(),
}))

import * as db from '@tweets-viewer/database'

const page = (data: unknown[], hasMore = false) => ({
  data,
  meta: { total: data.length, page: 1, pageSize: 10, hasMore },
})

function buildApp() {
  const app = new Hono()
  app.use(contextStorage())
  app.use(async (c, next) => {
    c.set('db', {} as never)
    await next()
  })
  app.route('/v3/tweets', tweetsApp)
  return app
}

describe('tweets routes integration (mocked db)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getTweets).mockResolvedValue(page([{ id: '1' }]) as never)
    vi.mocked(db.getTweetsCount).mockResolvedValue([{ value: 1 }] as never)
    vi.mocked(db.getTweetsByKeyword).mockResolvedValue(page([]) as never)
    vi.mocked(db.getMediaTweets).mockResolvedValue(page([]) as never)
    vi.mocked(db.getMediaTweetsCount).mockResolvedValue([{ value: 0 }] as never)
    vi.mocked(db.getLastYearsTodayTweets).mockResolvedValue(page([]) as never)
    vi.mocked(db.getTweetsYearStats).mockResolvedValue([{ year: 2026, count: 5 }])
  })

  it('passes cursor/page to getTweets and sets CDN cache headers', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/get/testuser?page=2&cursor=1234567890')
    expect(res.status).toBe(200)
    expect(db.getTweets).toHaveBeenCalledWith(expect.objectContaining({
      name: 'testuser',
      page: 2,
      cursor: '1234567890',
      noReplies: false,
    }))
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })

  it('rejects empty cursor (protocol honesty)', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/get/testuser?cursor=')
    expect(res.status).toBe(400)
  })

  it('requires start and end to be provided together', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/get/testuser?start=2023-01-01')
    expect(res.status).toBe(400)
  })

  it('global search without name queries all users', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/search?q=hello')
    expect(res.status).toBe(200)
    expect(db.getTweetsByKeyword).toHaveBeenCalledWith(expect.objectContaining({
      name: '',
      keyword: 'hello',
    }))
  })

  it('media endpoint accepts optional start/end independently', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/medias/testuser?start=2023-01-01')
    expect(res.status).toBe(200)
    expect(db.getMediaTweets).toHaveBeenCalledWith(expect.objectContaining({
      startDate: expect.any(Date),
      endDate: undefined,
    }))
  })

  it('media endpoint passes cursor for keyset continuation', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/medias/testuser?cursor=999')
    expect(res.status).toBe(200)
    expect(db.getMediaTweets).toHaveBeenCalledWith(expect.objectContaining({ cursor: '999' }))
  })

  it('year stats endpoint returns stats with cache header', async () => {
    const app = buildApp()
    const res = await app.request('/v3/tweets/stats/testuser')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ year: 2026, count: 5 }])
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })
})
