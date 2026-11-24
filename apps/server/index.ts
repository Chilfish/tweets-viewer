import type { AppType } from './common'
import { createDb } from '@tweets-viewer/database'
import { now } from '@tweets-viewer/shared'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { cachedData } from './common'
import imageApp from './routes/image'
import insApp from './routes/ins'
import tweetsApp from './routes/tweets'
import usersApp from './routes/users'
import { jsonResponse, registerOpenAPI } from './utils/openapi'

const isDev = process.env.NODE_ENV === 'development'

const app = new Hono<AppType>()

app
  .use(contextStorage())
  .use(cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    maxAge: 86400,
  }))
  .use(async (c, next) => {
    // Nitro 只调 `app.fetch(request)`，Hono 的 `c.env` 在 Workers 上是 undefined；
    // 绑定（含 secret）在 nodejs_compat 下同时出现在 `process.env` 里。
    const env = c.env as AppType['Bindings'] | undefined
    const db = createDb({
      url: process.env.DATABASE_URL || env?.DATABASE_URL || '',
      endpoint: process.env.NEON_HTTP_ENDPOINT || env?.NEON_HTTP_ENDPOINT,
    })
    c.set('db', db)
    return next()
  })

app
  .get('/', describeRoute({
    tags: ['Meta'],
    summary: '服务状态',
    description: '返回当前时间与已缓存用户的推文条数。',
    responses: {
      200: jsonResponse('服务状态', 'RootStatus'),
    },
  }), async (c) => {
    const today = now()
    // name: size
    const tweetsSize: Record<string, number> = {}
    for (const [name, tweets] of cachedData.entries()) {
      tweetsSize[name] = tweets.length
    }

    return c.json({
      today,
      message: 'Hello, World!',
      tweetsSize,
    })
  })
  .route('/v3/tweets', tweetsApp)
  .route('/v3/users', usersApp)
  .route('/v3/image', imageApp)
  .route('/v3/ins', insApp)

registerOpenAPI(app)

app.onError((err, c) => {
  console.error(err)
  if (isDev) {
    return c.json({ error: err.message, stack: err.stack }, 500)
  }
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default {
  fetch: app.fetch,
}
