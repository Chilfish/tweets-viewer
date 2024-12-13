import type { Tweet, User } from '@/types'
import type { InsertTweet, InsertUser } from '../database'
import { convertDate } from '@/utils/date'
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

async function insertUser(user: InsertUser) {
  await createUser({ db, user })
    .then(({ rowCount }) => console.log(`Inserted ${rowCount} User`))
}

async function insertTweets(folder: string, uid: string) {
  const tweets = await readJson<Tweet[]>(`${folder}/data-tweet.json`)
  const insertTweets: InsertTweet[] = tweets.map(tweet => ({
    ...tweet,
    id: undefined,
    tweetId: tweet.id,
    userId: uid,
  }))
  insertTweets.forEach(convertDate)

  console.log(`Inserting ${tweets.length} tweets to ${uid}`)
  await createTweets(db, insertTweets)
    .then(({ rowCount }) => console.log(`Inserted ${rowCount} tweets`))
}

async function main() {
  const isInsertUser = !process.argv.includes('--no-user')
  for (const folder of dataFolders) {
    const user = await readJson<User>(`${folder}/data-user.json`)
    convertDate(user)

    console.log(`Inserting data from ${folder}`)
    if (isInsertUser) {
      await insertUser(user)
    }

    await insertTweets(folder, user.screenName)
  }
}

main()
