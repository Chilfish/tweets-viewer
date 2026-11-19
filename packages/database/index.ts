import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export type DB = ReturnType<typeof drizzle<typeof schema>>

/**
 * 建立 Neon HTTP 连接。
 *
 * `endpoint` 用于本地开发：把 neon 驱动的 `/sql` 地址指到本机代理，
 * 这样 `DB` 类型与查询代码在本地和线上完全一致。
 */
export function createDb({ url, endpoint }: { url: string, endpoint?: string }): DB {
  if (!url) {
    throw new Error('DATABASE_URL 未配置：线上请用 `wrangler secret put DATABASE_URL` 写入')
  }
  if (endpoint) {
    neonConfig.fetchEndpoint = endpoint
  }
  return drizzle({
    client: neon(url),
    schema,
  })
}

export * from './modules/ins'
export * from './modules/tweet'
export * from './modules/user'
export {
  schema,
}
