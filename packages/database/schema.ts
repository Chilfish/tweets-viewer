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
