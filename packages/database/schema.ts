import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { IGPost, IGUserInfo } from '@tweets-viewer/shared'
import {
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
)

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect

export type InsertTweet = typeof tweetsTable.$inferInsert
export type SelectTweet = typeof tweetsTable.$inferSelect

// ── Instagram Tables ──

export const insUsersTable = pgTable('ins_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  jsonData: json('jsonData').$type<IGUserInfo>().notNull(),
})

export const insPostsTable = pgTable('ins_posts', {
  id: serial('id').primaryKey(),
  postId: text('post_id').notNull().unique(),
  userId: text('username')
    .notNull()
    .references(() => insUsersTable.username, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  jsonData: json('jsonData').$type<IGPost>().notNull(),
})

export type InsertInsUser = typeof insUsersTable.$inferInsert
export type SelectInsUser = typeof insUsersTable.$inferSelect

export type InsertInsPost = typeof insPostsTable.$inferInsert
export type SelectInsPost = typeof insPostsTable.$inferSelect
