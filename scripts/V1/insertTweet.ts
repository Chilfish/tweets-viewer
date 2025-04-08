import type { Tweet, User } from '@/types'
import { dataFolders } from '../'
import type { DB, InsertTweet, InsertUser } from '../../database'
import { createTweets, createUser } from '../../database'
import { convertDate } from '../../src/utils/date'
import { createDb, readJson } from '../utils'
import { mergeLocal } from './mergeLocal'

async function insertUser(db: DB, user: InsertUser) {
  await createUser({ db, user }).then(({ rowCount }) =>
    console.log(`Inserted ${rowCount} User`),
  )
}

async function insertTweets(db: DB, folder: string, uid: string) {
  const tweets = await readJson<Tweet[]>(`${folder}/data-tweet.json`)
  const insertTweets: InsertTweet[] = tweets.map((tweet) => ({
    ...tweet,
    id: undefined,
    tweetId: tweet.id,
    userId: uid,
  }))
  insertTweets.forEach(convertDate)

  console.log(`Inserting ${tweets.length} tweets to ${uid}`)

  const chunkSize = 1000
  let insertedCount = 0

  for (let i = 0; i < insertTweets.length; i += chunkSize) {
    const chunk = insertTweets.slice(i, i + chunkSize)
    await createTweets(db, chunk).then(({ rowCount }) => {
      insertedCount += rowCount
    })
  }

  console.log(`Inserted ${insertedCount} Tweets`)
}

async function main() {
  const isInsertUser = !process.argv.includes('--no-user')
  const username = process.argv[process.argv.indexOf('--user') + 1]

  const db = createDb()

  let dataFoldersToInsert = dataFolders
  if (username) {
    dataFoldersToInsert = dataFolders.filter((folder) =>
      folder.includes(username),
    )
  }

  for (const folder of dataFoldersToInsert) {
    await mergeLocal(folder)

    const user = await readJson<User>(`${folder}/data-user.json`)
    convertDate(user)

    console.log(`Inserting data from ${folder}`)
    if (isInsertUser) {
      await insertUser(db, user)
    }

    await insertTweets(db, folder, user.screenName)
  }
}

await main()
