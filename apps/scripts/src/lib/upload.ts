import type { Logger } from '../cli/logger'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { ConfigError } from '../cli/exit'
import { isLocalMode, resolveStorage } from './local-config'
import { avatarPath, mediaDir } from './media'

/**
 * 媒体上传：`LOCAL=1` 写本机 SILO，否则写 R2（或通用 S3）。
 *
 * 没有凭据时直接报错并给出下一步，不把「没上传」伪装成成功。
 */

/** 本地模式总是可用（默认凭据）；线上需要完整的 R2 配置。 */
export function hasStorageCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  if (isLocalMode(env)) {
    return true
  }
  try {
    resolveStorage(env)
    return true
  }
  catch {
    return false
  }
}

interface UploadTask {
  key: string
  file: string
}

export interface UploadResult {
  endpoint: string
  bucket: string
  publicBase: string
  uploaded: number
  skipped: number
  failed: { key: string, error: string }[]
}

/** 上传 `data/instagram/<账号>/` 与平铺头像。 */
export async function uploadAccountMedia(
  insUsername: string,
  options: { bucket?: string, concurrency?: number, log?: Logger } = {},
): Promise<UploadResult> {
  const storage = resolveStorage()
  if (options.bucket) {
    storage.bucket = options.bucket
    storage.publicBase = `${storage.endpoint}/${options.bucket}`
  }

  const { AwsClient } = await import('aws4fetch')
  const client = new AwsClient({
    accessKeyId: storage.accessKeyId,
    secretAccessKey: storage.secretAccessKey,
    service: 's3',
    region: process.env.S3_REGION ?? (storage.local ? 'us-east-1' : 'auto'),
  })

  const tasks: UploadTask[] = []
  const dir = mediaDir(insUsername)

  if (existsSync(dir)) {
    for (const name of await readdir(dir)) {
      tasks.push({
        key: `instagram/${insUsername}/${name}`,
        file: path.join(dir, name),
      })
    }
  }

  const avatar = await findAvatar(insUsername)
  if (avatar) {
    tasks.push({ key: `instagram/${path.basename(avatar)}`, file: avatar })
  }

  if (tasks.length === 0) {
    throw new ConfigError(`本地没有 @${insUsername} 的媒体文件`, {
      code: 'NO_MEDIA',
      hint: `先跑 bun run ig ins media ${insUsername}`,
    })
  }

  const result: UploadResult = {
    endpoint: storage.endpoint,
    bucket: storage.bucket,
    publicBase: storage.publicBase,
    uploaded: 0,
    skipped: 0,
    failed: [],
  }
  let index = 0
  let completed = 0
  const concurrency = options.concurrency ?? 8

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const task = tasks[index++]!
      const url = `${storage.endpoint}/${storage.bucket}/${encodeURI(task.key)}`
      try {
        const head = await client.fetch(url, { method: 'HEAD' })
        if (head.ok) {
          result.skipped++
          completed++
          continue
        }

        const body = await readFile(task.file)
        const response = await client.fetch(url, {
          method: 'PUT',
          body,
          headers: {
            'Content-Type': contentType(task.file),
            // 本地桶 path-style 直读；线上 R2 由桶侧规则决定缓存。
            ...(storage.local
              ? {}
              : { 'Cache-Control': 'public, max-age=31536000, immutable' }),
          },
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        result.uploaded++
        completed++
        if (completed % 50 === 0) {
          options.log?.info(`已上传 ${completed}/${tasks.length}`)
        }
      }
      catch (error) {
        result.failed.push({
          key: task.key,
          error: error instanceof Error
            ? error.message
            : String(error),
        })
        options.log?.warn(`上传失败 ${task.key}`, {
          error: String(error),
        })
      }
    }
  }

  await Promise.all(Array.from({
    length: Math.max(1, Math.min(concurrency, tasks.length)),
  }, worker))

  options.log?.info(`上传目标：${storage.endpoint}/${storage.bucket}`)
  return result
}

async function findAvatar(insUsername: string): Promise<string | undefined> {
  for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
    const file = avatarPath(insUsername, extension)
    if (existsSync(file)) {
      return file
    }
  }
  return undefined
}

function contentType(file: string): string {
  switch (path.extname(file).toLowerCase()) {
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    case '.mp4': return 'video/mp4'
    case '.mov': return 'video/quicktime'
    default: return 'image/jpeg'
  }
}
