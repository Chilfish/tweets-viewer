/**
 * 批量下载推文媒体（图片 / 视频 / 动图）
 *
 * 从 EnrichedTweet[] JSON 中提取 photo / video / animated_gif 类型 media：
 * 图片以 ?name=large&format=jpg 格式流式下载，视频/动图选取最高码率的 MP4 变体。
 *
 * 用法:
 *   bun run src/downloadMedias.ts                           # 默认输入/输出
 *   bun run src/downloadMedias.ts path/to/data.json         # 指定输入
 *   bun run src/downloadMedias.ts in.json ./out             # 指定输入和输出
 *   bun run src/downloadMedias.ts --dry-run                 # 仅预览文件名
 *   bun run src/downloadMedias.ts --patch                   # 修复已有文件的修改时间（HEAD 请求，不重新下载）
 *   bun run src/downloadMedias.ts --images-only             # 仅下载图片
 *   bun run src/downloadMedias.ts --videos-only             # 仅下载视频/动图
 */

import type { EnrichedTweet, MediaDetails } from '@tweets-viewer/rettiwt-api'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, utimes } from 'node:fs/promises'
import path from 'node:path'
import { pipeline, Readable } from 'node:stream'
import { promisify } from 'node:util'
import { cacheDir } from './utils'

const streamPipeline = promisify(pipeline)

// ─── 类型 ───────────────────────────────────────────────────

/** 提取出的单个媒体文件信息 */
interface MediaEntry {
  url: string
  ext: 'jpg' | 'mp4'
  type: MediaDetails['type']
  tweetId: string
  index: number
  screenName: string
  createdAt: string
}

/** 单文件下载结果 */
interface DownloadResult {
  url: string
  filename: string
  success: boolean
  error?: string
}

// ─── 默认值 ─────────────────────────────────────────────────

const DEFAULT_INPUT = path.join(cacheDir, 'data/tmp.json')
const DEFAULT_OUTPUT = path.join(cacheDir, 'downloads')

const CONCURRENCY = 16
const MAX_RETRIES = 2
/**
 * 单次下载超时（秒）
 *
 * 仅作 hung 连接兜底，避免永久卡死阻塞批次。
 * 视频体积大，30s 太短会导致下载中被 abort 反复重试，放宽到 120s。
 */
const FETCH_TIMEOUT_S = 120

// ─── 工具函数 ────────────────────────────────────────────────

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

/** 清理文件名中的非法字符 */
function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim()
}

/**
 * 从视频 media 的 variants 中选出最高码率的 MP4 变体
 *
 * variants 可能同时含 video/mp4（有 bitrate）与 application/x-mpegURL
 * （HLS 分片列表，不可直接下载为单文件），因此优先 MP4。
 */
function pickVideoUrl(media: Extract<MediaDetails, { type: 'video' | 'animated_gif' }>): string | undefined {
  const variants = media.video_info?.variants ?? []
  const mp4 = variants
    .filter(v => v.content_type === 'video/mp4')
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))
  return mp4[0]?.url
}

/** 从推文数组中提取所有可下载的 media（图片 + 视频/动图） */
function extractMedias(tweets: EnrichedTweet[]): MediaEntry[] {
  const medias: MediaEntry[] = []
  for (const tweet of tweets) {
    if (!tweet.media_details)
      continue
    for (const media of tweet.media_details) {
      const base = {
        tweetId: tweet.id,
        index: media.index,
        screenName: tweet.user?.screen_name ?? 'unknown',
        createdAt: formatDate(tweet.created_at),
      }
      if (media.type === 'photo') {
        medias.push({
          ...base,
          type: 'photo',
          ext: 'jpg',
          url: `${media.media_url_https}?name=large&format=jpg`,
        })
      }
      else if (media.type === 'video' || media.type === 'animated_gif') {
        const url = pickVideoUrl(media)
        if (url) {
          medias.push({
            ...base,
            type: media.type,
            ext: 'mp4',
            url,
          })
        }
        else {
          console.warn(`  ⚠️  无法解析视频源（${base.screenName} ${base.tweetId} 第 ${media.index} 个 media）`)
        }
      }
    }
  }
  return medias
}

/** 生成下载文件名：screenName-tweetId-createdAt[_index].ext */
function makeFilename(media: MediaEntry, hasMultipleInTweet: boolean): string {
  const suffix = hasMultipleInTweet ? `_${media.index}` : ''
  const raw = `${media.screenName}-${media.tweetId}-${media.createdAt}${suffix}.${media.ext}`
  return sanitizeFilename(raw)
}

/**
 * 预计算每条推文各类型媒体的数量（O(n)，避免循环中重复 filter）
 *
 * key 为 `${tweetId}:${type}`，保证图片和视频各自按数量判断后缀，
 * 避免同一推文里「1 张图 + 1 个视频」导致单张图片也被加上 `_index`。
 */
function countMediasPerTweet(medias: MediaEntry[]): Map<string, number> {
  const count = new Map<string, number>()
  for (const m of medias) {
    const key = `${m.tweetId}:${m.type}`
    count.set(key, (count.get(key) ?? 0) + 1)
  }
  return count
}

/** 该媒体在同推文、同类型媒体中的序号（用于判断是否需要 `_index` 后缀） */
function countKeyOf(media: MediaEntry): string {
  return `${media.tweetId}:${media.type}`
}

/** 指数退避等待 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ─── 文件时间修复 ────────────────────────────────────────────

/**
 * 从响应头 Last-Modified 恢复文件的修改时间
 *
 * 参考 download.ts：下载完成后将服务端返回的 Last-Modified
 * 写入文件 mtime，让媒体浏览器能按原始时间排序。
 */
async function applyMtime(filePath: string, resp: Response): Promise<void> {
  const lastModified = resp.headers.get('last-modified')
  const mtime = lastModified ? new Date(lastModified) : new Date()
  await utimes(filePath, mtime, mtime)
}

// ─── 核心下载 ────────────────────────────────────────────────

/**
 * 下载单个媒体文件到本地
 *
 * - Node.js stream pipeline 流式写入，避免全量读入内存
 * - 自动从 Last-Modified 响应头恢复文件修改时间
 * - 失败自动重试（指数退避）
 * - 已存在文件自动跳过
 */
async function downloadOne(
  media: MediaEntry,
  outputDir: string,
  hasMultipleInTweet: boolean,
): Promise<DownloadResult> {
  const fileName = makeFilename(media, hasMultipleInTweet)
  const filePath = path.join(outputDir, fileName)

  // 跳过已存在文件
  if (existsSync(filePath)) {
    return { url: media.url, filename: fileName, success: true }
  }

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(media.url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_S * 1000),
      })

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
      }

      // Web ReadableStream → Node Readable → pipeline 写入文件
      const nodeStream = Readable.fromWeb(resp.body as any)
      await streamPipeline(nodeStream, createWriteStream(filePath))

      // 恢复服务端的 Last-Modified 时间
      await applyMtime(filePath, resp)

      return { url: media.url, filename: fileName, success: true }
    }
    catch (err) {
      lastError = err as Error
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * 2 ** attempt // 1s → 2s → 4s
        console.warn(`  重试 ${attempt + 1}/${MAX_RETRIES}（${delay}ms 后）: ${fileName}`)
        await sleep(delay)
      }
    }
  }

  return { url: media.url, filename: fileName, success: false, error: lastError!.message }
}

// ─── 批量下载 ────────────────────────────────────────────────

/**
 * 分批并发下载所有媒体
 *
 * 每批最多 CONCURRENCY 个并行请求，批内并发、批间串行，
 * 避免同时打开过多连接。
 */
async function downloadAll(medias: MediaEntry[], outputDir: string): Promise<{ success: number, failed: number }> {
  await mkdir(outputDir, { recursive: true })

  const tweetMediaCount = countMediasPerTweet(medias)
  const totalBatches = Math.ceil(medias.length / CONCURRENCY)

  let completed = 0
  let failed = 0

  for (let i = 0; i < medias.length; i += CONCURRENCY) {
    const batchNum = Math.floor(i / CONCURRENCY) + 1
    const chunk = medias.slice(i, i + CONCURRENCY)

    let results: DownloadResult[]
    try {
      results = await Promise.all(
        chunk.map(media =>
          downloadOne(media, outputDir, (tweetMediaCount.get(countKeyOf(media)) ?? 0) > 1),
        ),
      )
    }
    catch (err) {
      console.error(`\n❌ 第 ${batchNum}/${totalBatches} 批异常:`, err)
      failed += chunk.length
      continue
    }

    for (const r of results) {
      if (r.success) {
        completed++
        console.log(`  ✅ [${completed}/${medias.length}] ${r.filename}`)
      }
      else {
        failed++
        console.log(`  ❌ [${failed}] ${r.filename}: ${r.error}`)
      }
    }

    console.log(`  📦 第 ${batchNum}/${totalBatches} 批完成 (累计 ${completed} 成功 / ${failed} 失败)`)
  }

  return { success: completed, failed }
}

// ─── 时间戳修复（--patch）────────────────────────────────────

/**
 * 批量修复已有文件的修改时间
 *
 * 对已存在的文件发 HEAD 请求获取 Last-Modified 并写入 mtime；
 * 不存在的文件走正常下载流程（含 mtime 写入）。
 */
async function patchTimestamps(
  medias: MediaEntry[],
  outputDir: string,
): Promise<{ patched: number, downloaded: number, failed: number }> {
  await mkdir(outputDir, { recursive: true })

  const tweetMediaCount = countMediasPerTweet(medias)
  const totalBatches = Math.ceil(medias.length / CONCURRENCY)

  let patched = 0
  let downloaded = 0
  let failed = 0

  for (let i = 0; i < medias.length; i += CONCURRENCY) {
    const batchNum = Math.floor(i / CONCURRENCY) + 1
    const chunk = medias.slice(i, i + CONCURRENCY)

    const tasks = chunk.map(async (media) => {
      const hasMultiple = (tweetMediaCount.get(countKeyOf(media)) ?? 0) > 1
      const fileName = makeFilename(media, hasMultiple)
      const filePath = path.join(outputDir, fileName)

      // 文件不存在 → 正常下载
      if (!existsSync(filePath)) {
        const result = await downloadOne(media, outputDir, hasMultiple)
        return { ...result, patched: false, downloaded: result.success }
      }

      // 文件已存在 → HEAD 请求获取 Last-Modified
      try {
        const resp = await fetch(media.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_S * 1000),
        })
        if (resp.ok) {
          await applyMtime(filePath, resp)
          return { url: media.url, filename: fileName, success: true, patched: true, downloaded: false }
        }
        return { url: media.url, filename: fileName, success: false, patched: true, downloaded: false, error: `HTTP ${resp.status}` }
      }
      catch (err) {
        return { url: media.url, filename: fileName, success: false, patched: true, downloaded: false, error: (err as Error).message }
      }
    })

    const results = await Promise.all(tasks)

    for (const r of results) {
      if (r.success) {
        if (r.patched) {
          patched++
          console.log(`  🕐 [${patched}] ${r.filename}`)
        }
        else {
          downloaded++
          console.log(`  ✅ [${downloaded}] ${r.filename}`)
        }
      }
      else {
        failed++
        console.log(`  ❌ [${failed}] ${r.filename}: ${r.error}`)
      }
    }

    console.log(`  📦 第 ${batchNum}/${totalBatches} 批完成 (累计 ${patched} 修时 / ${downloaded} 下载 / ${failed} 失败)`)
  }

  return { patched, downloaded, failed }
}

// ─── CLI 入口 ─────────────────────────────────────────────────

async function main() {
  // 解析参数
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('--dryrun')
  const patchMode = args.includes('--patch')
  const imagesOnly = args.includes('--images-only')
  const videosOnly = args.includes('--videos-only')
  const positional = args.filter(a => !a.startsWith('--'))
  const inputFile = positional[0] ? path.resolve(positional[0]) : DEFAULT_INPUT
  const outputDir = positional[1] ? path.resolve(positional[1]) : DEFAULT_OUTPUT

  // 读取 & 解析 JSON
  console.log(`📄 读取: ${inputFile}`)
  const raw = await readFile(inputFile, 'utf8')
  const tweets: EnrichedTweet[] = JSON.parse(raw).map((d: any) => d.jsonData || d)

  if (!Array.isArray(tweets) || tweets.length === 0) {
    console.error('❌ JSON 应为非空数组 (EnrichedTweet[])')
    process.exit(1)
  }

  // 提取媒体 & 按需筛选
  let medias = extractMedias(tweets)
  if (imagesOnly)
    medias = medias.filter(m => m.type === 'photo')
  if (videosOnly)
    medias = medias.filter(m => m.type !== 'photo')

  if (medias.length === 0) {
    console.log('⚠️  未找到任何可下载的 media')
    return
  }

  const photoCount = medias.filter(m => m.type === 'photo').length
  const videoCount = medias.length - photoCount
  console.log(`🎬 共 ${medias.length} 个媒体（${photoCount} 张图片 / ${videoCount} 个视频）`)

  // ── dry-run：仅预览文件名 ──
  if (dryRun) {
    console.log('\n📋 Dry-run 模式，预览文件名:\n')
    const tweetMediaCount = countMediasPerTweet(medias)
    for (const media of medias) {
      console.log(`  ${makeFilename(media, (tweetMediaCount.get(countKeyOf(media)) ?? 0) > 1)}`)
    }
    console.log(`\n共 ${medias.length} 个，确认无误后去掉 --dry-run 正式下载`)
    return
  }

  // ── patch：修复已有文件时间，缺失的补下载 ──
  if (patchMode) {
    console.log('🔧 Patch 模式：已有文件 HEAD 获取 Last-Modified → utimes，缺失文件正常下载\n')
    const { patched, downloaded, failed } = await patchTimestamps(medias, outputDir)
    console.log(`\n🎉 完成！修时 ${patched} 个，下载 ${downloaded} 个，失败 ${failed} 个`)
    console.log(`📁 保存到: ${outputDir}`)
    return
  }

  // ── 正式下载 ──
  console.log('开始下载...')
  const { success, failed } = await downloadAll(medias, outputDir)
  console.log(`\n🎉 完成！成功 ${success} 个，失败 ${failed} 个`)
  console.log(`📁 保存到: ${outputDir}`)
}

main().catch(console.error)
