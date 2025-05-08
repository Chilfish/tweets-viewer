import { FetcherService } from 'rettiwt-api'
import { fetchTweet } from '../database/services'
import { writeJson } from './utils'

const { TWEET_KEY } = process.env
if (!TWEET_KEY) {
  throw new Error('TWEET_KEY is not set in .env')
}

const tweetApi = new FetcherService({
  apiKey: TWEET_KEY,
  logging: true,
})

const data = await fetchTweet(tweetApi, {
  endAt: new Date('2025-04-10'),
  id: '1253494572841201665',
})

await writeJson('data/tweets.json', data)
