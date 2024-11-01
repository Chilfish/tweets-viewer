import { formatDate, now } from '@/utils/date'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import configApp from './routes/config'
import imageApp from './routes/image'
import tweetsApp from './routes/tweets'

const app = new Hono()

app.use(cors())

app
  .get('/', (c) => {
    return c.json({
      tokyoTime: formatDate(now()),
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
