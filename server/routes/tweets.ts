import type { Tweet } from '@/types/tweets'
import { getDate, now } from '@/utils/date'
import { Hono } from 'hono'
import { staticUrl } from '../common'

const tweetsMap = new Map<string, Tweet[]>()
const pageSize = 10

async function fetchTweets(
  name: string,
  reverse: boolean = false,
) {
  if (tweetsMap.get(name)?.length)
    return reverse ? tweetsMap.get(name)!.toReversed() : tweetsMap.get(name)!

  const url = `${staticUrl}/tweet/data-${name}.json`
  const tweets = await fetch(url)
    .then(r => r.json())
    .then(data => data.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    }))
    .catch((e) => {
      console.error(`Failed to fetch tweets for ${url}:`, e)
      return []
    }) as Tweet[]

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
  const tweets = await fetchTweets(name, reverse)

  const filteredTweets = tweets.filter((t) => {
    const regex = new RegExp(keyword, 'i')
    const isMatch = regex.test(t.full_text)
    return isMatch
  })

  const pagedTweets = filteredTweets.slice(page * pageSize, (page + 1) * pageSize)
  return pagedTweets
}

async function getTweetsByDateRange(
  name: string,
  start: number,
  end: number,
  reverse: boolean,
  page: number,
) {
  const tweets = await fetchTweets(name, reverse)
  return tweets
    .filter((t) => {
      const date = getDate(t.created_at).getTime()
      return date >= start && date <= end
    })
    .slice(page * pageSize, (page + 1) * pageSize)
}

async function getLastYearsTodayData(name: string, reverse: boolean) {
  const today = now('beijing')
  const todayStr = `${today.getMonth() + 1}-${today.getDate()}`

  const tweets = await fetchTweets(name, reverse)

  return tweets.filter((item) => {
    const date = getDate(item.created_at)
    date.setHours(date.getHours() + 1)

    const dateStr = `${date.getMonth() + 1}-${date.getDate()}`
    return dateStr === todayStr
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

app.get('/get/:name/last-years-today', async (c) => {
  const name = c.req.param('name')
  const reverse = c.req.query('reverse') === 'true'

  const tweets = await getLastYearsTodayData(name, reverse)
  return c.json(tweets)
})

app.get('/reset', async (c) => {
  tweetsMap.clear()

  return c.json({
    success: true,
    size: tweetsMap.size,
  })
})

app.get('/status', (c) => {
  const keys = Array.from(tweetsMap.keys())
  const sizes = keys.map(key => tweetsMap.get(key)?.length)

  const status = keys.map((key, index) => ({
    name: key,
    size: sizes[index],
  }))

  return c.json({
    status,
  })
})

export default app
