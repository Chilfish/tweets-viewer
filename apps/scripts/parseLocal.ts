import glob from 'fast-glob'
import type { Tweet } from '@/types'
import { readJson, writeJson } from '../../packages/shared/utils'
import type { TweetData } from '../database/services'
import { filterTweet, filterUser } from '../database/services/filterTweet'

const uid = 'sonysmasme'

const dir = `F:/Documents/Tweets/${uid}`
const jsons = await glob(`${dir}/**/twitter-*.json`)

const data = (await Promise.all<any[]>(jsons.map(readJson)).then((data) =>
  data.flat(),
)) as TweetData[]

console.log(`Found ${data.length} tweets`)

const user = filterUser(data[0])

if (!user) {
  console.error('No user found in the tweets')
  process.exit(1)
}

const filtered = data
  .map((tweet) => {
    try {
      return filterTweet(tweet)
    } catch (e) {
      return null
    }
  })
  .filter((tweet): tweet is Tweet => Boolean(tweet))
  // .filter((tweet) => tweet?.userId === uid)
  .sort((a, b) => Number(b.id) - Number(a.id))

await writeJson(`${dir}/data.json`, filtered)
await writeJson(`${dir}/data-user.json`, user)

const insertTweets: any[] = filtered.map((tweet: any) => {
  tweet.id = undefined
  return tweet
})

await writeJson(
  `${dir}/${uid}.json`,
  {
    user,
    tweets: insertTweets,
  },
  'write',
  0,
)
