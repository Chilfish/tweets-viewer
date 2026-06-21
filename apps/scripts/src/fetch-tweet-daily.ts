import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { neon } from '@neondatabase/serverless'
import { createTweets, getAllUsers, schema } from '@tweets-viewer/database'
import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { drizzle } from 'drizzle-orm/neon-http'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())
const SYNC_SINCE = process.env.SYNC_SINCE
  ? new Date(process.env.SYNC_SINCE)
  : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
const twitterPool = new RettiwtPool(KEYS)

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

async function fetchTimeline(userId: string, cursor?: string) {
  try {
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
  catch (error) {
    console.error({
      userId,
      cursor,
      message: 'Error fetching timeline',
      action: 'fetch-timeline-error',
      error,
    })
    return {
      tweets: [],
      cursor: '',
    }
  }
}

export async function fetchTweetDaily(): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required — skipping Twitter fetch')
    return
  }

  const client = neon(DATABASE_URL)
  const db = drizzle({ client, schema })
  const users = await getAllUsers(db)

  console.log({
    action: 'get-users',
    usersCount: users.length,
    today: new Date().toISOString().split('T')[0],
  })

  for (const user of users) {
    const MAX_RETRIES = 3

    // ── Phase 1: fetch timeline with retry ──
    const allTweets: EnrichedTweet[] = []
    let fetchOk = false
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        let nowCursor: string | undefined
        do {
          const { tweets, cursor } = await fetchTimeline(user.id, nowCursor)
          if (!tweets.length)
            break

          allTweets.push(...tweets)
          nowCursor = cursor
          const lastTweet = tweets.at(-1)

          if (new Date(lastTweet!.created_at).getTime() < SYNC_SINCE.getTime())
            break
        } while (true)

        fetchOk = true
        console.log({
          userId: user.id,
          username: user.fullName,
          tweetsCount: allTweets.length,
          action: 'fetch-timeline',
          attempt,
        })
        break
      }

      catch (error: any) {
        console.error({
          userId: user.id,
          username: user.fullName,
          action: 'fetch-timeline-error',
          attempt,
          error: error.message ?? error,
        })

        if (attempt === MAX_RETRIES) {
          console.error(`Failed to fetch @${user.fullName} after ${MAX_RETRIES} attempts. Skipping.`)
        }
      }
    }

    if (!fetchOk || allTweets.length === 0)
      continue
    // ── Phase 2: upsert to DB (no retry — data is deterministic) ──

    try {
      const result = await createTweets({ db, tweets: allTweets, user })
      console.log(`  @${user.fullName}: ${result.rowCount} rows affected / ${allTweets.length} total`)
    }

    catch (error: any) {
      console.error({
        userId: user.id,
        username: user.fullName,
        action: 'create-tweets-error',
        code: error?.code,
        message: error?.message,
      })
    }
  }

  console.log('Tweet daily fetch complete.')
}

// Allow standalone run

const isMain = process.argv[1]?.includes('fetch-tweet-daily')

if (isMain) {
  fetchTweetDaily().catch((err) => {
    console.error('Fatal:', err)

    process.exit(1)
  })
}
