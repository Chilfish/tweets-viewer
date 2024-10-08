import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { isNode } from './common'
import imageApp from './image'

const app = new Hono()

app.use(cors())

app
  .get('/', c => c.text('Hello World'))
  .route('/image', imageApp)

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
  scheduled: async (_batch, _env) => {},
}
