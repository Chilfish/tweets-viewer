import type { Logger } from '@chilfish/devkit/cli'
import type { IGPost, IGUserInfo } from '@tweets-viewer/shared'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { dataDir } from './env'

/** 导出文件里的 user 形状：与 `import` 读取的字段一致。 */
export interface ExportedUser {
  userName: string
  fullName: string
  profileImage?: string
  isVerified: boolean
  description?: string
  url?: string
  followingsCount?: number
  followersCount?: number
  statusesCount?: number
}

export interface ExportFile {
  user: ExportedUser
  posts: IGPost[]
}

export function toExportedUser(info: IGUserInfo): ExportedUser {
  return {
    userName: info.username,
    fullName: info.fullname,
    profileImage: info.avatar_url,
    isVerified: info.verified ?? false,
    description: info.bio,
    url: info.external_url,
    followingsCount: info.following_count,
    followersCount: info.followers_count,
    statusesCount: info.posts_count,
  }
}

export function exportJsonPath(insUsername: string): string {
  return path.join(dataDir, `${insUsername}.json`)
}

export function cdnJsonPath(insUsername: string): string {
  return path.join(dataDir, `${insUsername}.cdn.json`)
}

export function mediaDir(insUsername: string): string {
  return path.join(dataDir, 'instagram', insUsername)
}

/** 头像与用户目录同级（`instagram/<账号>.jpg`），不在目录里。 */
export function avatarPath(insUsername: string, extension: string): string {
  return path.join(dataDir, 'instagram', `${insUsername}.${extension}`)
}

export async function writeExportFile(insUsername: string, content: ExportFile): Promise<string> {
  const file = exportJsonPath(insUsername)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(content, null, 2)}\n`, 'utf8')
  return file
}

export async function readExportFile(file: string): Promise<ExportFile> {
  return JSON.parse(await readFile(file, 'utf8')) as ExportFile
}

export async function writeCdnFile(insUsername: string, content: ExportFile): Promise<string> {
  const file = cdnJsonPath(insUsername)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(content, null, 2)}\n`, 'utf8')
  return file
}

/**
 * 把帖子与头像的媒体地址改写成 CDN 地址，返回新对象（不改入参）。
 *
 * 帖子媒体：`<cdn>/instagram/<账号>/<shortcode>-<num>.<ext>`
 * 头像：`<cdn>/instagram/<账号>.<ext>`（平铺，与用户目录同级）
 */
export function rewriteToCdn(
  insUsername: string,
  exported: ExportFile,
  cdnBase: string,
): ExportFile {
  const avatarExtension = extensionFromUrl(exported.user.profileImage ?? '')
  const avatarUrl = `${cdnBase}/instagram/${insUsername}.${avatarExtension}`

  const posts = exported.posts.map((post) => {
    const media = post.media.map((item) => {
      const extension = extensionFromFile(item.display_url, item.video_url)
      const cdnUrl = `${cdnBase}/instagram/${insUsername}/${post.id}-${item.num}.${extension}`
      return {
        ...item,
        display_url: cdnUrl,
        video_url: item.video_url ? cdnUrl : null,
      }
    })
    return { ...post, media, avatar_url: avatarUrl }
  })

  return {
    user: {
      ...exported.user,
      profileImage: exported.user.profileImage ? avatarUrl : undefined,
    },
    posts,
  }
}

interface DownloadTask {
  url: string
  file: string
  label: string
}

export interface DownloadResult {
  downloaded: number
  skipped: number
  failed: { label: string, error: string }[]
}

/**
 * 下载帖子媒体与头像。
 *
 * 文件名固定为 `<shortcode>-<num>.<ext>`，与 CDN key 一一对应；
 * 已存在的文件直接跳过，中断后可以重跑。
 */
export async function downloadExportMedia(
  insUsername: string,
  exported: ExportFile,
  options: { concurrency?: number, log?: Logger } = {},
): Promise<DownloadResult> {
  const concurrency = options.concurrency ?? 16
  const log = options.log
  const dir = mediaDir(insUsername)
  await mkdir(dir, { recursive: true })

  const tasks: DownloadTask[] = []
  for (const post of exported.posts) {
    for (const item of post.media) {
      const source = item.video_url || item.display_url
      const extension = extensionFromFile(item.display_url, item.video_url)
      const fileName = `${post.id}-${item.num}.${extension}`
      tasks.push({
        url: source,
        file: path.join(dir, fileName),
        label: fileName,
      })
    }
  }

  const avatarUrl = exported.user.profileImage
  if (avatarUrl) {
    const extension = extensionFromUrl(avatarUrl)
    const fileName = `${insUsername}.${extension}`
    tasks.push({
      url: avatarUrl,
      file: avatarPath(insUsername, extension),
      label: fileName,
    })
  }

  const result: DownloadResult = { downloaded: 0, skipped: 0, failed: [] }
  let index = 0
  let completed = 0

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const task = tasks[index++]!
      if (existsSync(task.file)) {
        result.skipped++
        completed++
        continue
      }
      try {
        await downloadOne(task)
        result.downloaded++
        completed++
        if (completed % 25 === 0) {
          log?.info(`已下载 ${completed}/${tasks.length}`)
        }
      }
      catch (error) {
        result.failed.push({
          label: task.label,
          error: error instanceof Error
            ? error.message
            : String(error),
        })
        log?.warn(`下载失败 ${task.label}`, {
          error: String(error),
        })
      }
    }
  }

  await Promise.all(Array.from({
    length: Math.max(1, Math.min(concurrency, tasks.length)),
  }, worker))
  return result
}

async function downloadOne(task: DownloadTask): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(task.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; tweets-viewer/ig-cli)' },
        signal: AbortSignal.timeout(120_000),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      await mkdir(path.dirname(task.file), { recursive: true })
      await writeFile(task.file, new Uint8Array(await response.arrayBuffer()))
      return
    }
    catch (error) {
      lastError = error
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError))
}

export function extensionFromUrl(url: string): string {
  try {
    const match = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname)
    return match?.[1]?.toLowerCase() ?? 'jpg'
  }
  catch {
    return 'jpg'
  }
}

function extensionFromFile(displayUrl: string, videoUrl?: string | null): string {
  return extensionFromUrl(videoUrl || displayUrl)
}
