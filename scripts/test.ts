import { createUser } from '../database'
import type { InsertTweet, InsertUser } from '../database'
import { createTweets } from '../database/modules/tweet'
import { readJson } from './utils'
import { createDb } from './utils'

const db = createDb()

const user = await readJson<InsertUser>('data/user.json')
const tweets = await readJson<InsertTweet[]>('data/tweets.json').then((data) =>
  data
    .map((tweet) => ({
      ...tweet,
      id: undefined,
    }))
    .filter((tweet) => tweet.userId === user.screenName),
)

await createUser({ db, user })

const { rowCount } = await createTweets(db, tweets)

console.log('inserted tweets count:', rowCount, tweets.length)
