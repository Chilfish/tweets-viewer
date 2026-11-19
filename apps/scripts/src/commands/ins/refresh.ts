import type { CommandSpec } from '@chilfish/devkit/cli'
import type { SelectUser } from '@tweets-viewer/database'
import type { RefreshAccount } from '../../lib/ins-refresh'
import { UsageError } from '@chilfish/devkit/cli'
import { upsertUserRows } from '@tweets-viewer/database'
import { Option } from 'commander'
import { getDb } from '../../lib/db'
import { refreshInsAccounts } from '../../lib/ins-refresh'
import { isLocalMode } from '../../lib/local-config'
import { fetchRemoteUserRows } from '../../lib/user-sync'

interface RefreshData {
  usersSynced: number
  accounts: number
  succeeded: number
  posts: number
  inserted: number
  failures: { account: string, error: string }[]
  results: RefreshAccount[]
}

export const refreshSpec: CommandSpec<RefreshData> = {
  id: 'ins.refresh',
  description: '全量拉齐所有已关联 IG 账号：抓取 → 媒体 → 上传 → 入库 → 对账',
  details: '账号来源是 `users.ins_username`，不要求 `daily_fetch`；不带 since，抓取全部帖子。\n'
    + 'LOCAL=1 时默认先从 `DATABASE_URL_REMOTE` 同步 `users` 表，保证账号名单与线上一致；'
    + '`--no-sync-users` 可跳过。\n'
    + '单个账号失败会记入 `failures` 并继续，最后退出码为 1。默认下载并上传媒体；'
    + '`--no-download` 只同步数据并把链接改写成线上 CDN，`--no-media` 连媒体字段都不改写。',
  examples: [
    'LOCAL=1 bun run ig ins refresh',
    'bun run ig ins refresh --no-download',
    'bun run ig ins refresh --no-download --missing',
    'bun run ig ins refresh --missing --delay 30 --retry 2',
    'bun run ig ins refresh --account ritsu_mgmg',
  ],
  options: [
    new Option('--account <ins>', '只刷新某个 IG 账号'),
    new Option('--missing', '只跑本地帖子数少于资料 posts_count 的账号'),
    new Option('--include <list>', '抓取子类，默认 posts,reels'),
    new Option('--no-media', '不处理媒体（链接仍是 IG 签名地址）'),
    new Option('--no-download', '只同步数据：不下载媒体，链接改写为线上 CDN'),
    new Option('--no-sync-users', '不先从线上同步 users 表'),
    new Option('--concurrency <n>', '媒体下载与上传并发数，默认 8'),
    new Option('--delay <seconds>', '账号之间的等待秒数，默认 0'),
    new Option('--retry <n>', '单个账号失败后的重试次数，默认 0'),
    new Option('--retry-delay <seconds>', '重试退避基数秒，默认 30'),
  ],
  async run(ctx) {
    const account = ctx.options.account as string | undefined
    const syncUsers = isLocalMode(process.env) && ctx.options.syncUsers !== false

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：${syncUsers
        ? '先同步线上用户表，再'
        : ''}全量刷新${account
        ? ` @${account}`
        : '所有已关联 IG 账号'}`)
      return {
        data: {
          usersSynced: 0,
          accounts: 0,
          succeeded: 0,
          posts: 0,
          inserted: 0,
          failures: [],
          results: [],
        },
      }
    }

    // 远端连接必须先建：本机库初始化会把 neon 的全局端点改成 /sql 代理。
    let pendingUsers: SelectUser[] = []
    if (syncUsers) {
      pendingUsers = await fetchRemoteUserRows({ log: ctx.log })
    }

    const { db } = getDb()
    if (pendingUsers.length > 0) {
      await upsertUserRows({ db, rows: pendingUsers })
      ctx.log.info(`已写入本地 ${pendingUsers.length} 个用户`)
    }
    const usersSynced = pendingUsers.length

    const result = await refreshInsAccounts(db, {
      account,
      include: ctx.options.include as string | undefined,
      media: ctx.options.media !== false,
      download: ctx.options.download !== false,
      concurrency: ctx.integer('concurrency', 8, 1),
      missing: Boolean(ctx.options.missing),
      delayMs: ctx.integer('delay', 0) * 1000,
      retry: ctx.integer('retry', 0),
      retryDelayMs: ctx.integer('retryDelay', 30, 1) * 1000,
      log: ctx.log,
    })

    if (result.accounts === 0) {
      if (!account && ctx.options.missing) {
        return {
          data: { usersSynced, ...result },
          summary: '没有需要补齐的账号：本地帖子数已不低于资料 posts_count',
        }
      }
      throw new UsageError(
        account
          ? `@${account} 不在已关联账号（检查 users.ins_username）`
          : '没有已关联的 IG 账号：先在 users.ins_username 登记',
      )
    }

    return {
      data: { usersSynced, ...result },
      exitCode: result.failures.length > 0
        ? 1
        : 0,
      summary: `${usersSynced > 0
        ? `用户表同步 ${usersSynced} 个；`
        : ''}刷新完成：${result.succeeded}/${result.accounts} 个账号，`
        + `${result.inserted}/${result.posts} 条帖子，失败 ${result.failures.length}`,
    }
  },
}
