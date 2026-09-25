import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { setTimeout as sleep } from 'node:timers/promises'
import { neon } from '@neondatabase/serverless'
import { createTweets, createUser, getDailyFetchUsers, schema } from '@tweets-viewer/database'
import { attachSpaceDetails, RettiwtAuthError, RettiwtPool, RettiwtRateLimitError, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { drizzle } from 'drizzle-orm/neon-http'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())
const PROXY = process.env.TWEET_PROXY?.trim() || undefined
const SYNC_SINCE = process.env.SYNC_SINCE
  ? new Date(process.env.SYNC_SINCE)
  : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
const twitterPool = new RettiwtPool(KEYS, { proxy: PROXY })

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

/** 取出 X 返回的错误明细（错误码/消息）；类型化错误把原始 TwitterError 挂在 cause 上 */
function getErrorDetails(error: unknown): unknown {
  const own = (error as { details?: unknown })?.details
  return own ?? (error as { cause?: { details?: unknown } })?.cause?.details
}

/**
 * Key 级失败判定：401/403（所有 Key 被拒）或 429（全部耗尽）。
 *
 * 这类失败换用户重试也是同样的结果，一次就要中止整轮抓取。
 */
function getAbortReason(error: unknown): string | undefined {
  const status = getErrorStatus(error)

  if (error instanceof RettiwtAuthError || status === 401 || status === 403)
    return 'all-keys-rejected'
  if (error instanceof RettiwtRateLimitError || status === 429)
    return 'rate-limit-exhausted'
  return undefined
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

  // Space 推文的外壳 card 拿不到标题/主播/人数，需再打一次 AudioSpaceById 挂到 space 字段
  await attachSpaceDetails(enrichedTweets, rawTweets.tweets, id => apiClient.fetchSpaceDetails(id))

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
    action: 'twitter-pool',
    keysCount: KEYS.length,
    proxy: PROXY ? 'enabled' : 'disabled',
  })

  console.log({
    action: 'get-users',
    usersCount: users.length,
    today: new Date().toISOString().split('T')[0],
  })

  const failedUsers: string[] = []

  for (const user of users) {
    // ── Phase 0: refresh user profile ──
    // 粉丝数 / bio / 推文总数等每天都在变，不能只留在入库时的那份快照里。
    // 用 restId 定位（改名不影响），整份 EnrichedUser upsert 回 users.jsonData；
    // upsert 只覆盖 restId + jsonData，daily_fetch / ins_* 三列不受影响。
    // 失败不阻断推文抓取——资料是附带产出，推文才是主数据。
    try {
      const freshUser = await apiClient.fetchUserDetailsRaw(user.id)

      if (freshUser) {
        await createUser({ db, user: freshUser })
        console.log({
          userId: user.id,
          username: freshUser.userName,
          followersCount: freshUser.followersCount,
          action: 'refresh-user',
        })
      }
      else {
        console.warn({
          userId: user.id,
          username: user.fullName,
          action: 'refresh-user-empty',
          message: 'User details returned empty, keeping stored profile',
        })
      }
    }

    catch (error: unknown) {
      const abortReason = getAbortReason(error)

      console.error({
        userId: user.id,
        username: user.fullName,
        action: 'refresh-user-error',
        status: getErrorStatus(error),
        message: formatError(error),
        details: getErrorDetails(error),
      })

      if (abortReason) {
        console.error({
          action: 'refresh-user-abort',
          reason: abortReason,
          message: formatError(error),
        })
        process.exitCode = 1
        return
      }
    }

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
          details: getErrorDetails(error),
        })

        // key 级失败：一轮之内所有 Key 都被拒（401/403）或耗尽（429）。
        // 再按用户重试只会把同一个失败重复 18 遍，直接中止本轮抓取。
        const abortReason = getAbortReason(error)

        if (abortReason) {
          console.error({
            action: 'fetch-timeline-abort',
            reason: abortReason,
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
