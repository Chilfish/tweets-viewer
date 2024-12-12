import type { Tweet, User } from '@/types'
import type { InsertTweet, InsertUser } from '../database'
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-http'
import { createTweets, createUser } from '../database'
import { dataFolders } from './index'
import { readJson } from './utils'

config()

const {
  DATABASE_URL,
} = process.env

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.')
}

const client = neon(DATABASE_URL)
const db = drizzle({ client })

function toInsertUser(user: User): InsertUser {
  return {
    name: user.name,
    screenName: user.screen_name,
    avatarUrl: user.avatar_url,
    profileBannerUrl: user.profile_banner_url,
    followersCount: user.followers_count,
    followingCount: user.following_count,
    bio: user.bio,
    location: user.location,
    website: user.website,
    createdAt: new Date(user.created_at),
    birthday: new Date(user.birthday),
    tweetStart: new Date(user.tweetStart),
    tweetEnd: new Date(user.tweetEnd),
  }
}

function toInsertTweet(tweet: Tweet, uid: string): InsertTweet {
  return {
    userId: uid,
    tweetId: tweet.id,
    createdAt: new Date(tweet.created_at),
    fullText: tweet.full_text,
    media: tweet.media,
    retweetCount: tweet.retweet_count,
    quoteCount: tweet.quote_count,
    replyCount: tweet.reply_count,
    favoriteCount: tweet.favorite_count,
    viewsCount: tweet.views_count,
    retweetedStatus: tweet.retweeted_status,
    quotedStatus: tweet.quoted_status,
  }
}

function errorHandler(folder: string, err: any) {
  console.error(`Error inserting data from ${folder}:\n${err.message}, ${err.detail}`)
}

async function insertUser(user: InsertUser) {
  await createUser({ db, user })
    .then(({ rowCount }) => console.log(`Inserted ${rowCount} User`))
}

async function insertTweets(folder: string, uid: string) {
  console.log(`Inserting data from ${folder}`)

  const tweets = await readJson<Tweet[]>(`${folder}/data-tweet.json`)
    .then(tweets => tweets.map(tweet => toInsertTweet(tweet, uid)))

  console.log(`Inserting ${tweets.length} tweets to ${uid}`)
  await createTweets(db, tweets)
    .then(({ rowCount }) => console.log(`Inserted ${rowCount} tweets`))
}

async function main() {
  const isInsertUser = !process.argv.includes('--no-user')
  for (const folder of dataFolders) {
    const user = await readJson<User>(`${folder}/data-user.json`).then(toInsertUser)

    if (isInsertUser) {
      await insertUser(user)
        .catch(err => errorHandler(folder, err))
    }

    await insertTweets(folder, user.screenName)
      .catch(err => errorHandler(folder, err))
  }
}

main()
