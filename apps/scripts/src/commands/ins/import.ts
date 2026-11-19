import type { CommandSpec } from '../../cli/runtime'
import { existsSync } from 'node:fs'
import { Option } from 'commander'
import { UsageError } from '../../cli/exit'
import { getDb } from '../../lib/db'
import { loadExport, runImport } from '../../lib/pipeline'

interface ImportData {
  insUsername: string
  twitterUsername: string
  inserted: number
  total: number
}

export const importSpec: CommandSpec<ImportData> = {
  id: 'ins.import',
  description: '把导出 JSON 写入 users.ins_json_data 与 ins_posts',
  details: '`ins_posts.username` 是 twitter userName，所以 `users` 里必须已有这一行。\n'
    + '`--twitter` 省略时按 `users.ins_username` 反查。按 `post_id` upsert，可重复执行。',
  examples: [
    'bun run ig ins import data/ritsu_mgmg.cdn.json --twitter ritsu_yumemita',
    'bun run ig ins import data/ritsu_mgmg.cdn.json',
  ],
  arguments: [
    { name: 'file', description: '导出 JSON（入库用 .cdn.json）' },
  ],
  options: [
    new Option('--twitter <name>', '目标 users.userName'),
  ],
  async run(ctx) {
    const file = ctx.args[0]
    if (!file) {
      throw new UsageError('缺少 JSON 路径', { hint: '示例：bun run ig ins import data/ritsu_mgmg.cdn.json' })
    }
    if (!existsSync(file)) {
      throw new UsageError(`文件不存在：${file}`)
    }

    const exported = await loadExport(file)
    const insUsername = exported.user.userName
    const twitter = ctx.options.twitter as string | undefined
    const { db } = getDb()

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将 @${insUsername} 的 ${exported.posts.length} 条帖子写入 users 与 ins_posts`)
      return {
        data: {
          insUsername,
          twitterUsername: twitter ?? '',
          inserted: 0,
          total: exported.posts.length,
        },
      }
    }

    const result = await runImport(db, exported, twitter)
    ctx.log.info(`@${insUsername} → twitter @${result.twitterUsername}`)
    ctx.log.info(`写入 ${result.inserted}/${result.total} 条`)

    return {
      data: { insUsername, ...result },
      summary: `@${insUsername} → @${result.twitterUsername}：${result.inserted}/${result.total} 条帖子`,
    }
  },
}
