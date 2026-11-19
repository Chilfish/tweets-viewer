import type { Logger } from '../cli/logger'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { ConfigError } from '../cli/exit'
import { avatarPath, mediaDir } from './media'

/**
 * R2 / S3 上传。
 *
 * 凭据来自环境变量（R2_* 优先，其次通用 S3_*）。没有凭据时直接报错并给出
 * 下一步，不把「没上传」伪装成成功。
 */

interface UploadConfig {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBase: string
}

export function hasUploadCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  const accountId = env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() ?? env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() ?? env.S3_SECRET_ACCESS_KEY?.trim()
  return Boolean((accountId || env.S3_ENDPOINT) && accessKeyId && secretAccessKey)
}

function resolveUploadConfig(bucketOverride?: string, env: NodeJS.ProcessEnv = process.env): UploadConfig {
  const accountId = env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() ?? env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() ?? env.S3_SECRET_ACCESS_KEY?.trim()
  const bucket = bucketOverride ?? env.R2_BUCKET?.trim() ?? env.S3_BUCKET_NAME?.trim()
  const customEndpoint = env.S3_ENDPOINT?.trim()

  const endpoint = accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : customEndpoint

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new ConfigError('缺少对象存储凭据，无法上传', {
      code: 'MISSING_ENV',
      hint: '配置 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET，'
        + '或先在 chill-s3 面板手动导入 data/instagram/<账号>/',
      context: {
        missing: [
          !endpoint && 'R2_ACCOUNT_ID 或 S3_ENDPOINT',
          !accessKeyId && 'R2_ACCESS_KEY_ID 或 S3_ACCESS_KEY_ID',
          !secretAccessKey && 'R2_SECRET_ACCESS_KEY 或 S3_SECRET_ACCESS_KEY',
          !bucket && 'R2_BUCKET 或 S3_BUCKET_NAME',
        ].filter(Boolean),
      },
    })
  }

  return {
    endpoint: endpoint.replace(/\/+$/, ''),
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBase: (env.IG_CDN_BASE?.trim() || 'https://s3.chilfish.top').replace(/\/+$/, ''),
  }
}

interface UploadTask {
  key: string
  file: string
}

export interface UploadResult {
  uploaded: number
  skipped: number
  failed: { key: string, error: string }[]
}

/** 上传 `data/instagram/<账号>/` 与平铺头像。 */
export async function uploadAccountMedia(
  insUsername: string,
  options: { bucket?: string, concurrency?: number, log?: Logger } = {},
): Promise<UploadResult> {
  const config = resolveUploadConfig(options.bucket)
  const { AwsClient } = await import('aws4fetch')
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
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

  const result: UploadResult = { uploaded: 0, skipped: 0, failed: [] }
  let index = 0
  let completed = 0
  const concurrency = options.concurrency ?? 8

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const task = tasks[index++]!
      const url = `${config.endpoint}/${config.bucket}/${encodeURI(task.key)}`
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

  options.log?.info(`上传目标：${config.bucket}（${config.publicBase}）`)
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
