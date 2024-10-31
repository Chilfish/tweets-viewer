import { now } from '@/utils/date'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { isNode } from './common'

import configApp from './routes/config'
import imageApp from './routes/image'
import tweetsApp from './routes/tweets'

const app = new Hono()

app.use(cors())

app
  .get('/', c => c.json({
    tokyoTime: now(),
    serverTime: new Date(),
    message: 'Hello, World!',
  }))
  .route('/image', imageApp)
  .route('/tweets', tweetsApp)
  .route('/config', configApp)

if (isNode) {
  const { serve } = await import('@hono/node-server')
  serve({
    fetch: app.fetch,
    port: 8787,
  })

  console.log('server running on http://localhost:8787')
}

export default {
  fetch: app.fetch,
  scheduled: async (_batch: any, _env: any) => {},
}
