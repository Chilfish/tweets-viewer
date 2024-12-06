import type { InsertTweet } from '../schema'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { tweetsTable } from '../schema'

interface GetTweet {
  uid: number
  page: number
  reverse: boolean
}

const pageSize = 10

export async function createTweet(tweet: InsertTweet) {
  return db.insert(tweetsTable).values(tweet)
}

export async function getTweets({ uid, page, reverse }: GetTweet) {
  return db
    .select()
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, uid))
    .orderBy(reverse ? desc(tweetsTable.createdAt) : asc(tweetsTable.createdAt))
    .limit(pageSize)
    .offset(page * pageSize)
}
