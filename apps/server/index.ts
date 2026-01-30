import type { AppType } from './common'
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

const app = new Hono<AppType>()

app
  .use(contextStorage())
  .use(cors())
  // .use(cloudflareRateLimiter<AppType>({
  //   rateLimitBinding: c => c.env.RATE_LIMITER,
  //   keyGenerator: c => c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown',
  // }))
  .use(async (c, next) => {
    const sql = neon(c.env.DATABASE_URL)
    const db = drizzle({ client: sql, schema })
    c.set('db', db)
    return next()
  })

app
  .get('/', async (c) => {
    // const { db } = getContext<AppType>().var
    // const users = await getUsers(db)
    // await setAllUsersInsData(users)

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
  console.error(`${err}`)
  return c.json(err, 500)
})

export default {
  fetch: app.fetch,
  scheduled: async (_batch: any, _env: any) => {},
}
