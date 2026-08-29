/**
 * 从数据库按 username 列表 + 时间范围导出推文，聚合到一个 JSON 文件。
 *
 * 用法（在 apps/scripts 目录下）：
 *   bun src/exportTweets.ts --from 2023-01-01 --to 2023-12-31 userA userB ...
 *
 * 参数：
 *   --from <date>   起始日期（含），如 2023-01-01
 *   --to   <date>   结束日期（含），如 2023-12-31
 *   其余位置参数 为 twitter username 列表（= users.userName）
 *
 * 未传 username 时回退到 DEFAULT_USERNAMES；未传日期时回退到 DEFAULT_FROM / DEFAULT_TO。
 * 输出：cache/export/<from>-<to>.json —— 一个扁平 EnrichedTweet[] 数组，
 *       可直接喂给 downloadMedias.ts / insertToDB.ts（merged.json 同格式）。
 */
import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { getTweetsByDateRange, schema } from '@tweets-viewer/database'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../../../env.server'
import { cacheDir, writeJson } from './utils'

/** 未显式传 username 时使用的默认列表 */
const DEFAULT_USERNAMES: string[] = [
  'BDP_yumemita',
  'arale_yumemita',
  'miyako_yumemita',
  'nonoka_yumemita',
  'ritsu_yumemita',
  'yuno_yumemita',
]

/** 默认时间范围（含） */
const DEFAULT_FROM = '2026-07-20'
const DEFAULT_TO = '2026-08-30'

const PAGE_SIZE = 1000

interface CliArgs {
  from: string
  to: string
  usernames: string[]
}

function parseArgs(argv: string[]): CliArgs {
  let from = DEFAULT_FROM
  let to = DEFAULT_TO
  const usernames: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--from')
      from = argv[++i] ?? from
    else if (arg === '--to')
      to = argv[++i] ?? to
    else if (arg.startsWith('--'))
      throw new Error(`Unknown option: ${arg}`)
    else
      usernames.push(arg)
  }

  return {
    from,
    to,
    usernames: usernames.length > 0 ? usernames : DEFAULT_USERNAMES,
  }
}

/**
 * 用 keyset 游标翻页拉取某一用户在时间范围内的全部推文。
 */
async function fetchUserTweets(db: ReturnType<typeof drizzle<typeof schema>>, name: string, from: Date, to: Date): Promise<EnrichedTweet[]> {
  const all: EnrichedTweet[] = []
  let cursor: string | undefined

  do {
    const { data, meta } = await getTweetsByDateRange({
      db,
      name,
      startDate: from,
      endDate: to,
      page: 1,
      pageSize: PAGE_SIZE,
      reverse: false,
      cursor,
    })

    all.push(...data)
    cursor = meta.hasMore ? meta.nextCursor : undefined
  } while (cursor)

  return all
}

export async function exportTweets(argv: string[]): Promise<void> {
  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const { from, to, usernames } = parseArgs(argv)
  const fromDate = new Date(from)
  const toDate = new Date(to)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    console.error(`Invalid date range: ${from} → ${to}`)
    process.exit(1)
  }

  const client = neon(env.DATABASE_URL)
  const db = drizzle({ client, schema })

  // 聚合为一个扁平 EnrichedTweet[] —— 与 downloadMedias / insertToDB 的 merged.json 输入格式一致，
  // 可直接复用（推文本身含 tweet.user.screen_name 可区分用户）。
  const allTweets: EnrichedTweet[] = []

  for (const name of usernames) {
    const tweets = await fetchUserTweets(db, name, fromDate, toDate)
    allTweets.push(...tweets)
    console.log(`  @${name}: ${tweets.length} tweets`)
  }

  const outPath = `export/${from}-${to}.json`
  await mkdir(path.join(cacheDir, 'export'), { recursive: true })
  await writeJson(allTweets, outPath)

  console.log(`Export complete: ${allTweets.length} tweets from ${usernames.length} users`)
  console.log('Saved to:', outPath)
}

// Allow standalone run
const isMain = process.argv[1]?.includes('exportTweets')

if (isMain) {
  exportTweets(process.argv.slice(2)).catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
}
