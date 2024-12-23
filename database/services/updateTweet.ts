import type { FetcherService } from 'rettiwt-api'
import type { DB } from '../'
import type { InsertTweet } from '../schema'
import pMap from 'p-map'
import { getLatestTweets, updateUserTweets } from '../modules/tweet'
import { fetchTweet } from './fetchTweet'

async function updateTweet({ tweetApi, db, uid, latestTweet }: {
  tweetApi: FetcherService
  db: DB
  uid: string
  latestTweet: Date
}) {
  if (!uid) {
    return
  }

  const { tweets, user } = await fetchTweet(tweetApi, {
    id: uid,
    endAt: latestTweet,
  })

  const insertTweets: InsertTweet[] = tweets.map(tweet => ({
    ...tweet,
    id: undefined,
    tweetId: tweet.id,
    userId: user.screenName,
  }))

  console.log(`Fetched ${insertTweets.length} Tweets for ${user.screenName}`)

  if (!insertTweets.length) {
    return {
      rowCount: 0,
      user: user.name || uid,
    }
  }

  const { rowCount } = await updateUserTweets({
    db,
    user: {
      screenName: user.screenName,
      tweetEnd: latestTweet,
    },
    tweets: insertTweets,
  })

  console.log(`Inserted ${rowCount} Tweets for ${user.screenName}`)
  return {
    rowCount,
    user: user.name || uid,
  }
}

async function updateAllTeets({ db, tweetApi }: {
  db: DB
  tweetApi: FetcherService
}) {
  const usersLatestTweets = await getLatestTweets(db)

  return pMap(
    usersLatestTweets,
    data => updateTweet({
      tweetApi,
      db,
      uid: data.restId,
      latestTweet: data.createdAt,
    }),
    { concurrency: 1 },
  )
}

export {
  updateAllTeets,
  updateTweet,
}
