import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { FetcherService } from 'rettiwt-api'
import { updateAllTweets } from '../database/services'
import 'dotenv/config'

function createDb() {
  const { DATABASE_URL } = process.env

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.')
  }

  const client = neon(DATABASE_URL)
  return drizzle({ client })
}

const db = createDb()
const { TWEET_KEY } = process.env
if (!TWEET_KEY) {
  throw new Error('TWEET_KEY is not set in .env')
}

const tweetApi = new FetcherService({ apiKey: TWEET_KEY })

const res = await updateAllTweets({ db, tweetApi }).catch((err) =>
  console.error(`[updateAllTweets] ${err.message}`),
)
console.log(res)
