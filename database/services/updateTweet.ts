import type { DB } from '../'
import type { InsertTweet } from '../schema'
import { updateUserTweets } from '../modules/tweet'
import { fetchTweet } from './fetchTweet'

async function updateTweet(db: DB, uid: string, latestTweet: Date) {
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

export {
  updateTweet,
}
