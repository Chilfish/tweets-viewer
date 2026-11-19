/**
 * Daily data update entry point (scheduled by GitHub Actions cron).
 *
 * Runs in order:
 *   1. Twitter tweet fetch + upsert
 *   2. Instagram post fetch + upsert（账号名单来自 users.ins_username）
 *
 * IG 步骤只在配置了 `INSTAGRAM_COOKIES` 时执行；抓取失败的账号计入结果并让
 * 目标库显红，不会「什么都没做」却报成功。
 *
 * `DATABASE_URL` 支持逗号分隔多地址（`url1,url2`）：每个地址是一个独立归档库，
 * 各有自己的 `daily_fetch` 用户集，因此按地址**并发**各跑一轮完整更新；
 * 任一库失败都让进程以非 0 退出（定时任务显红），但不影响其他库继续更新。
 * 注意：每个库各自抓一遍 Twitter，请求量随库数线性增长（共享同一个 Key 池）。
 *
 * Usage:
 *   bun run apps/scripts/src/dailyUpdate.ts
 *
 * Env:
 *   DATABASE_URL          Neon Postgres（逗号分隔 = 多库并发更新）
 *   TWEET_KEYS            Twitter API Keys (comma-separated)
 *   TWEET_PROXY           代理地址（可选，X 拒绝数据中心 IP 时用）
 *   INSTAGRAM_COOKIES     Instagram login Cookie（缺省时跳过 IG 步骤）
 */

import type { TweetDailyResult } from './fetch-tweet-daily'
import { createDb } from '@tweets-viewer/database'
import { parseDatabaseUrls } from '@tweets-viewer/shared'
import { createLogger } from './cli/logger'
// ═══ Twitter Daily Update ═══
import { fetchTweetDaily } from './fetch-tweet-daily'
// ═══ Instagram Daily Update ═══
import { syncInsAccounts } from './lib/ins-sync'
import { resolveNeonEndpoint } from './lib/local-config'
import 'dotenv'

export interface DailyResult extends TweetDailyResult {
  /** 抓取失败的 IG 账号（IG 步骤被跳过时为空） */
  insFailedUsers: string[]
}

/** 目标库地址（`DATABASE_URL` 逗号分隔，已去重）；空 = 配置错误，直接失败 */
const DATABASE_URLS = parseDatabaseUrls(process.env.DATABASE_URL)

/**
 * 目标库的可读标识：主机名首段 + 序号（`ep-old-haze-a1b2c3.us-east-2.aws.neon.tech` → `1.ep-old-haze-a1b2c3`）。
 *
 * 只取主机名，绝不打印完整连接串（含密码）。
 */
function databaseLabel(url: string, index: number): string {
  try {
    const { hostname } = new URL(url)
    return `${index + 1}.${hostname.split('.')[0] || hostname}`
  }
  catch {
    return `${index + 1}.invalid-url`
  }
}

/** 对单个归档库跑一轮完整更新：Twitter，然后 IG（有 Cookie 时）。 */
async function updateTarget(databaseUrl: string, label: string): Promise<DailyResult> {
  console.log(`\n───── [${label}] daily update start ─────`)

  const tweetResult = await fetchTweetDaily({ databaseUrl, label })

  const insFailedUsers: string[] = []
  if (process.env.INSTAGRAM_COOKIES?.trim()) {
    try {
      const db = createDb({
        url: databaseUrl,
        endpoint: resolveNeonEndpoint(databaseUrl),
      })
      const result = await syncInsAccounts(db, {
        log: createLogger({ name: `ig.${label}` }),
      })
      insFailedUsers.push(...result.failures.map(failure => failure.account))
      console.log({
        db: label,
        action: 'ins-sync-done',
        accounts: result.accounts,
        imported: result.imported,
        posts: result.posts,
        failedAccounts: insFailedUsers.length,
      })
    }
    catch (error) {
      // IG 步骤整轮失败（Cookie 失效、SDK 异常）：记到目标库头上，让 cron 显红。
      insFailedUsers.push('*')
      console.error({
        db: label,
        action: 'ins-sync-error',
        message: error instanceof Error
          ? error.message
          : String(error),
      })
    }
  }
  else {
    console.log({ db: label, action: 'ins-sync-skipped', reason: 'INSTAGRAM_COOKIES not set' })
  }

  return {
    ...tweetResult,
    ok: tweetResult.ok && insFailedUsers.length === 0,
    insFailedUsers,
  }
}

// ═══ Main ═══
async function main(): Promise<void> {
  if (!DATABASE_URLS.length) {
    // 配置错误必须显红：没有任何目标可更新时静默退出 0 会让断更伪装成成功
    console.error('DATABASE_URL is required — nothing to update')
    process.exitCode = 1
    return
  }

  const targets = DATABASE_URLS.map((url, index) => ({
    url,
    label: databaseLabel(url, index),
  }))

  console.log(`=== Daily Update Start (${targets.length} target(s): ${targets.map(t => t.label).join(', ')}) ===`)

  // 各库之间没有依赖关系，并发执行；单个库失败不影响其他库
  const settled = await Promise.allSettled(
    targets.map(target => updateTarget(target.url, target.label)),
  )

  const failed: string[] = []

  settled.forEach((outcome, index) => {
    const { label } = targets[index]!

    if (outcome.status === 'rejected') {
      failed.push(label)
      console.error({
        db: label,
        action: 'daily-update-target-error',
        message: outcome.reason instanceof Error
          ? outcome.reason.message
          : String(outcome.reason),
      })
      return
    }

    const { ok, fetchedUsers, failedUsers, writeFailedUsers, aborted, insFailedUsers } = outcome.value

    console.log({
      db: label,
      action: 'daily-update-target-done',
      ok,
      fetchedUsers,
      failedUsers: failedUsers.length,
      writeFailedUsers: writeFailedUsers.length,
      insFailedUsers: insFailedUsers.length,
      aborted,
    })

    if (!ok)
      failed.push(label)
  })

  if (failed.length) {
    process.exitCode = 1
    console.error(`\n=== Daily Update Incomplete — ${failed.length}/${targets.length} target(s) failed: ${failed.join(', ')} ===`)
    return
  }

  console.log(`\n=== Daily Update Complete (${targets.length} target(s)) ===`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
