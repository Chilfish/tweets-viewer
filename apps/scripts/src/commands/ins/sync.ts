import type { CommandSpec } from '@chilfish/devkit/cli'
import { UsageError } from '@chilfish/devkit/cli'
import { Option } from 'commander'
import { getDb } from '../../lib/db'
import { syncInsAccounts } from '../../lib/ins-sync'

interface SyncData {
  accounts: number
  imported: number
  posts: number
  media: { downloaded: number, skipped: number, failed: number }
  upload: { uploaded: number, skipped: number, failed: number }
  failures: { account: string, error: string }[]
}

export const syncSpec: CommandSpec<SyncData> = {
  id: 'ins.sync',
  description: '每日增量：抓取已关联且 daily_fetch 开启的账号',
  details: '账号来源是 `users.ins_username`，不再是单独的映射表。\n'
    + '默认同步最近 2 天、下载并上传媒体；`--no-media` 只写数据（媒体链接会随签名过期），'
    + '`--no-upload` 只下载不上传。',
  examples: [
    'bun run ig ins sync',
    'bun run ig ins sync --since 2026-11-16T00:00:00Z',
    'bun run ig ins sync --account ritsu_mgmg',
  ],
  options: [
    new Option('--since <iso>', '起始时间，默认 2 天前'),
    new Option('--account <ins>', '只同步某个 IG 账号'),
    new Option('--no-media', '不下载媒体'),
    new Option('--no-upload', '只下载媒体，不上传'),
  ],
  async run(ctx) {
    const { db } = getDb()
    const since = ctx.options.since
      ? new Date(ctx.options.since as string)
      : undefined
    if (since && Number.isNaN(since.getTime())) {
      throw new UsageError(`--since 不是合法时间：${String(ctx.options.since)}`)
    }

    const account = ctx.options.account as string | undefined
    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将同步${account
        ? ` @${account}`
        : '每日抓取名单里的账号'}`)
      return {
        data: {
          accounts: 0,
          imported: 0,
          posts: 0,
          media: { downloaded: 0, skipped: 0, failed: 0 },
          upload: { uploaded: 0, skipped: 0, failed: 0 },
          failures: [],
        },
      }
    }

    const result = await syncInsAccounts(db, {
      since,
      account,
      media: ctx.options.media !== false,
      upload: ctx.options.upload !== false,
      log: ctx.log,
    })

    if (result.accounts === 0) {
      throw new UsageError(
        account
          ? `@${account} 不在每日抓取名单（检查 users.ins_username 与 daily_fetch）`
          : '没有可同步的账号：users 里 ins_username 为空，或 daily_fetch 全部关闭',
      )
    }

    return {
      data: result,
      exitCode: result.failures.length > 0
        ? 1
        : 0,
      summary: `同步完成：${result.imported}/${result.accounts} 个账号，${result.posts} 条帖子，失败 ${result.failures.length}`,
    }
  },
}
