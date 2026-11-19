#!/usr/bin/env bun
import { applyMigrations, ensureDevDatabase, ensurePostgresRunning, ensureProxyRunning } from './src/lib/dev-services'
/**
 * `bun run dev` 的前置：本地模式下准备 Postgres 与本机 `/sql` 代理。
 *
 * 线上模式（未设 LOCAL=1）直接跳过，不启动任何本地服务。
 * 代理是后台进程，dev 退出后继续运行；再次 `bun run dev` 会复用。
 */
import { loadEnv } from './src/lib/env'
import { isLocalMode, resolveDatabaseUrl, resolveNeonEndpoint } from './src/lib/local-config'

loadEnv()

if (!isLocalMode()) {
  console.log('[dev] 线上模式（LOCAL 未设置），跳过本地数据库与代理')
  process.exit(0)
}

const databaseUrl = resolveDatabaseUrl()
const endpoint = resolveNeonEndpoint(databaseUrl)

if (!endpoint) {
  console.error('[dev] LOCAL=1 但没有可用的 NEON_HTTP_ENDPOINT')
  process.exit(1)
}

try {
  ensurePostgresRunning()
  await ensureDevDatabase(databaseUrl)
  await applyMigrations(databaseUrl)
  await ensureProxyRunning(endpoint, databaseUrl)
}
catch (error) {
  console.error(`[dev] 本地环境准备失败：${error instanceof Error
    ? error.message
    : String(error)}`)
  console.error('排查见 docs/engineering/local-database.md')
  process.exit(1)
}
