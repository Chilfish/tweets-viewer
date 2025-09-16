import { Hono } from 'hono'
import type { AppType } from '../common'
import { getInsData } from '../data'

const app = new Hono<AppType>()

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = getInsData({ name, page, reverse })
  return c.json(tweets)
})

export default app
