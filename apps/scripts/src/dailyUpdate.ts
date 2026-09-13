/**
 * Daily data update entry point (scheduled by GitHub Actions cron).
 *
 * Runs in order:
 *   1. Twitter tweet fetch + upsert
 *   2. Instagram post fetch + upsert (reads users from ins_users table)
 *
 * 第 2 步目前停用：INSTAGRAM_COOKIES 已过期，13 个用户全部 "User not found"，
 * 而该失败在 fetch-ins-daily 里被吞掉不改变退出码，只会白跑几分钟 + 刷一堆错。
 * 等 cookie 刷新后再放开。
 *
 * Usage:
 *   bun run apps/scripts/src/dailyUpdate.ts
 *
 * Env:
 *   DATABASE_URL          Neon Postgres
 *   TWEET_KEYS            Twitter API Keys (comma-separated)
 *   TWEET_PROXY           代理地址（可选，X 拒绝数据中心 IP 时用）
 *   INSTAGRAM_COOKIES     Instagram login Cookie
 */

// ═══ Instagram Daily Update ═══
// import { fetchInsDaily } from './fetch-ins-daily'
// ═══ Twitter Daily Update ═══
import { fetchTweetDaily } from './fetch-tweet-daily'

import 'dotenv'

// ═══ Main ═══
async function main(): Promise<void> {
  console.log('=== Daily Update Start ===\n')

  await fetchTweetDaily()
  // await fetchInsDaily()

  console.log('\n=== Daily Update Complete ===')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
