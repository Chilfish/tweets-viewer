import type { AppType } from './common'
import { now } from '@tweets-viewer/shared'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { cachedData } from './common'
import imageApp from './routes/image'
import insApp from './routes/ins'
import tweetsApp from './routes/tweets'
import usersApp from './routes/users'
import tweetsAppV3 from './routes/v3/tweets'

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
    const { DATABASE_URL } = c.env
    // const sql = neon(DATABASE_URL)
    // const db = drizzle({ client: sql })
    // c.set('db', db)
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
  .route('/v2/tweets', tweetsApp)
  .route('/v3/users', usersApp)
  .route('/v2/image', imageApp)
  .route('/v2/ins', insApp)
  .route('/v3/tweets', tweetsAppV3)

app.onError((err, c) => {
  console.error(`${err}`)
  return c.json(err, 500)
})

export default {
  fetch: app.fetch,
  scheduled: async (_batch: any, _env: any) => {},
}
