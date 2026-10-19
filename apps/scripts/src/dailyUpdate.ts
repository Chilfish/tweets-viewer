/**
 * Daily data update entry point (scheduled by GitHub Actions cron).
 *
 * Runs in order:
 *   1. Twitter tweet fetch + upsert
 *   2. Instagram post fetch + upsert (reads users from users table)
 *
 * 第 2 步目前停用：INSTAGRAM_COOKIES 已过期，13 个用户全部 "User not found"，
 * 而该失败在 fetch-ins-daily 里被吞掉不改变退出码，只会白跑几分钟 + 刷一堆错。
 * 等 cookie 刷新后再放开。
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
 *   INSTAGRAM_COOKIES     Instagram login Cookie
 */

import type { TweetDailyResult } from './fetch-tweet-daily'
import { parseDatabaseUrls } from '@tweets-viewer/shared'
// ═══ Instagram Daily Update ═══
// import { fetchInsDaily } from './fetch-ins-daily'
// ═══ Twitter Daily Update ═══
import { fetchTweetDaily } from './fetch-tweet-daily'
import 'dotenv'

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

/** 对单个归档库跑一轮完整更新（Twitter；IG 恢复后同样在此传参） */
async function updateTarget(databaseUrl: string, label: string): Promise<TweetDailyResult> {
  console.log(`\n───── [${label}] daily update start ─────`)

  const result = await fetchTweetDaily({ databaseUrl, label })
  // await fetchInsDaily({ databaseUrl, label })

  return result
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
        message: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
      })
      return
    }

    const { ok, fetchedUsers, failedUsers, writeFailedUsers, aborted } = outcome.value

    console.log({
      db: label,
      action: 'daily-update-target-done',
      ok,
      fetchedUsers,
      failedUsers: failedUsers.length,
      writeFailedUsers: writeFailedUsers.length,
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
