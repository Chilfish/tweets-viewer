import type { AppType } from './common'
import { cloudflareRateLimiter } from '@hono-rate-limiter/cloudflare'
import { neon } from '@neondatabase/serverless'
import { schema } from '@tweets-viewer/database'
import { now } from '@tweets-viewer/shared'
import { drizzle } from 'drizzle-orm/neon-http'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { cachedData } from './common'
import imageApp from './routes/image'
import insApp from './routes/ins'
import tweetsApp from './routes/tweets'
import usersApp from './routes/users'
import 'dotenv'

const isDev = process.env.NODE_ENV === 'development'

const app = new Hono<AppType>()

app
  .use(contextStorage())
  .use(cors({
    origin: isDev
      ? '*'
      : ['https://tweet.chilfish.top', 'https://tweets-viewer.pages.dev'],
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    maxAge: 86400,
  }))
  .use(cloudflareRateLimiter({
    rateLimitBinding: (c: any) => c.env.RATE_LIMITER,
    keyGenerator: (c: any) => c.req.header('cf-connecting-ip') || 'anonymous',
  }))
  .use(async (c, next) => {
    const sql = neon(process.env.DATABASE_URL || c.env.DATABASE_URL)
    const db = drizzle({ client: sql, schema })
    c.set('db', db)
    return next()
  })

app
  .get('/', async (c) => {
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
