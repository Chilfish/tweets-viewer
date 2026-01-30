import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { DB } from '..'
import type { SelectTweet } from '../schema'
import { now } from '@tweets-viewer/shared'
import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { tweetsTable, usersTable } from '../schema'

interface GetTweet {
  name: string
  page: number
  pageSize: number
  reverse: boolean
  db: DB
}

const BANCH_SIZE = 1000

export async function createTweets({ db, tweets, user }: { db: DB, tweets: EnrichedTweet[], user: EnrichedUser }) {
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
  return reverse ? asc(tweetsTable.createdAt) : desc(tweetsTable.createdAt)
}

/**
 * 获取推文列表
 * @param total - 可选的总数，如果提供不再查询数据库
 */
export async function getTweets({
  db,
  name,
  page,
  pageSize,
  reverse,
  total: providedTotal,
}: GetTweet & { total?: number }): Promise<PaginatedResponse<EnrichedTweet>> {
  const offset = (page - 1) * pageSize

  let totalNum = providedTotal
  if (totalNum === undefined) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(tweetsTable)
      .where(eq(tweetsTable.userId, name))
    totalNum = value
  }

  const rows = await db
    .select()
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, name))
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(offset)

  const data = rows.map(mapToEnrichedTweet)

  return {
    data,
    meta: {
      total: totalNum,
      page,
      pageSize,
      hasMore: offset + data.length < totalNum,
    },
  }
}

export async function getLastYearsTodayTweets({
  db,
  name,
  reverse,
  page,
  pageSize,
}: GetTweet): Promise<PaginatedResponse<EnrichedTweet>> {
  const today = now('beijing')
  const offset = (page - 1) * pageSize

  const whereClause = and(
    eq(tweetsTable.userId, name),
    sql`EXTRACT(DAY FROM ${tweetsTable.createdAt}) = ${today.getDate()}`,
    sql`EXTRACT(MONTH FROM ${tweetsTable.createdAt}) = ${today.getMonth() + 1}`,
  )

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(tweetsTable)
    .where(whereClause)

  const rows = await db
    .select()
    .from(tweetsTable)
    .where(whereClause)
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(offset)

  const data = rows.map(mapToEnrichedTweet)

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      hasMore: offset + data.length < total,
    },
  }
}

export async function getTweetsByDateRange({
  db,
  name,
  startDate,
  endDate,
  reverse,
  page,
  pageSize,
}: GetTweet & { startDate: Date, endDate: Date }): Promise<PaginatedResponse<EnrichedTweet>> {
  const offset = (page - 1) * pageSize
  const whereClause = and(
    eq(tweetsTable.userId, name),
    sql`CAST(${tweetsTable.createdAt} AS DATE) BETWEEN ${startDate} AND ${endDate}`,
  )

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(tweetsTable)
    .where(whereClause)

  const rows = await db
    .select()
    .from(tweetsTable)
    .where(whereClause)
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(offset)

  const data = rows.map(mapToEnrichedTweet)

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      hasMore: offset + data.length < total,
    },
  }
}

export async function getTweetsByKeyword({
  db,
  name,
  keyword,
  page,
  pageSize,
  reverse,
}: GetTweet & { keyword: string }): Promise<PaginatedResponse<EnrichedTweet>> {
  const offset = (page - 1) * pageSize
  const whereClause = and(
    eq(tweetsTable.userId, name),
    sql`${tweetsTable.fullText} ILIKE ${`%${keyword}%`}`,
  )

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(tweetsTable)
    .where(whereClause)

  const rows = await db
    .select()
    .from(tweetsTable)
    .where(whereClause)
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(offset)

  const data = rows.map(mapToEnrichedTweet)

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      hasMore: offset + data.length < total,
    },
  }
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
    createdAt: new Date(row.created_at as string),
  }))
}

export function mapToEnrichedTweet(tweet: SelectTweet): EnrichedTweet {
  return tweet.jsonData
}
