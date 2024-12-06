import type { InsertTweet } from '../schema'
import { db } from '../db'
import { tweetsTable } from '../schema'

export async function createTweet(tweet: InsertTweet) {
  return db.insert(tweetsTable).values(tweet)
}
