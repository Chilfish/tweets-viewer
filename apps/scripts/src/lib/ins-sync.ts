import type { Logger } from '@chilfish/devkit/cli'
import type { DB } from '@tweets-viewer/database'
import type { IgSession } from './instagram'
import { getDailyFetchInsUsers } from '@tweets-viewer/database'
import { runExport, runImport, runMedia } from './pipeline'
import { openSession } from './session'
import { hasStorageCredentials, uploadAccountMedia } from './upload'

export interface SyncOptions {
  /** 起始时间，默认 2 天前 */
  since?: Date
  /** 只同步某个 IG 账号 */
  account?: string
  /** 是否下载并改写媒体，默认 true */
  media?: boolean
  /** 是否上传媒体，默认 true（没有对象存储凭据时记为失败） */
  upload?: boolean
  log?: Logger
}

export interface SyncOutcome {
  accounts: number
  imported: number
  posts: number
  media: { downloaded: number, skipped: number, failed: number }
  upload: { uploaded: number, skipped: number, failed: number }
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
      media: { downloaded: 0, skipped: 0, failed: 0 },
      upload: { uploaded: 0, skipped: 0, failed: 0 },
      failures: [],
    }
  }

  const since = options.since ?? new Date(Date.now() - DEFAULT_SINCE_DAYS * 24 * 60 * 60 * 1000)
  const session = await openSession()
  return syncWithSession(session, db, accounts, { ...options, since })
}

async function syncWithSession(
  session: IgSession,
  db: DB,
  accounts: { userName: string, insUsername: string }[],
  options: SyncOptions & { since: Date },
): Promise<SyncOutcome> {
  const failures: SyncOutcome['failures'] = []
  const media = { downloaded: 0, skipped: 0, failed: 0 }
  const upload = { uploaded: 0, skipped: 0, failed: 0 }
  let imported = 0
  let posts = 0

  for (const account of accounts) {
    const log = options.log?.child(account.insUsername)
    try {
      const { exported } = await runExport(session, account.insUsername, { since: options.since, log })
      let payload = exported

      if (options.media !== false) {
        const mediaResult = await runMedia(account.insUsername, exported, { log })
        media.downloaded += mediaResult.downloaded
        media.skipped += mediaResult.skipped
        media.failed += mediaResult.failed.length
        if (mediaResult.failed.length > 0) {
          log?.warn(`有 ${mediaResult.failed.length} 个媒体下载失败，本次仍写库`)
        }
        payload = mediaResult.cdn

        if (options.upload !== false) {
          if (!hasStorageCredentials()) {
            const message = '没有对象存储凭据，媒体未上传'
            failures.push({ account: account.insUsername, error: message })
            log?.error(message)
          }
          else {
            const uploadResult = await uploadAccountMedia(account.insUsername, { log })
            upload.uploaded += uploadResult.uploaded
            upload.skipped += uploadResult.skipped
            upload.failed += uploadResult.failed.length
            if (uploadResult.failed.length > 0) {
              failures.push({
                account: account.insUsername,
                error: `媒体上传失败 ${uploadResult.failed.length} 个`,
              })
            }
          }
        }
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
    media,
    upload,
    failures,
  }
}
