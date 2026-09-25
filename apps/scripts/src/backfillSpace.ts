/**
 * 回填既有推文的 `space` 字段（X Space 卡片数据）。
 *
 * 背景：`space` 是后加字段，改动前入库的推文 `jsonData` 里没有它；命中 DB 的读路径不会再打上游，
 * 于是老推文的 Space 卡片永远不出现（正文只剩一个裸链接）。缓存不保留原始 `card`，但 Space 链接
 * 始终在实体的 `href` 里，故用 `resolveSpaceId(null, entities)` 即可覆盖「带卡片」与「无卡片」两种推文。
 *
 * 安全约束：
 * - **只更新 `jsonData`**（不动 `userId` / `fullText` / `createdAt` 等结构化列），避免连带改写
 * - 只处理「含 Space 链接且缺 `space`/缺 `availability`」的推文
 * - **默认 dry-run**，确认无误后加 `--write` 才落库
 *
 * 用法: bun src/backfillSpace.ts [--write] [--limit=N]
 */
import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { neon } from '@neondatabase/serverless'
import { schema } from '@tweets-viewer/database'
import { mapSpaceDetails, resolveSpaceId, RettiwtPool, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../../../env.server'

const { tweetsTable } = schema

const KEYS = (env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())
const PROXY = process.env.TWEET_PROXY?.trim() || undefined

const WRITE = process.argv.includes('--write')
const LIMIT = (() => {
  const arg = process.argv.find(a => a.startsWith('--limit='))
  const n = arg ? Number(arg.split('=')[1]) : Number.NaN
  return Number.isFinite(n) && n > 0 ? n : undefined
})()

const client = neon(env.DATABASE_URL)
const db = drizzle({ client, schema })
const apiClient = new TwitterAPIClient(new RettiwtPool(KEYS, { proxy: PROXY }))

/** 含 Space 链接、但 `space` 缺失或为旧结构（缺 `availability`）的推文 */
const candidates = await db
  .select({ tweetId: tweetsTable.tweetId, jsonData: tweetsTable.jsonData })
  .from(tweetsTable)
  .where(sql`${tweetsTable.jsonData}::text LIKE '%/i/spaces/%'
    AND (${tweetsTable.jsonData}->'space' IS NULL
      OR ${tweetsTable.jsonData}->'space'->>'availability' IS NULL)`)
  .limit(LIMIT ?? 10_000)

console.log({
  action: 'backfill-space-candidates',
  mode: WRITE ? 'write' : 'dry-run',
  candidates: candidates.length,
})

// 同一 Space 只打一次上游（历史推文常多条指向同一场次）
const cache = new Map<string, Awaited<ReturnType<typeof apiClient.fetchSpaceDetails>>>()

let patched = 0
let skipped = 0

for (const row of candidates) {
  const tweet = row.jsonData as EnrichedTweet
  const spaceId = resolveSpaceId(null, tweet.entities)
  if (!spaceId) {
    skipped++
    continue
  }

  try {
    if (!cache.has(spaceId)) {
      cache.set(spaceId, await apiClient.fetchSpaceDetails(spaceId))
    }

    const space = mapSpaceDetails(spaceId, cache.get(spaceId), tweet.user)
    if (!space) {
      skipped++
      continue
    }

    console.log({
      action: WRITE ? 'backfill-space-write' : 'backfill-space-plan',
      tweetId: row.tweetId,
      spaceId,
      availability: space.availability,
      title: space.title.slice(0, 40),
    })

    if (WRITE) {
      // 只改 jsonData：结构化列（userId / fullText / createdAt）保持原样
      await db
        .update(tweetsTable)
        .set({ jsonData: { ...tweet, space } })
        .where(eq(tweetsTable.tweetId, row.tweetId))
    }
    patched++
  }
  catch (error) {
    // 限流 / 网络失败不得写入：跳过并保留原文（下次重跑再来）
    skipped++
    console.warn({
      action: 'backfill-space-error',
      tweetId: row.tweetId,
      spaceId,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

console.log({
  action: 'backfill-space-done',
  mode: WRITE ? 'write' : 'dry-run',
  patched,
  skipped,
  uniqueSpaces: cache.size,
})
