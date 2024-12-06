import {
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  screenName: text('screen_name').notNull().unique(),
  avatarUrl: text('avatar_url').notNull(),
  profileBannerUrl: text('profile_banner_url').notNull(),
  followersCount: integer('followers_count').notNull(),
  followingCount: integer('following_count').notNull(),
  bio: text('bio').notNull(),
  createdAt: timestamp('created_at').notNull(),
  location: text('location'),
  website: text('website'),
  birthday: timestamp('birthday'),
})

export const tweetsTable = pgTable('tweets', {
  id: serial('id').primaryKey(),
  tweetId: text('tweet_id').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  fullText: text('full_text').notNull(),
  media: json('media').notNull().default([]),
  inReplyTo: text('in_reply_to'),
  retweetedStatus: text('retweeted_status'),
  quotedStatus: text('quoted_status'),
  retweetCount: integer('retweet_count').notNull().default(0),
  quoteCount: integer('quote_count').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  favoriteCount: integer('favorite_count').notNull().default(0),
  viewsCount: integer('views_count').notNull().default(0),
}, table => ({
  tweetIdIdx: index('tweet_id_idx').on(table.tweetId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  textIdx: index('text_idx').on(table.fullText),
}))

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect

export type InsertTweet = typeof tweetsTable.$inferInsert
export type SelectTweet = typeof tweetsTable.$inferSelect
