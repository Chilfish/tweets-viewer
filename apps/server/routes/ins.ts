import { Hono } from 'hono'
import type { AppType } from '../common'
import insData from '../ins-data.json'

const app = new Hono<AppType>()

function getInsData(page: number, reverse: boolean) {
  let data = insData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  if (!reverse) {
    data = data.toReversed()
  }

  return data.slice(page * 10, (page + 1) * 10)
}

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = getInsData(page, reverse)
  return c.json(tweets)
})

export default app
