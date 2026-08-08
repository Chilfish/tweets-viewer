/**
 * 福冈公演 交叉数据简化/合并脚本
 *
 * 读取 cache/fukuoka/raw/*.json，合并所有推文，按 id 去重，
 * 精简为只保留关注字段的结构，输出 cache/fukuoka/tweets.simplified.json
 */
import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { cacheDir, readJson, writeJson } from '../utils'
import { findByUserName, OFFICIAL } from './members'

const RAW_DIR = path.join(cacheDir, 'fukuoka/raw')
const OUT_FILE = path.join(cacheDir, 'fukuoka/tweets.simplified.json')

interface SimplifiedTweet {
  id: string
  url: string
  jst: string
  author: string
  authorName: string
  authorRole: string
  source: 'official' | 'member' | 'audience'
  text: string
  hashtags: string[]
  links: string[]
  media: string[]
  stats: {
    likes: number
    retweets: number
    replies: number
    views: number
  }
}

function toJst(createdAt: string): string {
  const d = new Date(new Date(createdAt).getTime() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

function simplify(t: EnrichedTweet & { [k: string]: any }): SimplifiedTweet {
  const screenName = t.user?.screen_name ?? '?'
  const account = findByUserName(screenName)
  const source: SimplifiedTweet['source'] = screenName === OFFICIAL.userName
    ? 'official'
    : (account ? 'member' : 'audience')

  const hashtags: string[] = []
  const links: string[] = []
  for (const e of t.entities ?? []) {
    if (e.type === 'hashtag')
      hashtags.push(e.text)
    else if (e.type === 'url' && e.expanded_url)
      links.push(e.expanded_url)
  }

  const media = (t.media_details ?? []).map((m: any) => m.type ?? 'photo')

  return {
    id: t.id,
    url: t.url,
    jst: toJst(t.created_at),
    author: screenName,
    authorName: account?.name ?? t.user?.name ?? screenName,
    authorRole: account?.role ?? '—',
    source,
    text: t.text,
    hashtags: Array.from(new Set(hashtags)),
    links: Array.from(new Set(links)),
    media,
    stats: {
      likes: t.like_count ?? 0,
      retweets: t.retweet_count ?? 0,
      replies: t.reply_count ?? 0,
      views: t.view_count ?? 0,
    },
  }
}

async function main() {
  const files = (await readdir(RAW_DIR)).filter(f => f.endsWith('.json'))
  if (!files.length) {
    console.error('No raw data found in', RAW_DIR)
    process.exit(1)
  }

  const all: EnrichedTweet[] = (await Promise.all(
    files.map(f => readJson<{ tweets: EnrichedTweet[] }>(path.join('fukuoka/raw', f))),
  ))
    .flatMap(data => data.tweets ?? [])
    .filter(Boolean)

  const byId = new Map<string, EnrichedTweet>()
  for (const t of all) {
    if (!byId.has(t.id))
      byId.set(t.id, t)
  }

  const simplified = [...byId.values()]
    .map(simplify)
    .sort((a, b) => (a.jst < b.jst ? -1 : 1))

  await writeJson(simplified, OUT_FILE)

  const count = (s: SimplifiedTweet['source']) => simplified.filter(t => t.source === s).length
  console.log({
    rawTweets: all.length,
    unique: simplified.length,
    official: count('official'),
    members: count('member'),
    audience: count('audience'),
    timeRange: `${simplified[0]?.jst} → ${simplified.at(-1)?.jst}`,
    out: OUT_FILE,
  })
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
