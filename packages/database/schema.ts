import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { IGPost, IGUserInfo } from '@tweets-viewer/shared'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  restId: text('restId').notNull(),
  userName: text('userName').notNull().unique(),
  jsonData: json('jsonData').$type<EnrichedUser>().notNull(),

  /** Whether this user should be included in daily fetch jobs. Defaults to true. */
  dailyFetch: boolean('daily_fetch').default(true).notNull(),

  /** Instagram username — nullable, populated when user also has IG account */
  insUsername: text('ins_username').unique(),
  /** Instagram user profile info (avatar, bio, follower counts, etc.) */
  insJsonData: json('ins_json_data').$type<IGUserInfo>(),
})

export const tweetsTable = pgTable(
  'tweets',
  {
    id: serial('id').primaryKey(),
    tweetId: text('tweetId').notNull().unique(),
    userId: text('userName')
      .notNull()
      .references(() => usersTable.userName, { onDelete: 'cascade' }),

    fullText: text('fullText').notNull(),
    createdAt: timestamp('createdAt').notNull(),
    jsonData: json('jsonData').$type<EnrichedTweet>().notNull(),
  },
  t => [
    // 主推文列表：userName + createdAt DESC（migration 0001）
    index('idx_tweets_username_createdat').on(t.userId, t.createdAt.desc()),
    // 那年今日 / 日期范围（migration 0001）
    index('idx_tweets_createdat').on(t.createdAt),
    // keyset 排序键：COALESCE(retweeted_original_id, tweetId)（snowflake，时间有序）
    // （migration 0003；须与 modules/tweet.ts 的 sortKeyExpr 保持一致）
    index('idx_tweets_username_sortkey')
      .on(t.userId, sql`(CAST(COALESCE(${t.jsonData}->>'retweeted_original_id', ${t.tweetId}) AS BIGINT)) DESC`),
    // 全文检索 ILIKE %kw%：pg_trgm GIN（migration 0003；需先 CREATE EXTENSION pg_trgm）
    index('idx_tweets_fulltext_trgm').using('gin', sql`${t.fullText} gin_trgm_ops`),
    // 媒体时间线：partial index，谓词与 modules/tweet.ts 的 getMediaTweets 对齐（migration 0004）
    index('idx_tweets_media_sortkey')
      .on(t.userId, sql`(CAST(COALESCE(${t.jsonData}->>'retweeted_original_id', ${t.tweetId}) AS BIGINT)) DESC`)
      .where(sql`json_typeof(${t.jsonData}->'media_details') = 'array'
        AND json_array_length(${t.jsonData}->'media_details') > 0
        AND ${t.jsonData}->>'retweeted_original_id' IS NULL`),
  ],
)

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect

export type InsertTweet = typeof tweetsTable.$inferInsert
export type SelectTweet = typeof tweetsTable.$inferSelect

// ── Instagram Posts Table ──
// ins_users table removed — IG user info merged into users.ins_json_data.
// FK now references users.userName (twitter username).

export const insPostsTable = pgTable('ins_posts', {
  id: serial('id').primaryKey(),
  postId: text('post_id').notNull().unique(),
  /** References users.userName (twitter username), NOT IG username */
  userId: text('username')
    .notNull()
    .references(() => usersTable.userName, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  jsonData: json('jsonData').$type<IGPost>().notNull(),
})

export type InsertInsPost = typeof insPostsTable.$inferInsert
export type SelectInsPost = typeof insPostsTable.$inferSelect
