import pMap from 'p-map'
import type { FetcherService } from 'rettiwt-api'
import type { DB } from '../index'
import { getLatestTweets, updateUserTweets } from '../modules/tweet'
import type { InsertTweet } from '../schema'
import { fetchTweet } from './fetchTweet'

async function updateTweet({
  tweetApi,
  db,
  uid,
  latestTweet,
}: {
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

  const insertTweets: InsertTweet[] = tweets.map((tweet) => ({
    ...tweet,
    id: undefined,
    tweetId: tweet.id,
    userId: user.screenName,
  }))
  // .filter(tweet => tweet.userId === )

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

async function updateAllTweets({
  db,
  tweetApi,
}: {
  db: DB
  tweetApi: FetcherService
}) {
  const usersLatestTweets = await getLatestTweets(db)

  return pMap(
    usersLatestTweets,
    (data) =>
      updateTweet({
        tweetApi,
        db,
        uid: data.restId,
        latestTweet: data.createdAt,
      }).catch((err) => {
        console.log(`${err.cause || err.message}`)
        return {
          rowCount: 0,
          user: '',
        }
      }),
    {
      concurrency: 1,
      stopOnError: false,
    },
  )
}

export { updateAllTweets, updateTweet }
