/**
 * Daily data update entry point (scheduled by GitHub Actions cron).
 *
 * Runs in order:
 *   1. Twitter tweet fetch + upsert
 *   2. Instagram post fetch + upsert (reads users from ins_users table)
 *
 * Usage:
 *   bun run apps/scripts/src/dailyUpdate.ts
 *
 * Env:
 *   DATABASE_URL          Neon Postgres
 *   TWEET_KEYS            Twitter API Keys (comma-separated)
 *   INSTAGRAM_COOKIES     Instagram login Cookie
 */

// ═══ Instagram Daily Update ═══
import { fetchInsDaily } from './fetch-ins-daily'

import 'dotenv'

// ═══ Twitter Daily Update ═══
// TODO: integrate existing Twitter fetch logic here

async function fetchTwitterDaily(): Promise<void> {
  console.log('Twitter daily fetch — (not yet integrated, skipping)')
}

// ═══ Main ═══
async function main(): Promise<void> {
  console.log('=== Daily Update Start ===\n')

  await fetchTwitterDaily()
  await fetchInsDaily()

  console.log('\n=== Daily Update Complete ===')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
