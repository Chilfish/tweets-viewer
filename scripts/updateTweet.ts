import {
  getLatestTweets,
} from '../database'
import { updateTweet } from '../database/services'
import { createDb } from './utils'

const db = createDb()
const usersLatestTweets = await getLatestTweets(db)
for (const data of usersLatestTweets) {
  await updateTweet(db, data.restId, data.createdAt)
}
