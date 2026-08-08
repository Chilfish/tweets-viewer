/**
 * 福冈公演 交叉搜索脚本
 *
 * 用法: bun src/fukuoka/fetch.ts <target> [maxPages]
 *   target: official | members | audience | media | all
 *
 * 搜索结果缓存在 cache/fukuoka/raw/<target>-<timestamp>.json
 * （与日常归档 cache/data/ 分离，本次分析专属）
 */
import type { ITweetFilter } from '@tweets-viewer/rettiwt-api'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { formatDate } from '@tweets-viewer/shared'
import { apiClient, enrichmentService } from '../common'
import { cacheDir, writeJson } from '../utils'
import { MEMBERS, OFFICIAL } from './members'

const COUNT = 20
const RAW_DIR = path.join(cacheDir, 'fukuoka/raw')
await mkdir(RAW_DIR, { recursive: true })

interface SearchTarget {
  name: string
  label: string
  filter: ITweetFilter
  maxPages: number
}

function buildTargets(): Record<string, SearchTarget> {
  const memberUsers = MEMBERS.map(m => m.userName)

  return {
    official: {
      name: 'official',
      label: '官方 @BDP_yumemita（tag，公演周）',
      filter: {
        fromUsers: [OFFICIAL.userName],
        includeWords: ['#ゆめみた47_福岡'],
        startDate: new Date('2026-05-22T00:00:00+09:00'),
        endDate: new Date('2026-06-02T00:00:00+09:00'),
      },
      maxPages: 3,
    },
    members: {
      name: 'members',
      label: `5位成员公演周提及福岡（${memberUsers.join(', ')}）`,
      filter: {
        fromUsers: memberUsers,
        includeWords: ['福岡'],
        startDate: new Date('2026-05-28T00:00:00+09:00'),
        endDate: new Date('2026-06-02T00:00:00+09:00'),
      },
      maxPages: 5,
    },
    audience: {
      name: 'audience',
      label: '观众现场（tag，公演前后一周）',
      filter: {
        includeWords: ['#ゆめみた47_福岡'],
        minLikes: 3,
        startDate: new Date('2026-05-25T00:00:00+09:00'),
        endDate: new Date('2026-06-07T00:00:00+09:00'),
      },
      maxPages: 15,
    },
    media: {
      name: 'media',
      label: '报道/传播（夢限大みゅーたいぷ + 福岡公演）',
      filter: {
        includeWords: ['夢限大みゅーたいぷ', '福岡公演'],
        minLikes: 20,
        onlyOriginal: true,
      },
      maxPages: 10,
    },
  }
}

async function fetchTarget(target: SearchTarget): Promise<number> {
  console.log(`\n=== ${target.label} ===`)
  const allTweets: any[] = []
  let currentCursor = ''
  let page = 0

  while (page < target.maxPages) {
    page++
    console.log(`  page ${page}${currentCursor ? ` (cursor: ${currentCursor.slice(0, 16)}…)` : ''}`)

    const data = await apiClient.searchTweetsRaw(target.filter, currentCursor, COUNT).catch((e) => {
      if (e.message?.includes('429')) {
        console.error('Rate limit exceeded')
        process.exit(129)
      }
      if (e.message?.includes('status code 404')) {
        console.error('No tweets found')
        return { tweets: [], cursor: '' }
      }
      console.error({ target: target.name, page, error: e.message })
      return { tweets: [], cursor: '' }
    })

    if (!data.tweets.length) {
      console.log(`  No more tweets at page ${page}, stopping.`)
      break
    }

    const enriched = enrichmentService.enrichTweets(data.tweets)
    allTweets.push(...enriched)

    console.log({
      page,
      tweetsThisPage: data.tweets.length,
      totalSoFar: allTweets.length,
      lastTweetDate: enriched.at(-1)?.created_at
        ? formatDate(enriched.at(-1)!.created_at)
        : 'N/A',
    })

    if (!data.cursor || !data.cursor.trim()) {
      console.log('  No cursor, reached the end.')
      break
    }

    currentCursor = data.cursor
  }

  console.log(`  → ${target.name}: ${allTweets.length} tweets total`)

  if (allTweets.length > 0) {
    const authors: Record<string, number> = {}
    for (const t of allTweets)
      authors[t.user?.screen_name ?? '?'] = (authors[t.user?.screen_name ?? '?'] ?? 0) + 1
    console.log(`  authors: ${JSON.stringify(authors)}`)

    await writeJson(
      { target: target.name, label: target.label, fetchedAt: new Date().toISOString(), tweets: allTweets, total: allTweets.length },
      `fukuoka/raw/${target.name}-${Date.now()}.json`,
    )
  }

  return allTweets.length
}

async function main() {
  const argTarget = process.argv[2] ?? 'all'
  const maxPagesArg = Number(process.argv[3])
  const targets = buildTargets()

  if (argTarget !== 'all' && !targets[argTarget]) {
    console.error(`Unknown target: ${argTarget}. Available: ${Object.keys(targets).join(', ')}`)
    process.exit(1)
  }

  const selected = argTarget === 'all'
    ? Object.values(targets)
    : [targets[argTarget]]

  for (const target of selected) {
    if (!Number.isNaN(maxPagesArg))
      target.maxPages = maxPagesArg
    await fetchTarget(target)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
