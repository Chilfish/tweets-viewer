import type { AppType } from 'common'
import {
  getLastYearsTodayTweets,
  getTweets,
  getTweetsByDateRange,
  getTweetsByKeyword,
} from '@db/index'
import { Hono } from 'hono'
import { getContext } from 'hono/context-storage'

const app = new Hono()

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'
  const { db } = getContext<AppType>().var

  const tweets = await getTweets({ db, name, page, reverse })
  return c.json(tweets)
})

app.get('/get/:name/range', async (c) => {
  const name = c.req.param('name')
  const start = Number(c.req.query('start'))
  const end = Number(c.req.query('end'))
  const reverse = c.req.query('reverse') === 'true'
  const page = Number(c.req.query('page') || 0)

  if (!start || !end)
    return c.json({ error: 'start and end are required' }, 400)
  if (start > end)
    return c.json({ error: 'start must be less than end' }, 400)
  if (start < 0 || end < 0)
    return c.json({ error: 'start and end must be positive' }, 400)

  const { db } = getContext<AppType>().var
  const tweets = await getTweetsByDateRange({ db, name, start, end, reverse, page })
  return c.json(tweets)
})

app.get('/search/:name', async (c) => {
  const name = c.req.param('name')
  const keyword = c.req.query('q')
  const reverse = c.req.query('reverse') === 'true'
  const page = Number(c.req.query('page') || 0)

  if (!keyword)
    return c.json({ error: 'keyword is required' }, 400)

  const { db } = getContext<AppType>().var
  const tweets = await getTweetsByKeyword({ db, name, keyword, reverse, page })
  return c.json(tweets)
})

app.get('/get/:name/last-years-today', async (c) => {
  const name = c.req.param('name')
  const reverse = c.req.query('reverse') === 'true'

  const { db } = getContext<AppType>().var
  const tweets = await getLastYearsTodayTweets({ db, name, reverse, page: 0 })
  return c.json(tweets)
})

export default app
