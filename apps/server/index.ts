import type { AppType } from './common'
import { neon } from '@neondatabase/serverless'
import { schema } from '@tweets-viewer/database'
import { now } from '@tweets-viewer/shared'
import { drizzle } from 'drizzle-orm/neon-http'
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
import 'dotenv'

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
    const sql = neon(process.env.DATABASE_URL || c.env.DATABASE_URL)
    const db = drizzle({ client: sql, schema })
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
