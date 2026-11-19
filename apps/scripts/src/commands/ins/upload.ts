import type { CommandSpec } from '../../cli/runtime'
import { Option } from 'commander'
import { hasUploadCredentials, uploadAccountMedia } from '../../lib/upload'

interface UploadData {
  insUsername: string
  uploaded: number
  skipped: number
  failed: number
}

export const uploadSpec: CommandSpec<UploadData> = {
  id: 'ins.upload',
  description: '把本地媒体上传到 R2（instagram/ 前缀）',
  details: '帖子媒体传到 `instagram/<账号>/`，头像平铺到 `instagram/<账号>.<ext>`。\n'
    + '已存在的对象会跳过。没有凭据时直接失败并给出下一步，不会假装成功。',
  examples: [
    'bun run ig ins upload ritsu_mgmg',
    'bun run ig ins upload ritsu_mgmg --bucket my-bucket',
  ],
  arguments: [
    { name: 'account', description: 'IG 账号' },
  ],
  options: [
    new Option('--bucket <name>', '目标桶，默认 R2_BUCKET'),
    new Option('--concurrency <n>', '并发上传数，默认 8'),
  ],
  async run(ctx) {
    const insUsername = ctx.args[0]
    if (!insUsername) {
      throw new Error('缺少 IG 账号，示例：bun run ig ins upload ritsu_mgmg')
    }

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将上传 @${insUsername} 的本地媒体到 instagram/${insUsername}/`)
      return {
        data: {
          insUsername,
          uploaded: 0,
          skipped: 0,
          failed: 0,
        },
      }
    }

    if (!hasUploadCredentials()) {
      ctx.log.warn('没有对象存储凭据，上传会失败；也可以先在 chill-s3 面板手动导入')
    }

    const result = await uploadAccountMedia(insUsername, {
      bucket: ctx.options.bucket as string | undefined,
      concurrency: ctx.integer('concurrency', 8, 1),
      log: ctx.log.child(insUsername),
    })

    return {
      data: {
        insUsername,
        uploaded: result.uploaded,
        skipped: result.skipped,
        failed: result.failed.length,
      },
      exitCode: result.failed.length > 0
        ? 1
        : 0,
      summary: `@${insUsername}：上传 ${result.uploaded}，跳过 ${result.skipped}，失败 ${result.failed.length}`,
    }
  },
}
