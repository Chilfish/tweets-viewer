import type { AppType } from '../common'
import { Hono } from 'hono'
import { getData } from '../common'

async function getInsData({
  page,
  reverse,
  name,
}: {
  page: number
  reverse: boolean
  name: string
}) {
  const tweets = await getData(name)

  let data = tweets
  if (!reverse) {
    data = data.toReversed()
  }

  return data.slice(page * 10, (page + 1) * 15)
}

const app = new Hono<AppType>()

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await getInsData({ name, page, reverse })
  return c.json(tweets)
})

export default app
