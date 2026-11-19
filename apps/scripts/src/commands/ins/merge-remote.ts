import type { CommandSpec } from '@chilfish/devkit/cli'
import { UsageError } from '@chilfish/devkit/cli'
import { Option } from 'commander'
import { getDb } from '../../lib/db'
import { isLocalMode } from '../../lib/local-config'
import { mergeRemoteArchive } from '../../lib/remote-merge'

interface MergeRemoteData {
  users: number
  posts: number
  inserted: number
  skipped: number
}

export const mergeRemoteSpec: CommandSpec<MergeRemoteData> = {
  id: 'ins.merge-remote',
  description: '把线上 users 与 ins_posts 合并到本地（post_id 冲突保留本地）',
  details: '只用于 `LOCAL=1`：先读 `DATABASE_URL_REMOTE` 的整张 `users` 与 `ins_posts`，\n'
    + '再 upsert 到本机库。同一条帖子本地已存在时跳过，不覆盖本地行。\n'
    + '适合 IG 抓取被限流时先把线上归档补到本地。',
  examples: [
    'LOCAL=1 bun run ig ins merge-remote',
    'LOCAL=1 bun run ig ins merge-remote --account ritsu_mgmg',
  ],
  options: [
    new Option('--account <ins>', '只合并某个 IG 账号'),
  ],
  async run(ctx) {
    const account = ctx.options.account as string | undefined

    if (!isLocalMode(process.env)) {
      throw new UsageError('merge-remote 只在本地模式使用', {
        hint: '设置 LOCAL=1 后再跑',
      })
    }

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将把线上${account
        ? ` @${account} 的`
        : '全部'} users 与 ins_posts 合并到本地（本地优先）`)
      return {
        data: {
          users: 0,
          posts: 0,
          inserted: 0,
          skipped: 0,
        },
      }
    }

    const result = await mergeRemoteArchive(
      { account, log: ctx.log },
      () => getDb().db,
    )

    return {
      data: result,
      summary: `合并完成：${result.users} 个用户、${result.posts} 条帖子，`
        + `新增 ${result.inserted} 条，保留本地 ${result.skipped} 条`,
    }
  },
}
