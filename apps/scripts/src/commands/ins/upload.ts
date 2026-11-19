import type { CommandSpec } from '@chilfish/devkit/cli'
import { ConfigError } from '@chilfish/devkit/cli'
import { Option } from 'commander'
import { hasStorageCredentials, uploadAccountMedia } from '../../lib/upload'

interface UploadData {
  insUsername: string
  endpoint: string
  bucket: string
  uploaded: number
  skipped: number
  failed: number
}

export const uploadSpec: CommandSpec<UploadData> = {
  id: 'ins.upload',
  description: '把本地媒体上传到对象存储（instagram/ 前缀）',
  details: '`LOCAL=1` 写本机 SILO；否则写 R2。帖子媒体传到 `instagram/<账号>/`，\n'
    + '头像平铺到 `instagram/<账号>.<ext>`。已存在的对象会跳过。',
  examples: [
    'bun run ig ins upload ritsu_mgmg',
    'bun run ig ins upload ritsu_mgmg --bucket my-bucket',
  ],
  arguments: [
    { name: 'account', description: 'IG 账号' },
  ],
  options: [
    new Option('--bucket <name>', '目标桶，默认 R2_BUCKET；LOCAL=1 时是 tweets-viewer'),
    new Option('--concurrency <n>', '并发上传数，默认 8'),
  ],
  async run(ctx) {
    const insUsername = ctx.args[0]
    if (!insUsername) {
      throw new ConfigError('缺少 IG 账号', {
        hint: '示例：bun run ig ins upload ritsu_mgmg',
      })
    }

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将上传 @${insUsername} 的本地媒体到 instagram/${insUsername}/`)
      return {
        data: {
          insUsername,
          endpoint: '',
          bucket: '',
          uploaded: 0,
          skipped: 0,
          failed: 0,
        },
      }
    }

    if (!hasStorageCredentials()) {
      throw new ConfigError('没有对象存储凭据，无法上传', {
        code: 'MISSING_ENV',
        hint: '设置 LOCAL=1 用本机 SILO（bun run ig dev storage），或配置 R2_* 后重试',
      })
    }

    const result = await uploadAccountMedia(insUsername, {
      bucket: ctx.options.bucket as string | undefined,
      concurrency: ctx.integer('concurrency', 8, 1),
      log: ctx.log.child(insUsername),
    })

    return {
      data: {
        insUsername,
        endpoint: result.endpoint,
        bucket: result.bucket,
        uploaded: result.uploaded,
        skipped: result.skipped,
        failed: result.failed.length,
      },
      exitCode: result.failed.length > 0
        ? 1
        : 0,
      summary: `@${insUsername} → ${result.publicBase}：上传 ${result.uploaded}，跳过 ${result.skipped}，失败 ${result.failed.length}`,
    }
  },
}
