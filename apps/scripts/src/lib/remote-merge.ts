import type { Logger } from '@chilfish/devkit/cli'
import type { DB } from '@tweets-viewer/database'
import { ConfigError, UsageError } from '@chilfish/devkit/cli'
import {
  createDb,
  getInsPostRows,
  getUserRows,
  mergeInsPostRows,
  upsertUserRows,
} from '@tweets-viewer/database'
import { resolveRemoteDatabaseUrl } from './local-config'

export interface RemoteMergeOptions {
  /** 只合并某个 IG 账号 */
  account?: string
  remoteUrl?: string
  log?: Logger
}

export interface RemoteMergeOutcome {
  users: number
  posts: number
  inserted: number
  skipped: number
}

/**
 * 把线上 `users` 与 `ins_posts` 合并到本地。
 *
 * 远端连接在 `createLocalDb()` 之前建立：本机库初始化会把 neon 的全局
 * `fetchEndpoint` 改成 `/sql` 代理，之后再建远端连接会被劫持到本机。
 * 帖子按 `post_id` 冲突时保留本地行，本地数据优先。
 */
export async function mergeRemoteArchive(
  options: RemoteMergeOptions,
  createLocalDb: () => DB,
): Promise<RemoteMergeOutcome> {
  const remoteUrl = options.remoteUrl ?? resolveRemoteDatabaseUrl()
  if (!remoteUrl) {
    throw new ConfigError('缺少线上库地址，无法读取线上归档', {
      code: 'MISSING_ENV',
      hint: '在 .env.prod 里配置 DATABASE_URL',
      context: { name: 'DATABASE_URL', file: '.env.prod' },
    })
  }

  const remoteDb = createDb({ url: remoteUrl })
  const users = await getUserRows(remoteDb)
  let posts = await getInsPostRows(remoteDb)

  if (options.account) {
    const owner = users.find(user => user.insUsername === options.account)
    if (!owner) {
      throw new UsageError(`@${options.account} 不在线上 users.ins_username`, {
        hint: '检查账号名，或先同步线上用户表',
      })
    }
    posts = posts.filter(post => post.userId === owner.userName)
  }

  const localDb = createLocalDb()
  await upsertUserRows({ db: localDb, rows: users })
  const merged = await mergeInsPostRows({ db: localDb, rows: posts })

  options.log?.info(
    `线上 ${users.length} 个用户、${posts.length} 条帖子；新增 ${merged.inserted}，`
    + `保留本地 ${merged.skipped}`,
  )

  return {
    users: users.length,
    posts: posts.length,
    ...merged,
  }
}
