import type { Logger } from '@chilfish/devkit/cli'
import type { DB } from '@tweets-viewer/database'
import type { IgSession } from './instagram'
import type { VerifyCheck } from './pipeline'
import { setTimeout as sleep } from 'node:timers/promises'
import { getInsPostCounts, getLinkedInsUsers } from '@tweets-viewer/database'
import { resolveOnlineCdnBase } from './local-config'
import { runExport, runImport, runMedia, runVerify } from './pipeline'
import { openSession } from './session'
import { hasStorageCredentials, uploadAccountMedia } from './upload'

export interface RefreshOptions {
  /** 只刷新某个 IG 账号 */
  account?: string
  /** 抓取子类，默认 `posts,reels` */
  include?: string
  /** 是否下载并上传媒体，默认 true */
  media?: boolean
  /** 是否下载媒体；false 时只把链接改写成线上 CDN */
  download?: boolean
  /** 媒体下载与上传并发数 */
  concurrency?: number
  /** 只跑本地帖子数小于资料 posts_count 的账号 */
  missing?: boolean
  /** 账号之间的等待时间 */
  delayMs?: number
  /** 单个账号失败后的重试次数 */
  retry?: number
  /** 重试退避基数，按次数线性增长 */
  retryDelayMs?: number
  log?: Logger
}

export interface RefreshAccount {
  insUsername: string
  twitterUsername: string
  posts: number
  inserted: number
  media: { downloaded: number, skipped: number, failed: number }
  upload: { uploaded: number, skipped: number, failed: number }
  checks: VerifyCheck[]
  ok: boolean
}

export interface RefreshOutcome {
  accounts: number
  succeeded: number
  posts: number
  inserted: number
  failures: { account: string, error: string }[]
  results: RefreshAccount[]
}

/**
 * 全量拉齐已关联 IG 的账号。
 *
 * 与 `ins sync` 的区别：不看 `daily_fetch`、不带 `since`，每个账号抓全部帖子。
 * 账号之间互不影响，单个失败记进 `failures` 后继续跑完。
 */
export async function refreshInsAccounts(
  db: DB,
  options: RefreshOptions = {},
): Promise<RefreshOutcome> {
  const all = await getLinkedInsUsers(db)
  let accounts = options.account
    ? all.filter(item => item.insUsername === options.account)
    : all

  if (options.missing) {
    const counts = await getInsPostCounts(db)
    accounts = accounts.filter((account) => {
      const local = counts.get(account.userName) ?? 0
      return local === 0 || local < account.postsCount
    })
  }

  const outcome: RefreshOutcome = {
    accounts: accounts.length,
    succeeded: 0,
    posts: 0,
    inserted: 0,
    failures: [],
    results: [],
  }

  if (accounts.length === 0) {
    return outcome
  }

  const session = await openSession()
  const retries = options.retry ?? 0

  for (const [index, account] of accounts.entries()) {
    if (index > 0 && options.delayMs) {
      await sleep(options.delayMs)
    }

    const log = options.log?.child(account.insUsername)
    let attempt = 0

    while (true) {
      try {
        const result = await refreshAccount(session, db, account, options, log)
        outcome.posts += result.posts
        outcome.inserted += result.inserted
        outcome.results.push(result)
        if (result.ok) {
          outcome.succeeded++
        }
        if (result.media.failed > 0) {
          outcome.failures.push({
            account: account.insUsername,
            error: `媒体下载失败 ${result.media.failed} 个`,
          })
        }
        if (result.upload.failed > 0) {
          outcome.failures.push({
            account: account.insUsername,
            error: `媒体上传失败 ${result.upload.failed} 个`,
          })
        }
        break
      }
      catch (error) {
        const message = error instanceof Error
          ? error.message
          : String(error)

        if (attempt < retries) {
          attempt++
          const wait = (options.retryDelayMs ?? 30_000) * attempt
          log?.warn(`${message}；${Math.round(wait / 1000)}s 后重试（${attempt}/${retries}）`)
          await sleep(wait)
          continue
        }

        outcome.failures.push({ account: account.insUsername, error: message })
        log?.error(message)
        break
      }
    }
  }

  return outcome
}

async function refreshAccount(
  session: IgSession,
  db: DB,
  account: { userName: string, insUsername: string },
  options: RefreshOptions,
  log?: Logger,
): Promise<RefreshAccount> {
  const { exported } = await runExport(session, account.insUsername, {
    include: options.include,
    log,
  })

  let payload = exported
  const media = { downloaded: 0, skipped: 0, failed: 0 }
  const upload = { uploaded: 0, skipped: 0, failed: 0 }
  let uploaded = false

  if (options.media !== false) {
    const download = options.download !== false
    const mediaResult = await runMedia(account.insUsername, exported, {
      concurrency: options.concurrency,
      download,
      cdnBase: download
        ? undefined
        : resolveOnlineCdnBase(),
      log,
    })
    media.downloaded = mediaResult.downloaded
    media.skipped = mediaResult.skipped
    media.failed = mediaResult.failed.length
    payload = mediaResult.cdn

    if (!download) {
      log?.info('未下载媒体：入库链接指向线上 CDN')
    }
    else if (hasStorageCredentials()) {
      const uploadResult = await uploadAccountMedia(account.insUsername, {
        concurrency: options.concurrency,
        log,
      })
      upload.uploaded = uploadResult.uploaded
      upload.skipped = uploadResult.skipped
      upload.failed = uploadResult.failed.length
      uploaded = true
    }
    else {
      log?.warn('没有对象存储凭据，跳过上传；入库的媒体链接可能不可达')
    }
  }

  const imported = await runImport(db, payload, account.userName)
  const canCheckMedia = uploaded && media.failed === 0 && upload.failed === 0
  const verify = await runVerify(db, imported.twitterUsername, { checkMedia: canCheckMedia })

  for (const check of verify.checks) {
    log?.line(`${check.ok ? '✓' : '✗'} ${check.name}${check.detail
      ? `：${check.detail}`
      : ''}`)
  }

  const ok = verify.checks.every(check => check.ok) && media.failed === 0 && upload.failed === 0
  log?.info(`@${account.insUsername} → @${imported.twitterUsername}：${imported.inserted}/${imported.total} 条${ok
    ? '，对账通过'
    : '，对账未通过'}`)

  return {
    insUsername: account.insUsername,
    twitterUsername: imported.twitterUsername,
    posts: exported.posts.length,
    inserted: imported.inserted,
    media,
    upload,
    checks: verify.checks,
    ok,
  }
}
