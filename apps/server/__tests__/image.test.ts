import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { AppType } from '../common'
import * as db from '@tweets-viewer/database'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import imageApp from '../routes/image'

vi.mock('@tweets-viewer/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tweets-viewer/database')>()
  return {
    ...actual,
    getRandomMediaImageTweet: vi.fn(),
  }
})

function photo(url: string, index = 0) {
  return {
    type: 'photo' as const,
    index,
    media_url_https: url,
    original_info: { width: 100, height: 100 },
  }
}

function makeTweet(overrides: Partial<EnrichedTweet> = {}): EnrichedTweet {
  return {
    id: '1',
    text: 'hello',
    created_at: '2024-01-01T00:00:00Z',
    url: 'https://x.com/u/status/1',
    entities: [],
    media_details: [photo('https://pbs.twimg.com/media/a.jpg')],
    ...overrides,
  } as EnrichedTweet
}

function buildApp() {
  const app = new Hono<AppType>()
  app.use(contextStorage())
  app.use(async (c, next) => {
    c.set('db', {} as never)
    await next()
  })
  app.route('/v3/image', imageApp)
  return app
}

describe('image routes integration (mocked db)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a random image url plus the full source tweet', async () => {
    const tweet = makeTweet()
    vi.mocked(db.getRandomMediaImageTweet).mockResolvedValue(tweet)

    const res = await buildApp().request('/v3/image/get')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://pbs.twimg.com/media/a.jpg')
    expect(body.tweet).toEqual(tweet)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('passes the optional user filter to the query', async () => {
    vi.mocked(db.getRandomMediaImageTweet).mockResolvedValue(makeTweet())

    const res = await buildApp().request('/v3/image/get?name=alice')
    expect(res.status).toBe(200)
    expect(db.getRandomMediaImageTweet).toHaveBeenCalledWith(expect.objectContaining({ name: 'alice' }))
  })

  it('rejects an invalid user name', async () => {
    const res = await buildApp().request('/v3/image/get?name=bad-name!')
    expect(res.status).toBe(400)
    expect(db.getRandomMediaImageTweet).not.toHaveBeenCalled()
  })

  it('returns 404 when no media tweet matches', async () => {
    vi.mocked(db.getRandomMediaImageTweet).mockResolvedValue(null)

    const res = await buildApp().request('/v3/image/get')
    expect(res.status).toBe(404)
  })
})
