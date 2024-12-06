import { formatDate, getDate, now } from '@/utils/date'
import { cloudflareRateLimiter } from '@hono-rate-limiter/cloudflare'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import configApp from './routes/config'
import imageApp from './routes/image'
import tweetsApp from './routes/tweets'

interface AppType {
  Variables: {
    rateLimit: boolean
  }
  Bindings: {
    RATE_LIMITER: RateLimit
  }
}

const app = new Hono<AppType>()

app
  .use(cors())
  .use(cloudflareRateLimiter<AppType>({
    rateLimitBinding: c => c.env.RATE_LIMITER,
    keyGenerator: c => c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown',
  }))

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
  .route('/image', imageApp)
  .route('/tweets', tweetsApp)
  .route('/config', configApp)

export default {
  fetch: app.fetch,
  scheduled: async (_batch: any, _env: any) => {},
}
