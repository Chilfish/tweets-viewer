import { formatDate, getDate, now } from '@/utils/date'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import type { AppType } from './common'
import imageApp from './routes/image'
import tweetsApp from './routes/tweets'
import usersApp from './routes/users'

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
    const sql = neon(DATABASE_URL)
    const db = drizzle({ client: sql })
    c.set('db', db)
    return next()
  })

app
  .get('/', (c) => {
    const today = now()

    const date = getDate('2022-01-01 23:30:01:00')
    date.setHours(date.getHours() + 1)

    const dateStr = `${date.getMonth() + 1}-${date.getDate()}`

    return c.json({
      date: dateStr,
      today,
      tokyoTime: formatDate(now('tokyo')),
      beijingTime: formatDate(now('beijing')),
      serverTime: new Date().toLocaleString(),
      message: 'Hello, World!',
    })
  })
  .route('/v2/tweets', tweetsApp)
  .route('/v2/users', usersApp)
  .route('/v2/image', imageApp)

app.onError((err, c) => {
  console.error(`${err}`)
  return c.json(err, 500)
})

export default {
  fetch: app.fetch,
  scheduled: async (_batch: any, _env: any) => {},
}
