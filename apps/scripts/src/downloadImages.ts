/**
 * 批量快速下载推文图片的脚本
 *
 * 从 JSON 数组（EnrichedTweet[]）中提取所有 photo 类型的 media，
 * 以 ?name=large&format=jpg 格式下载到本地目录。
 *
 * 用法:
 *   bun run src/downloadImages.ts                          # 使用默认 cache/data/tmp.json
 *   bun run src/downloadImages.ts path/to/data.json        # 指定输入文件
 *   bun run src/downloadImages.ts path/to/data.json ./out  # 指定输入和输出目录
 *   bun run src/downloadImages.ts --dryrun                 # 仅预览文件名，不下载
 *
 * 输入 JSON 格式:
 *   EnrichedTweet[] — 即 tweets-viewer 的 enriched tweet 数组
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.resolve(__dirname, '../cache')

/** 默认输入文件 */
const DEFAULT_INPUT = path.join(cacheDir, 'data/tmp.json')
/** 默认输出目录（相对于项目根） */
const DEFAULT_OUTPUT = path.join(cacheDir, 'downloads')

// ─── 类型 ────────────────────────────────────────────────────────────────────

interface MediaPhoto {
  media_url_https: string
  index: number
  original_info: { height: number, width: number }
  type: 'photo'
}

interface EnrichedTweet {
  id: string
  media_details?: (MediaPhoto | { type: 'animated_gif' | 'video' } & Record<string, unknown>)[]
  user?: { screen_name?: string }
  created_at?: string
  [key: string]: unknown
}

type TweetData = EnrichedTweet[]

// ─── 解析参数 ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dryrun') || args.includes('--dry-run')
const positional = args.filter(a => !a.startsWith('--'))
const inputFile = positional[0] ? path.resolve(positional[0]) : DEFAULT_INPUT
const outputDir = positional[1] ? path.resolve(positional[1]) : DEFAULT_OUTPUT

// ─── 主逻辑 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`📄 读取: ${inputFile}`)
  const raw = await readFile(inputFile, 'utf8')
  const tweets: TweetData = JSON.parse(raw)

  if (!Array.isArray(tweets) || tweets.length === 0) {
    console.error('❌ JSON 应为非空数组 (EnrichedTweet[])')
    process.exit(1)
  }

  /** Twitter 日期 → YYYYMMDD_HHmmss */
  function formatDate(dateStr: string | undefined): string {
    if (!dateStr)
      return 'unknown'
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime()))
      return 'unknown'
    const y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return `${y}${M}${D}_${h}${m}${s}`
  }

  // 收集所有 photo media
  const photos: { url: string, tweetId: string, index: number, screenName: string, createdAt: string }[] = []

  for (const tweet of tweets) {
    if (!tweet.media_details)
      continue
    for (const media of tweet.media_details) {
      if (media.type === 'photo') {
        const photo = media as MediaPhoto
        photos.push({
          url: photo.media_url_https,
          tweetId: tweet.id,
          index: photo.index,
          screenName: tweet.user?.screen_name ?? 'unknown',
          createdAt: formatDate(tweet.created_at),
        })
      }
    }
  }

  if (photos.length === 0) {
    console.log('⚠️  未找到任何 photo 类型的 media')
    return
  }

  console.log(`📸 共 ${photos.length} 张图片`)

  // ─── dry-run: 只看文件名，不下载 ─────────────────────────────────────
  if (dryRun) {
    console.log('\n📋 Dry-run 模式，预览文件名:\n')
    for (const photo of photos) {
      const suffix = photos.filter(p => p.tweetId === photo.tweetId).length > 1 ? `_${photo.index}` : ''
      const fileName = `${photo.screenName}-${photo.tweetId}-${photo.createdAt}${suffix}.jpg`
      console.log(`  ${fileName}`)
    }
    console.log(`\n共 ${photos.length} 张，确认无误后去掉 --dryrun 正式下载`)
    return
  }

  console.log('开始下载...')
  await mkdir(outputDir, { recursive: true })

  // 并发下载，每次最多 6 个连接
  const concurrency = 6
  let completed = 0
  let failed = 0

  async function download(photo: typeof photos[number]) {
    const downloadUrl = `${photo.url}?name=large&format=jpg`
    // 文件名: username-id-createdAt_index.jpg
    const suffix = photos.filter(p => p.tweetId === photo.tweetId).length > 1 ? `_${photo.index}` : ''
    const fileName = `${photo.screenName}-${photo.tweetId}-${photo.createdAt}${suffix}.jpg`
    const filePath = path.join(outputDir, fileName)

    try {
      const resp = await fetch(downloadUrl)
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }
      const buf = await resp.arrayBuffer()
      await writeFile(filePath, new Uint8Array(buf))
      completed++
      process.stdout.write(`  ✅ [${completed}/${photos.length}] ${fileName}\n`)
    }
    catch (err) {
      failed++
      process.stdout.write(`  ❌ [${failed}] ${fileName}: ${err}\n`)
    }
  }

  // 用 chunked concurrency 控制并发
  for (let i = 0; i < photos.length; i += concurrency) {
    const chunk = photos.slice(i, i + concurrency)
    await Promise.all(chunk.map(download))
  }

  console.log(`\n🎉 完成！成功 ${completed} 张，失败 ${failed} 张`)
  console.log(`📁 保存到: ${outputDir}`)
}

main().catch(console.error)
