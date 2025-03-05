import { FetcherService } from 'rettiwt-api'
import { updateAllTeets } from '../database/services'
import { createDb } from './utils'

const db = createDb()
const { TWEET_KEY } = process.env
if (!TWEET_KEY) {
  throw new Error('TWEET_KEY is not set in .env')
}

const tweetApi = new FetcherService({ apiKey: TWEET_KEY })

const res = await updateAllTeets({ db, tweetApi }).catch((err) =>
  console.error(`[updateAllTeets] ${err.message}`),
)
console.log(res)
