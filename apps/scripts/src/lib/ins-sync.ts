import type { InstagramSDK } from '@chilfish/gallery-dl-instagram'
import type { DB } from '@tweets-viewer/database'
import type { Logger } from '../cli/logger'
import { getDailyFetchInsUsers } from '@tweets-viewer/database'
import { runExport, runImport, runMedia } from './pipeline'
import { openSession } from './session'

export interface SyncOptions {
  /** 起始时间，默认 2 天前 */
  since?: Date
  /** 只同步某个 IG 账号 */
  account?: string
  /** 是否下载并改写媒体，默认 true */
  media?: boolean
  log?: Logger
}

export interface SyncOutcome {
  accounts: number
  imported: number
  posts: number
  failures: { account: string, error: string }[]
}

const DEFAULT_SINCE_DAYS = 2

/**
 * 同步 `users` 里已关联 IG 且开启 daily_fetch 的账号。
 *
 * CLI 的 `ins sync` 与每日定时任务共用这一份实现，账号名单只有 DB 一个来源。
 */
export async function syncInsAccounts(
  db: DB,
  options: SyncOptions = {},
): Promise<SyncOutcome> {
  const all = await getDailyFetchInsUsers(db)
  const accounts = options.account
    ? all.filter(item => item.insUsername === options.account)
    : all

  if (accounts.length === 0) {
    return {
      accounts: 0,
      imported: 0,
      posts: 0,
      failures: [],
    }
  }

  const since = options.since ?? new Date(Date.now() - DEFAULT_SINCE_DAYS * 24 * 60 * 60 * 1000)
  const sdk = await openSession()
  return syncWithSession(sdk, db, accounts, { ...options, since })
}

async function syncWithSession(
  sdk: InstagramSDK,
  db: DB,
  accounts: { userName: string, insUsername: string }[],
  options: SyncOptions & { since: Date },
): Promise<SyncOutcome> {
  const failures: SyncOutcome['failures'] = []
  let imported = 0
  let posts = 0

  for (const account of accounts) {
    const log = options.log?.child(account.insUsername)
    try {
      const { exported } = await runExport(sdk, account.insUsername, { since: options.since, log })
      let payload = exported

      if (options.media !== false) {
        const media = await runMedia(account.insUsername, exported, { log })
        if (media.failed.length > 0) {
          log?.warn(`有 ${media.failed.length} 个媒体下载失败，本次仍写库`)
        }
        payload = media.cdn
      }
      else {
        log?.warn('未下载媒体：入库的是 Instagram 签名链接，过期后会 404')
      }

      const result = await runImport(db, payload, account.userName)
      imported++
      posts += result.total
      log?.info(`写入 ${result.inserted}/${result.total} 条 → @${account.userName}`)
    }
    catch (error) {
      const message = error instanceof Error
        ? error.message
        : String(error)
      failures.push({ account: account.insUsername, error: message })
      log?.error(message)
    }
  }

  return {
    accounts: accounts.length,
    imported,
    posts,
    failures,
  }
}
