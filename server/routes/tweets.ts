import {
  getLastYearsTodayTweets,
  getTweets,
  getTweetsByDateRange,
  getTweetsByKeyword,
} from '@db/index'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get/:uid', async (c) => {
  const uid = Number(c.req.param('uid'))
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await getTweets({ uid, page, reverse })
  return c.json(tweets)
})

app.get('/get/:uid/range', async (c) => {
  const uid = Number(c.req.param('uid'))
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

  const tweets = await getTweetsByDateRange({ uid, start, end, reverse, page })
  return c.json(tweets)
})

app.get('/search/:uid', async (c) => {
  const uid = Number(c.req.param('uid'))
  const keyword = c.req.query('q')
  const reverse = c.req.query('reverse') === 'true'
  const page = Number(c.req.query('page') || 0)

  if (!keyword)
    return c.json({ error: 'keyword is required' }, 400)

  const tweets = await getTweetsByKeyword({ uid, keyword, reverse, page })
  return c.json(tweets)
})

app.get('/get/:uid/last-years-today', async (c) => {
  const uid = Number(c.req.param('uid'))
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await getLastYearsTodayTweets({ uid, reverse, page: 0 })
  return c.json(tweets)
})

export default app
