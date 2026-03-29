import { neon } from '@neondatabase/serverless'
import { createTweets, getAllUsers, schema } from '@tweets-viewer/database'
import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'

import { drizzle } from 'drizzle-orm/neon-http'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())
const twitterPool = new RettiwtPool(KEYS)

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

async function fetchTimeline(userId: string, cursor?: string) {
  const rawTweets = await apiClient.fetchUserTimelineWithRepliesRaw(userId, cursor)
  if (!rawTweets.tweets.length) {
    console.error({
      userId,
      message: 'No tweets found',
      action: 'fetch-timeline',
    })
    return {
      tweets: [],
      cursor: '',
    }
  }

  const enrichedTweets = enrichmentService.enrichUserTimelineTweets(rawTweets.tweets, userId)

  return {
    tweets: enrichedTweets,
    cursor: rawTweets.cursor,
  }
}

const client = neon(process.env.DATABASE_URL!)
const db = drizzle({ client, schema })
const users = await getAllUsers(db)
const now = new Date()

console.log({
  action: 'get-users',
  usersCount: users.length,
  today: new Date().toISOString().split('T')[0],
})

for (const user of users) {
  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const allTweets = []
      let nowCursor: string | undefined
      // while (true) {
      const { tweets, cursor } = await fetchTimeline(user.id, nowCursor)
      // if (!tweets.length)
      // break
      allTweets.push(...tweets)
      nowCursor = cursor
      const lastTweet = tweets.at(-1)

      // if (new Date(lastTweet.created_at).getTime() < new Date('2026-03-17').getTime())
      // break
      // }
      console.log({
        userId: user.id,
        username: user.fullName,
        tweetsCount: allTweets.length,
        action: 'fetch-timeline',
        attempt,
      })
      await createTweets({ db, tweets: allTweets, user })
      break
    }
    catch (error) {
      console.error({
        userId: user.id,
        username: user.fullName,
        action: 'fetch-timeline-error',
        attempt,
        error,
      })

      if (attempt === MAX_RETRIES) {
        console.error(`Failed to sync user ${user.fullName} after ${MAX_RETRIES} attempts. Skipping.`)
      }
    }
  }
}

console.log(`Daily update completed successfully.`)

process.exit(0)
