/**
 * 批量下载推文图片
 *
 * 从 EnrichedTweet[] JSON 中提取 photo 类型 media，
 * 以 ?name=large&format=jpg 格式流式下载到本地。
 *
 * 用法:
 *   bun run src/downloadImages.ts                           # 默认输入/输出
 *   bun run src/downloadImages.ts path/to/data.json         # 指定输入
 *   bun run src/downloadImages.ts in.json ./out             # 指定输入和输出
 *   bun run src/downloadImages.ts --dry-run                 # 仅预览文件名
 *   bun run src/downloadImages.ts --patch                   # 修复已有文件的修改时间（HEAD 请求，不重新下载）
 */

import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, utimes } from 'node:fs/promises'
import path from 'node:path'
import { pipeline, Readable } from 'node:stream'
import { promisify } from 'node:util'
import { cacheDir } from './utils'

const streamPipeline = promisify(pipeline)

// ─── 类型 ───────────────────────────────────────────────────

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

/** 提取出的单张图片信息 */
interface PhotoEntry {
  url: string
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
/** 单次请求超时（秒），避免 hung 连接阻塞整个批次 */
const FETCH_TIMEOUT_S = 30

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

/** 从推文数组中提取所有 photo 类型的 media */
function extractPhotos(tweets: EnrichedTweet[]): PhotoEntry[] {
  const photos: PhotoEntry[] = []
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
  return photos
}

/** 生成下载文件名：screenName-tweetId-createdAt[_index].jpg */
function makeFilename(photo: PhotoEntry, hasMultipleInTweet: boolean): string {
  const suffix = hasMultipleInTweet ? `_${photo.index}` : ''
  const raw = `${photo.screenName}-${photo.tweetId}-${photo.createdAt}${suffix}.jpg`
  return sanitizeFilename(raw)
}

/** 预计算每条推文的图片数量（O(n)，避免循环中重复 filter） */
function countPhotosPerTweet(photos: PhotoEntry[]): Map<string, number> {
  const count = new Map<string, number>()
  for (const p of photos) {
    count.set(p.tweetId, (count.get(p.tweetId) ?? 0) + 1)
  }
  return count
}

/** 指数退避等待 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ─── 文件时间修复 ────────────────────────────────────────────

/**
 * 从响应头 Last-Modified 恢复文件的修改时间
 *
 * 参考 download.ts：下载完成后将服务端返回的 Last-Modified
 * 写入文件 mtime，让图片浏览器能按原始时间排序。
 */
async function applyMtime(filePath: string, resp: Response): Promise<void> {
  const lastModified = resp.headers.get('last-modified')
  const mtime = lastModified ? new Date(lastModified) : new Date()
  await utimes(filePath, mtime, mtime)
}

// ─── 核心下载 ────────────────────────────────────────────────

/**
 * 下载单张图片到本地
 *
 * - Node.js stream pipeline 流式写入，避免全量读入内存
 * - 自动从 Last-Modified 响应头恢复文件修改时间
 * - 失败自动重试（指数退避）
 * - 已存在文件自动跳过
 */
async function downloadOne(
  photo: PhotoEntry,
  outputDir: string,
  hasMultipleInTweet: boolean,
): Promise<DownloadResult> {
  const downloadUrl = `${photo.url}?name=large&format=jpg`
  const fileName = makeFilename(photo, hasMultipleInTweet)
  const filePath = path.join(outputDir, fileName)

  // 跳过已存在文件
  if (existsSync(filePath)) {
    return { url: downloadUrl, filename: fileName, success: true }
  }

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(downloadUrl, {
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

      return { url: downloadUrl, filename: fileName, success: true }
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

  return { url: downloadUrl, filename: fileName, success: false, error: lastError!.message }
}

// ─── 批量下载 ────────────────────────────────────────────────

/**
 * 分批并发下载所有图片
 *
 * 每批最多 CONCURRENCY 个并行请求，批内并发、批间串行，
 * 避免同时打开过多连接。
 */
async function downloadAll(photos: PhotoEntry[], outputDir: string): Promise<{ success: number, failed: number }> {
  await mkdir(outputDir, { recursive: true })

  const tweetPhotoCount = countPhotosPerTweet(photos)
  const totalBatches = Math.ceil(photos.length / CONCURRENCY)

  let completed = 0
  let failed = 0

  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const batchNum = Math.floor(i / CONCURRENCY) + 1
    const chunk = photos.slice(i, i + CONCURRENCY)

    let results: DownloadResult[]
    try {
      results = await Promise.all(
        chunk.map(photo =>
          downloadOne(photo, outputDir, (tweetPhotoCount.get(photo.tweetId) ?? 0) > 1),
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
        console.log(`  ✅ [${completed}/${photos.length}] ${r.filename}`)
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
  photos: PhotoEntry[],
  outputDir: string,
): Promise<{ patched: number, downloaded: number, failed: number }> {
  await mkdir(outputDir, { recursive: true })

  const tweetPhotoCount = countPhotosPerTweet(photos)
  const totalBatches = Math.ceil(photos.length / CONCURRENCY)

  let patched = 0
  let downloaded = 0
  let failed = 0

  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const batchNum = Math.floor(i / CONCURRENCY) + 1
    const chunk = photos.slice(i, i + CONCURRENCY)

    const tasks = chunk.map(async (photo) => {
      const hasMultiple = (tweetPhotoCount.get(photo.tweetId) ?? 0) > 1
      const fileName = makeFilename(photo, hasMultiple)
      const filePath = path.join(outputDir, fileName)
      const downloadUrl = `${photo.url}?name=large&format=jpg`

      // 文件不存在 → 正常下载
      if (!existsSync(filePath)) {
        const result = await downloadOne(photo, outputDir, hasMultiple)
        return { ...result, patched: false, downloaded: result.success }
      }

      // 文件已存在 → HEAD 请求获取 Last-Modified
      try {
        const resp = await fetch(downloadUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_S * 1000),
        })
        if (resp.ok) {
          await applyMtime(filePath, resp)
          return { url: downloadUrl, filename: fileName, success: true, patched: true, downloaded: false }
        }
        return { url: downloadUrl, filename: fileName, success: false, patched: true, downloaded: false, error: `HTTP ${resp.status}` }
      }
      catch (err) {
        return { url: downloadUrl, filename: fileName, success: false, patched: true, downloaded: false, error: (err as Error).message }
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

  // 提取图片
  const photos = extractPhotos(tweets)
  if (photos.length === 0) {
    console.log('⚠️  未找到任何 photo 类型的 media')
    return
  }
  console.log(`📸 共 ${photos.length} 张图片`)

  // ── dry-run：仅预览文件名 ──
  if (dryRun) {
    console.log('\n📋 Dry-run 模式，预览文件名:\n')
    const tweetPhotoCount = countPhotosPerTweet(photos)
    for (const photo of photos) {
      console.log(`  ${makeFilename(photo, (tweetPhotoCount.get(photo.tweetId) ?? 0) > 1)}`)
    }
    console.log(`\n共 ${photos.length} 张，确认无误后去掉 --dry-run 正式下载`)
    return
  }

  // ── patch：修复已有文件时间，缺失的补下载 ──
  if (patchMode) {
    console.log('🔧 Patch 模式：已有文件 HEAD 获取 Last-Modified → utimes，缺失文件正常下载\n')
    const { patched, downloaded, failed } = await patchTimestamps(photos, outputDir)
    console.log(`\n🎉 完成！修时 ${patched} 张，下载 ${downloaded} 张，失败 ${failed} 张`)
    console.log(`📁 保存到: ${outputDir}`)
    return
  }

  // ── 正式下载 ──
  console.log('开始下载...')
  const { success, failed } = await downloadAll(photos, outputDir)
  console.log(`\n🎉 完成！成功 ${success} 张，失败 ${failed} 张`)
  console.log(`📁 保存到: ${outputDir}`)
}

main().catch(console.error)
