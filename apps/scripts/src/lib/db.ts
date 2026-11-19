import type { DB } from '@tweets-viewer/database'
import { createDb } from '@tweets-viewer/database'
import { resolveDatabaseUrl, resolveNeonEndpoint } from './local-config'

export interface ResolvedDb {
  db: DB
  url: string
  endpoint?: string
}

/** 按环境变量建库连接；本地地址自动带上 `/sql` 代理地址。 */
export function getDb(): ResolvedDb {
  const url = resolveDatabaseUrl()
  const endpoint = resolveNeonEndpoint(url)
  return {
    db: createDb({ url, endpoint }),
    url,
    endpoint,
  }
}
