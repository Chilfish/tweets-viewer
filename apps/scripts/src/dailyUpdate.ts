import { neon } from '@neondatabase/serverless'
import { createTweets, getAllUsers, schema } from '@tweets-viewer/database'
import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'

import { drizzle } from 'drizzle-orm/neon-http'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())
const twitterPool = new RettiwtPool(KEYS)

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

async function fetchTimeline(userId: string) {
  const rawTweets = await apiClient.fetchUserTimelineWithRepliesRaw(userId)
  if (!rawTweets.tweets.length) {
    console.error({
      userId,
      message: 'No tweets found',
      action: 'fetch-timeline',
    })
    return []
  }

  const enrichedTweets = enrichmentService.enrichUserTimelineTweets(rawTweets.tweets, userId)

  return enrichedTweets
}

const client = neon(process.env.DATABASE_URL!)
const db = drizzle({ client, schema })
const users = await getAllUsers(db)

console.log({
  action: 'get-users',
  usersCount: users.length,
  today: new Date().toISOString().split('T')[0],
})

for (const user of users) {
  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const tweets = await fetchTimeline(user.id)
      console.log({
        userId: user.id,
        username: user.fullName,
        tweetsCount: tweets.length,
        action: 'fetch-timeline',
        attempt,
      })
      await createTweets({ db, tweets, user })
      break
    }
    catch (error) {
      console.error({
        userId: user.id,
        username: user.fullName,
        action: 'fetch-timeline-error',
        attempt,
        error: error instanceof Error ? error.message : error,
      })

      if (attempt === MAX_RETRIES) {
        console.error(`Failed to sync user ${user.fullName} after ${MAX_RETRIES} attempts. Skipping.`)
      }
    }
  }
}
