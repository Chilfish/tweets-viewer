import { FetcherService } from 'rettiwt-api'
import {
  fetchTweet,
  fetchUser,
} from '../../database/services'
import {
  baseDir,
  cachedData,
  writeJson,
} from '../utils'
import 'dotenv/config'

const username = process.argv[2] || 'elonmusk'
const isForce = process.argv.includes('--force')
const tmpDir = baseDir('tmp')

const { TWEET_KEY } = process.env
if (!TWEET_KEY) {
  throw new Error('TWEET_KEY is not set in .env')
}

const tweetApi = new FetcherService({ apiKey: TWEET_KEY })

const userData = await cachedData(
  tmpDir(`fetch/user-${username}.json`),
  () => fetchUser(tweetApi, username),
  isForce,
)

const { tweets, user } = await cachedData(
  tmpDir(`fetch/tweets-${username}.json`),
  () => fetchTweet(tweetApi, {
    id: userData.rest_id,
    endAt: new Date('2024-11-21'),
  }),
  isForce,
)

await writeJson(tmpDir(`user-${username}.json`), user)

console.log('Fetched', tweets.length, 'tweets')
await writeJson(tmpDir(`tweets-${username}.json`), tweets)
