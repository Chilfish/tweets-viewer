import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { AppType } from '../../common'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Hono } from 'hono'

const app = new Hono<AppType>()

const allTweets = await readFile(path.join(process.cwd(), 'tmp/merged.json'), 'utf8')
  .then(data => JSON.parse(data) as EnrichedTweet[])

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 0)
  const reverse = c.req.query('reverse') === 'true'

  const tweets = allTweets
    // .filter(tweet => tweet.user.screen_name === name)
    .sort((a, b) => reverse ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id))
    .slice(page * 10, (page + 1) * 10)

  return c.json(tweets)
})

export default app
