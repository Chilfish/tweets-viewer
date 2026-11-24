import type { Logger } from '@chilfish/devkit/cli'
import type { SelectUser } from '@tweets-viewer/database'
import { ConfigError } from '@chilfish/devkit/cli'
import { createDb, getUserRows } from '@tweets-viewer/database'
import { resolveRemoteDatabaseUrl } from './local-config'

/**
 * 从线上库读取 `users` 整表。
 *
 * 必须在创建本机库连接之前调用：`createDb` 会把本机 `/sql` 代理写进
 * neon 的全局配置，之后再建远端连接会被劫持到本机。
 */
export async function fetchRemoteUserRows(
  options: { remoteUrl?: string, log?: Logger } = {},
): Promise<SelectUser[]> {
  const remoteUrl = options.remoteUrl ?? resolveRemoteDatabaseUrl()
  if (!remoteUrl) {
    throw new ConfigError('缺少线上库地址，无法同步线上用户表', {
      code: 'MISSING_ENV',
      hint: '在 .env.prod 里配置 DATABASE_URL，或加 --no-sync-users 只用本地账号',
      context: { name: 'DATABASE_URL', file: '.env.prod' },
    })
  }

  const remoteDb = createDb({ url: remoteUrl })
  const rows = await getUserRows(remoteDb)
  options.log?.info(`已从线上读取 ${rows.length} 个用户`)

  return rows
}
