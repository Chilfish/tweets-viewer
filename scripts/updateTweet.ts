import type {
  InsertTweet,
} from '../database'
import {
  getLatestTweets,
  updateUserTweets,
} from '../database'
import { fetchTweet } from './fetchTweet'
import { createDb } from './utils'

const db = createDb()

async function updateTweet(uid: string, latestTweet: Date) {
  if (!uid) {
    return
  }

  const { tweets, user } = await fetchTweet({ id: uid, endAt: latestTweet })

  const insertTweets: InsertTweet[] = tweets.map(tweet => ({
    ...tweet,
    id: undefined,
    tweetId: tweet.id,
    userId: user.screenName,
  }))

  await updateUserTweets({
    db,
    user: {
      screenName: user.screenName,
      tweetEnd: latestTweet,
    },
    tweets: insertTweets,
  })
    .then(({ rowCount }) => {
      console.log(`Inserted ${rowCount} Tweets for ${user.screenName}`)
    })
}

const usersLatestTweets = await getLatestTweets(db)
for (const data of usersLatestTweets) {
  await updateTweet(data.restId, data.createdAt)
}
