import type { CommandSpec } from '../../cli/runtime'
import { existsSync } from 'node:fs'
import { Option } from 'commander'
import { UsageError } from '../../cli/exit'
import { exportJsonPath, readExportFile } from '../../lib/media'
import { runMedia } from '../../lib/pipeline'
import { normalizeAccount } from '../../lib/session'

interface MediaData {
  insUsername: string
  cdnFile: string
  downloaded: number
  skipped: number
  failed: number
}

export const mediaSpec: CommandSpec<MediaData> = {
  id: 'ins.media',
  description: '下载媒体并改写 CDN 链接，产出 data/instagram/<账号>/ 与 *.cdn.json',
  details: '输入来自 `ins export` 产出的 JSON。已存在的文件会跳过，中断后可以重跑。\n'
    + '有下载失败时仍会写出 `.cdn.json`，但退出码为 1。',
  examples: [
    'bun run ig ins media ritsu_mgmg',
    'bun run ig ins media --from data/ritsu_mgmg.json',
    'bun run ig ins media ritsu_mgmg --concurrency 8',
  ],
  arguments: [
    { name: 'account', description: 'IG 账号；与 --from 二选一', required: false },
  ],
  options: [
    new Option('--from <path>', '直接指定导出 JSON 路径'),
    new Option('--concurrency <n>', '并发下载数，默认 16'),
  ],
  async run(ctx) {
    const from = ctx.options.from as string | undefined
    const insUsername = from
      ? ''
      : normalizeAccount(ctx.args[0])

    const file = from ?? exportJsonPath(insUsername)
    if (!existsSync(file)) {
      throw new UsageError(`找不到导出文件：${file}`, {
        hint: `先跑 bun run ig ins export ${insUsername || '<账号>'}`,
      })
    }

    const exported = await readExportFile(file)
    const account = exported.user.userName
    if (!account) {
      throw new UsageError(`${file} 里没有 user.userName`, { hint: '重新跑 ins export 生成' })
    }

    if (ctx.dryRun) {
      const mediaCount = exported.posts.reduce((sum, post) => sum + post.media.length, 0)
      ctx.log.info(`dry-run：将下载 @${account} 的 ${mediaCount} 个媒体文件，并写 data/${account}.cdn.json`)
      return {
        data: {
          insUsername: account,
          cdnFile: '',
          downloaded: 0,
          skipped: 0,
          failed: 0,
        },
      }
    }

    const result = await runMedia(account, exported, {
      concurrency: ctx.integer('concurrency', 16, 1),
      log: ctx.log.child(account),
    })

    if (result.failed.length > 0) {
      ctx.log.error(`有 ${result.failed.length} 个文件下载失败，见上方日志`)
    }

    return {
      data: {
        insUsername: account,
        cdnFile: result.cdnFile,
        downloaded: result.downloaded,
        skipped: result.skipped,
        failed: result.failed.length,
      },
      exitCode: result.failed.length > 0
        ? 1
        : 0,
      summary: `@${account}：下载 ${result.downloaded}，跳过 ${result.skipped}，失败 ${result.failed.length} → ${result.cdnFile}`,
    }
  },
}
