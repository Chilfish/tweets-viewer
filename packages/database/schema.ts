import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
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
