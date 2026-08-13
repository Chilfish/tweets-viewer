import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { DB } from '..'
import type { SelectTweet } from '../schema'
import { now } from '@tweets-viewer/shared'
import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { tweetsTable } from '../schema'

interface GetTweet {
  name: string
  page: number
  pageSize: number
  reverse: boolean
  db: DB
  noReplies?: boolean
}

const BATCH_SIZE = 1000

/**
 * 推文流排序键：优先按被转推原推 id（转推跟随原推时间线），否则按推文 id。
 * snowflake id 时间有序，可直接 cast 为 BIGINT 比较（keyset 分页的游标语义）。
 */
const sortKeyExpr = sql`CAST(COALESCE(${tweetsTable.jsonData}->>'retweeted_original_id', ${tweetsTable.tweetId}) AS BIGINT)`

function _order(reverse: boolean) {
  return reverse ? asc(sortKeyExpr) : desc(sortKeyExpr)
}

/** keyset 游标条件：desc 时取「比游标更小」的键，asc（reverse）时取「更大」的键 */
function cursorCondition(reverse: boolean, cursor?: string) {
  if (!cursor)
    return undefined
  return reverse
    ? sql`${sortKeyExpr} > CAST(${cursor} AS BIGINT)`
    : sql`${sortKeyExpr} < CAST(${cursor} AS BIGINT)`
}

/**
 * 从推文行提取 keyset 游标（排序键字符串）。
 * 与 `sortKeyExpr` 保持同一语义：retweeted_original_id 优先。
 */
export function extractTweetSortKey(row: Pick<SelectTweet, 'tweetId' | 'jsonData'>): string {
  return row.jsonData?.retweeted_original_id ?? row.tweetId
}

/**
 * 推文流分页统一执行器（深模块）。
 *
 * 两种模式：
 * - **offset 模式**（无 cursor）：按 `page` 定位跳页，分页器使用；`hasMore` 由 `offset + length < total` 判定。
 * - **keyset 模式**（有 cursor）：按排序键游标续载，无限滚动使用；取 `pageSize + 1` 条探测 `hasMore`，
 *   深翻页不随页码退化。两种模式都会返回 `meta.nextCursor`（有更多时），供前端滚动续载。
 *
 * `totalNum` 由调用方缓存传入时可跳过 count 查询。
 */
async function paginateTweets({
  db,
  whereClause,
  totalNum,
  page,
  pageSize,
  reverse,
  cursor,
}: {
  db: DB
  whereClause: ReturnType<typeof and>
  totalNum?: number
  page: number
  pageSize: number
  reverse: boolean
  cursor?: string
}): Promise<PaginatedResponse<EnrichedTweet>> {
  let total = totalNum
  if (total === undefined) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(tweetsTable)
      .where(whereClause)
    total = value
  }

  const orderBy = _order(reverse)
  let rows: SelectTweet[]
  let hasMore: boolean

  if (cursor) {
    const rowsWithProbe = await db
      .select()
      .from(tweetsTable)
      .where(and(whereClause, cursorCondition(reverse, cursor)))
      .orderBy(orderBy)
      .limit(pageSize + 1)
    hasMore = rowsWithProbe.length > pageSize
    rows = hasMore ? rowsWithProbe.slice(0, pageSize) : rowsWithProbe
  }
  else {
    const offset = (page - 1) * pageSize
    rows = await db
      .select()
      .from(tweetsTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset)
    hasMore = offset + rows.length < total
  }

  const data = rows.map(mapToEnrichedTweet)
  const nextCursor = hasMore && rows.length > 0
    ? extractTweetSortKey(rows[rows.length - 1])
    : undefined

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      hasMore,
      nextCursor,
    },
  }
}

export async function createTweets({ db, tweets, user }: { db: DB, tweets: EnrichedTweet[], user: EnrichedUser }) {
  // Dedup by tweetId: same ID in one batch triggers "ON CONFLICT DO UPDATE
  // command cannot affect row a second time" (PG code 21000)
  const seen = new Map<string, EnrichedTweet>()
  for (const t of tweets)
    seen.set(t.id, t)
  const deduped = [...seen.values()]
  if (deduped.length < tweets.length) {
    console.warn(`createTweets: deduped ${tweets.length - deduped.length} duplicate tweetId(s)`)
  }

  let insertedCount = 0
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const chunk = deduped.slice(i, i + BATCH_SIZE)

    const { rowCount } = await db
      .insert(tweetsTable)
      .values(chunk.map(tweet => ({
        tweetId: tweet.id,
        userId: user.userName!,
        fullText: tweet.text,
        createdAt: new Date(tweet.created_at),
        jsonData: tweet,
      })))
      .onConflictDoUpdate({
        target: tweetsTable.tweetId,
        set: {
          userId: sql`excluded."userName"`,
          fullText: sql`excluded."fullText"`,
          createdAt: sql`excluded."createdAt"`,
          jsonData: sql`excluded."jsonData"`,
        },
      })
    insertedCount += rowCount
  }
  return { rowCount: insertedCount }
}

/**
 * 获取推文列表
 *
 * 可选传入 `total`（总数），提供时不再查询数据库。
 */
export async function getTweets({
  db,
  name,
  page,
  pageSize,
  reverse,
  noReplies,
  cursor,
  total: providedTotal,
}: GetTweet & { cursor?: string, total?: number }): Promise<PaginatedResponse<EnrichedTweet>> {
  const whereClause = and(
    eq(tweetsTable.userId, name),
    noReplies ? sql`${tweetsTable.jsonData}->>'parent_id' IS NULL` : undefined,
  )

  return paginateTweets({
    db,
    whereClause,
    totalNum: providedTotal,
    page,
    pageSize,
    reverse,
    cursor,
  })
}

export async function getLastYearsTodayTweets({
  db,
  name,
  reverse,
  page,
  pageSize,
  cursor,
}: GetTweet & { cursor?: string }): Promise<PaginatedResponse<EnrichedTweet>> {
  const today = now('beijing')

  const whereClause = and(
    eq(tweetsTable.userId, name),
    sql`EXTRACT(DAY FROM ${tweetsTable.createdAt}) = ${today.getDate()}`,
    sql`EXTRACT(MONTH FROM ${tweetsTable.createdAt}) = ${today.getMonth() + 1}`,
  )

  return paginateTweets({ db, whereClause, page, pageSize, reverse, cursor })
}

export async function getTweetsByDateRange({
  db,
  name,
  startDate,
  endDate,
  reverse,
  page,
  pageSize,
  noReplies,
  cursor,
}: GetTweet & { startDate: Date, endDate: Date, cursor?: string }): Promise<PaginatedResponse<EnrichedTweet>> {
  const whereClause = and(
    eq(tweetsTable.userId, name),
    sql`CAST(${tweetsTable.createdAt} AS DATE) BETWEEN ${startDate} AND ${endDate}`,
    noReplies ? sql`${tweetsTable.jsonData}->>'parent_id' IS NULL` : undefined,
  )

  return paginateTweets({ db, whereClause, page, pageSize, reverse, cursor })
}

/**
 * 关键词搜索。
 *
 * `name` 为空时进行**全库检索**（全局搜索，结果跨用户），否则限定在指定用户内。
 */
export async function getTweetsByKeyword({
  db,
  name,
  keyword,
  page,
  pageSize,
  reverse,
  cursor,
}: GetTweet & { keyword: string, cursor?: string }): Promise<PaginatedResponse<EnrichedTweet>> {
  const whereClause = and(
    name ? eq(tweetsTable.userId, name) : undefined,
    sql`${tweetsTable.fullText} ILIKE ${`%${keyword}%`}`,
  )

  return paginateTweets({ db, whereClause, page, pageSize, reverse, cursor })
}

export async function getTweetsCount(db: DB, name: string, noReplies?: boolean) {
  return db
    .select({
      value: count(tweetsTable.id),
    })
    .from(tweetsTable)
    .where(and(
      eq(tweetsTable.userId, name),
      noReplies ? sql`${tweetsTable.jsonData}->>'parent_id' IS NULL` : undefined,
    ))
}

/**
 * 获取带媒体的推文列表（排除转推）。
 * 可选 `startDate`/`endDate` 限定日期范围（媒体按年/日期段浏览）。
 */
export async function getMediaTweets({
  db,
  name,
  page,
  pageSize,
  reverse,
  cursor,
  startDate,
  endDate,
  total: providedTotal,
}: GetTweet & { cursor?: string, startDate?: Date, endDate?: Date, total?: number }): Promise<PaginatedResponse<EnrichedTweet>> {
  const whereClause = and(
    eq(tweetsTable.userId, name),
    // 排除转推
    sql`${tweetsTable.jsonData}->>'retweeted_original_id' IS NULL`,
    // 必须包含媒体
    sql`json_typeof(${tweetsTable.jsonData}->'media_details') = 'array'`,
    sql`json_array_length(${tweetsTable.jsonData}->'media_details') > 0`,
    startDate && endDate
      ? sql`CAST(${tweetsTable.createdAt} AS DATE) BETWEEN ${startDate} AND ${endDate}`
      : undefined,
  )

  return paginateTweets({
    db,
    whereClause,
    totalNum: providedTotal,
    page,
    pageSize,
    reverse,
    cursor,
  })
}

export async function getMediaTweetsCount(db: DB, name: string) {
  return db
    .select({
      value: count(),
    })
    .from(tweetsTable)
    .where(and(
      eq(tweetsTable.userId, name),
      sql`${tweetsTable.jsonData}->>'retweeted_original_id' IS NULL`,
      sql`json_typeof(${tweetsTable.jsonData}->'media_details') = 'array'`,
      sql`json_array_length(${tweetsTable.jsonData}->'media_details') > 0`,
    ))
}

/**
 * 用户推文按年统计（档案完整性指示：覆盖年份范围 + 每年条数 + 缺口推断）。
 * 返回按年份降序的 [{ year, count }]。
 */
export async function getTweetsYearStats(db: DB, name: string): Promise<{ year: number, count: number }[]> {
  const rows = await db
    .select({
      year: sql<number>`EXTRACT(YEAR FROM ${tweetsTable.createdAt})`,
      count: count(),
    })
    .from(tweetsTable)
    .where(eq(tweetsTable.userId, name))
    .groupBy(sql`EXTRACT(YEAR FROM ${tweetsTable.createdAt})`)
    .orderBy(desc(sql`EXTRACT(YEAR FROM ${tweetsTable.createdAt})`))

  return rows.map(row => ({ year: Number(row.year), count: Number(row.count) }))
}

export function mapToEnrichedTweet(tweet: SelectTweet): EnrichedTweet {
  return tweet.jsonData
}
