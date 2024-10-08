import type { Tweet } from '../src/types/tweets'
import { Hono } from 'hono'
import { staticUrl } from './common'

const tweetsMap = new Map<string, Tweet[]>()
const pageSize = 10

async function fetchTweets(
  name: string,
  reverse: boolean = false,
) {
  if (tweetsMap.has(name))
    return reverse ? tweetsMap.get(name)!.toReversed() : tweetsMap.get(name)!

  const tweets = await fetch(`${staticUrl}/tweet/data-${name}.json`)
    .then(r => r.json())
    .catch(() => []) as Tweet[]
  tweetsMap.set(name, tweets)

  return reverse ? tweets.toReversed() : tweets
}

async function pagedTweets(
  name: string,
  page: number,
  reverse: boolean,
) {
  const tweets = await fetchTweets(name, reverse)

  const pagedTweets = tweets.slice(page * pageSize, (page + 1) * pageSize)
  return pagedTweets
}

async function searchTweets(
  name: string,
  keyword: string,
  reverse: boolean,
  page: number,
) {
  const tweets = await pagedTweets(name, page, reverse)

  return tweets.filter((t) => {
    const regex = new RegExp(keyword, 'i')
    const isMatch = regex.test(t.full_text)
    return isMatch
  })
}

async function getTweetsByDateRange(
  name: string,
  start: number,
  end: number,
  reverse: boolean,
  page: number,
) {
  const tweets = await pagedTweets(name, page, reverse)
  return tweets.filter((t) => {
    const date = new Date(t.created_at).getTime()
    return date >= start && date <= end
  })
}

async function getLastYearsTodayData(name: string, reverse: boolean) {
  const today = new Date()
  const todayStr = `${today.getMonth() + 1}-${today.getDate()}`

  const lastYearsToday = await fetchTweets(name, reverse)

  return lastYearsToday.filter((item) => {
    const date = new Date(item.created_at)
    return `${date.getMonth() + 1}-${date.getDate()}` === todayStr
  })
}

const app = new Hono()

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await pagedTweets(name, page, reverse)
  return c.json(tweets)
})

app.get('/get/:name/all', async (c) => {
  const name = c.req.param('name')
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await fetchTweets(name, reverse)
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

  const tweets = await getTweetsByDateRange(name, start, end, reverse, page)
  return c.json(tweets)
})

app.get('/get/:name/count', async (c) => {
  const name = c.req.param('name')

  const tweets = await fetchTweets(name)
  return c.json({ count: tweets.length })
})

app.get('/search/:name', async (c) => {
  const name = c.req.param('name')
  const keyword = c.req.query('q')
  const reverse = c.req.query('reverse') === 'true'
  const page = Number(c.req.query('page') || 0)

  if (!keyword)
    return c.json({ error: 'keyword is required' }, 400)

  const tweets = await searchTweets(name, keyword, reverse, page)
  return c.json(tweets)
})

app.get('/last-years-today/:name', async (c) => {
  const name = c.req.param('name')
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await getLastYearsTodayData(name, reverse)
  return c.json(tweets)
})

app.get('/reset/:name', async (c) => {
  const name = c.req.param('name')
  if (!name) {
    tweetsMap.clear()
  }
  else {
    if (!tweetsMap.has(name))
      return c.json({ error: 'name not found' }, 400)

    tweetsMap.set(name, [])
  }

  return c.json({
    success: true,
    size: tweetsMap.size,
  })
})

export default app
