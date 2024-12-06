import type { InsertTweet } from '../schema'
import {
  and,
  asc,
  count,
  desc,
  eq,
  sql,
} from 'drizzle-orm'
import { now } from '../../src/utils/date'
import { db } from '../db'
import { tweetsTable } from '../schema'

interface GetTweet {
  uid: number
  page: number
  reverse: boolean
}

const pageSize = 10

export async function createTweets(tweets: InsertTweet[]) {
  return db.insert(tweetsTable).values(tweets)
}

const _order = (reverse: boolean) => reverse ? desc(tweetsTable.createdAt) : asc(tweetsTable.createdAt)

export async function getTweets({ uid, page, reverse }: GetTweet) {
  return db
    .select()
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, uid))
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(page * pageSize)
}

export async function getLastYearsTodayTweets({ uid, reverse }: GetTweet) {
  const today = now('beijing')

  return db
    .select()
    .from(tweetsTable)
    .where(and(
      eq(tweetsTable.userId, uid),
      sql`EXTRACT(DAY FROM ${tweetsTable.createdAt}) = ${today.getDate()}`,
    ))
    .orderBy(_order(reverse))
}

export async function getTweetsByDateRange({
  uid,
  start,
  end,
  reverse,
  page,
}: GetTweet & { start: Date, end: Date }) {
  return db
    .select()
    .from(tweetsTable)
    .where(and(
      eq(tweetsTable.userId, uid),
      sql`CAST(${tweetsTable.createdAt} AS DATE) BETWEEN ${start} AND ${end}`,
    ))
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(page * pageSize)
}

export async function getTweetsByKeyword({
  uid,
  keyword,
  page,
  reverse,
}: GetTweet & { keyword: string }) {
  return db
    .select()
    .from(tweetsTable)
    .where(and(
      eq(tweetsTable.userId, uid),
      sql`${tweetsTable.fullText} ILIKE ${`%${keyword}%`}`,
    ))
    .orderBy(_order(reverse))
    .limit(pageSize)
    .offset(page * pageSize)
}

export async function getTweetsCount(uid: number) {
  return db
    .select({
      value: count(tweetsTable.id),
    })
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, uid))
}
