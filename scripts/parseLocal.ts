import type { Tweet } from '@/types'
import glob from 'fast-glob'
import { createTweets, createUser } from '../database'
import { filterTweet, filterUser } from '../database/services'
import type { TweetData } from '../database/services'
import { createDb, readJson, writeJson } from './utils'

const db = createDb()

const uid = 'mika_d_dr'
const birthday = '1983-06-24'

const dir = `F:/Downloads/tweet-data/${uid}`
const jsons = await glob(`${dir}/**/*.json`)

const data = (await Promise.all<any[]>(jsons.map(readJson)).then((data) =>
  data.flat(),
)) as TweetData[]

let user: any = {}

const filtered = data
  .map((tweet) => {
    try {
      user = filterUser(tweet, new Date(birthday))
      return filterTweet(tweet)
    } catch (e) {
      return null
    }
  })
  .filter((tweet) => tweet?.userId === uid)
  .filter((tweet): tweet is Tweet => Boolean(tweet))
  .sort((a, b) => Number(b.id) - Number(a.id))

await writeJson(`${dir}/data.json`, filtered)
await writeJson(`${dir}/data-user.json`, user)

const insertTweets: any[] = filtered.map((tweet: any) => {
  tweet.id = undefined
  return tweet
})

await createUser({ db, user })
await createTweets(db, insertTweets)
