#!/usr/bin/env bun
/**
 * `bun run dev` 的前置：本地模式下准备 Postgres、`/sql` 代理与本机对象存储。
 *
 * 线上模式（未设 LOCAL=1）直接跳过，不启动任何本地服务。
 * Postgres 与代理是后台进程，dev 退出后继续运行；再次 `bun run dev` 会复用。
 * 对象存储缺失不阻塞读库，只影响上传与图片。
 */
import {
  applyMigrations,
  ensureDevDatabase,
  ensurePostgresRunning,
  ensureProxyRunning,
} from './src/lib/dev-services'
import { ensureSiloRunning } from './src/lib/dev-storage'
import { loadEnv } from './src/lib/env'
import { isLocalMode, resolveDatabaseUrl, resolveNeonEndpoint, resolveStorage } from './src/lib/local-config'

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

try {
  const silo = await ensureSiloRunning()
  if (!silo.started) {
    console.warn(`[dev] 本地对象存储未启动：${silo.reason}`)
    console.warn(`[dev] 读库不受影响；上传与图片需要它（公开地址 ${resolveStorage().publicBase}）`)
  }
}
catch (error) {
  console.warn(`[dev] 本地对象存储启动失败：${error instanceof Error
    ? error.message
    : String(error)}`)
}
