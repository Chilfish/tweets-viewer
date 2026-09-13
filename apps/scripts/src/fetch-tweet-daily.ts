import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { setTimeout as sleep } from 'node:timers/promises'
import { neon } from '@neondatabase/serverless'
import { createTweets, getDailyFetchUsers, schema } from '@tweets-viewer/database'
import { RettiwtPool, RettiwtRateLimitError, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { drizzle } from 'drizzle-orm/neon-http'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())
const SYNC_SINCE = process.env.SYNC_SINCE
  ? new Date(process.env.SYNC_SINCE)
  : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
const twitterPool = new RettiwtPool(KEYS)

const MAX_RETRIES = 5
const BACKOFF_BASE_MS = 1000

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

/** 从 Axios / TwitterError / 自定义错误中提取 HTTP 状态码 */
function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object')
    return undefined

  const { status, statusCode, response } = error as {
    status?: number
    statusCode?: number
    response?: { status?: number }
  }
  return response?.status ?? status ?? statusCode
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * 拉取单个用户的完整时间线。
 *
 * 失败时直接抛出，交由调用方决定重试或中止——这里绝不能吞掉错误，
 * 否则「请求失败」会被误判成「无数据」，静默写入 0 条并让定时任务假成功。
 */
async function fetchTimeline(userId: string, cursor?: string) {
  const rawTweets = await apiClient.fetchUserTimelineWithRepliesRaw(userId, cursor)
  if (!rawTweets.tweets.length) {
    console.log({
      userId,
      action: 'fetch-timeline-empty',
      message: 'No tweets in timeline',
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

export async function fetchTweetDaily(): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required — skipping Twitter fetch')
    return
  }

  const client = neon(DATABASE_URL)
  const db = drizzle({ client, schema })
  const users = await getDailyFetchUsers(db)

  console.log({
    action: 'get-users',
    usersCount: users.length,
    today: new Date().toISOString().split('T')[0],
  })

  const failedUsers: string[] = []

  for (const user of users) {
    // ── Phase 1: fetch timeline with retry ──
    let allTweets: EnrichedTweet[] = []
    let fetchOk = false
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // 每次重试都从首页重新拉取，避免半截数据在重试时叠加成重复
      allTweets = []
      lastError = undefined

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

      catch (error: unknown) {
        lastError = error
        console.error({
          userId: user.id,
          username: user.fullName,
          action: 'fetch-timeline-error',
          attempt,
          status: getErrorStatus(error),
          message: formatError(error),
        })

        // 所有 Key 都因 429 耗尽：继续重试只会把限流打得更死，直接中止本轮抓取
        if (error instanceof RettiwtRateLimitError || getErrorStatus(error) === 429) {
          console.error({
            action: 'fetch-timeline-abort',
            reason: 'rate-limit-exhausted',
            message: formatError(error),
          })
          process.exitCode = 1
          return
        }

        if (attempt < MAX_RETRIES)
          await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1))
      }
    }

    if (!fetchOk) {
      failedUsers.push(user.fullName ?? user.userName ?? user.id)
      console.error(`Failed to fetch @${user.fullName} after ${MAX_RETRIES} attempts (last error: ${formatError(lastError)}). Skipping.`)
      continue
    }

    if (allTweets.length === 0)
      continue
    // ── Phase 2: upsert to DB (no retry — data is deterministic) ──

    try {
      const result = await createTweets({ db, tweets: allTweets, user })
      console.log(`  @${user.fullName}: ${result.rowCount} rows affected / ${allTweets.length} total`)
    }

    catch (error: unknown) {
      console.error({
        userId: user.id,
        username: user.fullName,
        action: 'create-tweets-error',
        code: (error as { code?: string })?.code,
        message: formatError(error),
      })
    }
  }

  // 有用户抓取失败时让进程以非 0 退出，定时任务才会显红而不是静默「成功」
  if (failedUsers.length > 0) {
    process.exitCode = 1
    console.error(`Tweet daily fetch incomplete — ${failedUsers.length} user(s) failed: ${failedUsers.join(', ')}`)
    return
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
