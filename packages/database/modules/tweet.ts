import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { DB } from '..'
import { now } from '@tweets-viewer/shared'
import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { tweetsTable, usersTable } from '../schema'

interface GetTweet {
  name: string
  page: number
  reverse: boolean
  db: DB
}

const PAGE_SIZE = 10
const BANCH_SIZE = 1000

export async function createTweets({ db, tweets, user}: { db: DB, tweets: EnrichedTweet[], user: EnrichedUser }) {
  let insertedCount = 0
  for (let i = 0; i < tweets.length; i += BANCH_SIZE) {
    const chunk = tweets.slice(i, i + BANCH_SIZE)

    const { rowCount } = await db
      .insert(tweetsTable)
      .values(chunk.map(tweet => ({
        tweetId: tweet.id,
        userId: user.userName,
        fullText: tweet.text,
        createdAt: new Date(tweet.created_at),
        jsonData: tweet,
      })))
      .onConflictDoNothing()
    insertedCount += rowCount
  }
  return { rowCount: insertedCount }
}

function _order(reverse: boolean) {
  return reverse ? desc(tweetsTable.createdAt) : asc(tweetsTable.createdAt)
}

export async function getTweets({ db, name, page, reverse }: GetTweet) {
  return db
    .select()
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, name))
    .orderBy(_order(reverse))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE)
}

export async function getLastYearsTodayTweets({ db, name, reverse }: GetTweet) {
  const today = now('beijing')

  return db
    .select()
    .from(tweetsTable)
    .where(
      and(
        eq(tweetsTable.userId, name),
        sql`EXTRACT(DAY FROM ${tweetsTable.createdAt}) = ${today.getDate()}`,
        sql`EXTRACT(MONTH FROM ${tweetsTable.createdAt}) = ${today.getMonth() + 1}`,
      ),
    )
    .orderBy(_order(reverse))
}

export async function getTweetsByDateRange({
  db,
  name,
  start,
  end,
  reverse,
  page,
}: GetTweet & { start: number, end: number }) {
  return db
    .select()
    .from(tweetsTable)
    .where(
      and(
        eq(tweetsTable.userId, name),
        sql`CAST(${tweetsTable.createdAt} AS DATE) BETWEEN ${new Date(start)} AND ${new Date(end)}`,
      ),
    )
    .orderBy(_order(reverse))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE)
}

export async function getTweetsByKeyword({
  db,
  name,
  keyword,
  page,
  reverse,
}: GetTweet & { keyword: string }) {
  return db
    .select()
    .from(tweetsTable)
    .where(
      and(
        eq(tweetsTable.userId, name),
        sql`${tweetsTable.fullText} ILIKE ${`%${keyword}%`}`,
      ),
    )
    .orderBy(_order(reverse))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE)
}

export async function getTweetsCount(db: DB, name: string) {
  return db
    .select({
      value: count(tweetsTable.id),
    })
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, name))
}

export async function getLatestTweets(db: DB) {
  const result = await db.execute(sql`
    SELECT u.screen_name, u.rest_id, t.created_at
    FROM ${usersTable} u
    LEFT JOIN (
        SELECT DISTINCT ON (user_name) *
        FROM ${tweetsTable}
        ORDER BY user_name, created_at DESC
    ) t ON u.screen_name = t.user_name
    ORDER BY t.created_at DESC NULLS LAST
`)

  return result.rows.map(row => ({
    restId: row.rest_id as string,
    screenName: row.screen_name as string,
    // fullText: row.full_text as string,
    createdAt: new Date(row.created_at as string),
  }))
}
