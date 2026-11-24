import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/tweet-types'

import { setTimeout as sleep } from 'node:timers/promises'
import { attachSpaceDetails, AuthError, RateLimitError, RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@chilfish/tweet'
import { createDb, createTweets, createUser, getDailyFetchUsers } from '@tweets-viewer/database'
import { createConcurrencyGate, resolveSyncConcurrency, runBoundedStage } from './lib/concurrency'
import { resolveDatabaseUrl, resolveNeonEndpoint } from './lib/local-config'
import { readTweetKeys, toArchivedTweets } from './lib/tweet'
import './lib/load-env'

const KEYS = readTweetKeys()
const PROXY = process.env.TWEET_PROXY?.trim() || undefined

const CONCURRENCY = resolveSyncConcurrency(KEYS.length)

/**
 * 进程级请求闸门：多库并发更新时共用同一个 Key 池，
 * 没有闸门就会叠成 `库数 × 并发数`，把速率配额一次打满。
 */
const requestGate = createConcurrencyGate(CONCURRENCY)

/** Key 级中止是全局的（所有库共用同一批 Key），命中后所有库都停止派发新用户 */
let globalAbortReason: string | undefined
const SYNC_SINCE = process.env.SYNC_SINCE
  ? new Date(process.env.SYNC_SINCE)
  : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

/** 每个用户最多翻几页；`SYNC_MAX_PAGES=1` 用于本地冒烟。缺省不限制。 */
const ENV_MAX_PAGES = Number(process.env.SYNC_MAX_PAGES)
const MAX_PAGES = Number.isInteger(ENV_MAX_PAGES) && ENV_MAX_PAGES > 0
  ? ENV_MAX_PAGES
  : Number.POSITIVE_INFINITY

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
  return error instanceof Error
    ? error.message
    : String(error)
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

  if (error instanceof AuthError || status === 401 || status === 403)
    return 'all-keys-rejected'
  if (error instanceof RateLimitError || status === 429)
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
    tweets: toArchivedTweets(enrichedTweets),
    cursor: rawTweets.cursor,
  }
}

export interface FetchTweetDailyOptions {
  /**
   * 目标库连接串；缺省取 `process.env.DATABASE_URL`。
   *
   * 多库并发时由入口（`dailyUpdate.ts`）逐个传入：本模块不读全局库状态，
   * 因此多份调用可以安全地同时进行。
   */
  databaseUrl?: string
  /**
   * 日志标识（多库并发时用来区分输出）；缺省 `database`。
   *
   * 只允许放主机名一类的非敏感标识——绝不打印完整连接串（含密码）。
   */
  label?: string
  /** 每个用户最多翻几页；缺省取 `SYNC_MAX_PAGES`，再不设就不限制。 */
  maxPages?: number
  /**
   * 本库的用户级并发数；缺省用进程总预算 `SYNC_CONCURRENCY`。
   *
   * 多库并行时由入口按库数均分，避免总在飞请求变成 `库数 × 预算`。
   */
  concurrency?: number
}

export interface TweetDailyResult {
  /** 目标库标识，与日志里的 `db` 字段一致 */
  label: string
  /** 抓取与入库全部完成且无用户级失败 */
  ok: boolean
  /** 成功抓取的用户数（含「无新推文」的用户） */
  fetchedUsers: number
  /** 抓取失败（重试耗尽）的用户 */
  failedUsers: string[]
  /** 推文入库失败的用户 */
  writeFailedUsers: string[]
  /** key 级中止原因（所有 Key 被拒/耗尽） */
  aborted?: string
}

export async function fetchTweetDaily(options: FetchTweetDailyOptions = {}): Promise<TweetDailyResult> {
  const DATABASE_URL = options.databaseUrl ?? resolveDatabaseUrl()
  const dbLabel = options.label ?? 'database'
  const maxPages = options.maxPages ?? MAX_PAGES
  const concurrency = options.concurrency ?? CONCURRENCY

  const db = createDb({
    url: DATABASE_URL,
    endpoint: resolveNeonEndpoint(DATABASE_URL),
  })
  const users = await getDailyFetchUsers(db)

  console.log({
    db: dbLabel,
    action: 'twitter-pool',
    keysCount: KEYS.length,
    proxy: PROXY ? 'enabled' : 'disabled',
  })

  console.log({
    db: dbLabel,
    action: 'get-users',
    usersCount: users.length,
    today: new Date().toISOString().split('T')[0],
  })

  const failedUsers: string[] = []
  const writeFailedUsers: string[] = []
  let fetchedUsers = 0

  /** 汇总结果：Key 级中止是全局的，任一库命中都记在这里 */
  const report = (): TweetDailyResult => ({
    label: dbLabel,
    ok: !globalAbortReason && failedUsers.length === 0 && writeFailedUsers.length === 0,
    fetchedUsers,
    failedUsers,
    writeFailedUsers,
    aborted: globalAbortReason,
  })

  /** 单个用户：刷新资料 → 抓时间线（带重试）→ 入库。异常都在内部消费成结果 */
  async function updateUser(user: EnrichedUser): Promise<void> {
    const username = user.fullName ?? user.userName ?? user.id

    // ── Phase 0: refresh user profile ──
    // 粉丝数 / bio / 推文总数等每天都在变，不能只留在入库时的那份快照里。
    // 用 restId 定位（改名不影响），整份 EnrichedUser upsert 回 users.jsonData；
    // upsert 只覆盖 restId + jsonData，daily_fetch / ins_* 三列不受影响。
    // 失败不阻断推文抓取——资料是附带产出，推文才是主数据。
    try {
      const freshUser = await requestGate(() => apiClient.fetchUserDetailsRaw(user.id))

      if (freshUser) {
        await createUser({ db, user: freshUser })
        console.log({
          db: dbLabel,
          userId: user.id,
          username: freshUser.userName,
          followersCount: freshUser.followersCount,
          action: 'refresh-user',
        })
      }
      else {
        console.warn({
          db: dbLabel,
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
        db: dbLabel,
        userId: user.id,
        username: user.fullName,
        action: 'refresh-user-error',
        status: getErrorStatus(error),
        message: formatError(error),
        details: getErrorDetails(error),
      })

      if (abortReason) {
        globalAbortReason ??= abortReason
        console.error({
          db: dbLabel,
          action: 'refresh-user-abort',
          reason: abortReason,
          message: formatError(error),
        })
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
        let pages = 0
        do {
          const { tweets, cursor } = await requestGate(() => fetchTimeline(user.id, nowCursor))
          if (!tweets.length)
            break

          allTweets.push(...tweets)
          nowCursor = cursor
          pages++
          const lastTweet = tweets.at(-1)

          // 本地冒烟时限制翻页数；线上默认不限。
          if (pages >= maxPages)
            break
          if (new Date(lastTweet!.created_at).getTime() < SYNC_SINCE.getTime())
            break
        } while (true)

        fetchOk = true
        fetchedUsers++
        console.log({
          db: dbLabel,
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
          db: dbLabel,
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
          globalAbortReason ??= abortReason
          console.error({
            db: dbLabel,
            action: 'fetch-timeline-abort',
            reason: abortReason,
            message: formatError(error),
          })
          return
        }

        if (attempt < MAX_RETRIES)
          await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1))
      }
    }

    if (!fetchOk) {
      failedUsers.push(username)
      console.error(`[${dbLabel}] Failed to fetch @${username} after ${MAX_RETRIES} attempts (last error: ${formatError(lastError)}). Skipping.`)
      return
    }

    if (allTweets.length === 0)
      return

    // ── Phase 2: upsert to DB (no retry — data is deterministic) ──
    try {
      const result = await createTweets({ db, tweets: allTweets, user })
      console.log(`  [${dbLabel}] @${username}: ${result.rowCount} rows affected / ${allTweets.length} total`)
    }

    catch (error: unknown) {
      writeFailedUsers.push(username)
      console.error({
        db: dbLabel,
        userId: user.id,
        username: user.fullName,
        action: 'create-tweets-error',
        code: (error as { code?: string })?.code,
        message: formatError(error),
      })
    }
  }

  // 用户之间并发执行，每个用户内部仍是「资料 → 翻页 → 入库」的串行流程；
  // Key 级中止只停止派发新用户，正在跑的用户会把当前请求做完。
  await runBoundedStage<EnrichedUser>({
    name: `fetch-users-${dbLabel}`,
    items: users,
    key: user => String(user.id),
    concurrency,
    shouldStop: () => globalAbortReason !== undefined,
    // 异常已在 updateUser 内部收成结果，这里不会再抛；
    // 用户级失败由 failedUsers / writeFailedUsers 汇总。
    run: user => updateUser(user),
  })

  // 抓取失败与入库失败都要如实汇报，交给入口决定退出码：
  // 多库并发时其中一个库写失败，job 也必须显红，否则那个库会静默过期。
  const result = report()

  if (!result.ok) {
    console.error({
      db: dbLabel,
      action: 'tweet-daily-incomplete',
      fetchedUsers,
      failedUsers,
      writeFailedUsers,
    })
    return result
  }

  console.log({
    db: dbLabel,
    action: 'tweet-daily-complete',
    fetchedUsers,
  })
  return result
}

// Allow standalone run

const isMain = process.argv[1]?.includes('fetch-tweet-daily')

if (isMain) {
  fetchTweetDaily()
    .then((result) => {
      if (!result.ok)
        process.exitCode = 1
    })
    .catch((err) => {
      console.error('Fatal:', err)

      process.exit(1)
    })
}
