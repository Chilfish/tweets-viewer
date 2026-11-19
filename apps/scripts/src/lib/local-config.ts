import {
  applyLocalDefaults,
  isLocalDatabaseUrl,
  isLocalMode,
  LOCAL_DATABASE_URL,
  LOCAL_PROXY_ENDPOINT,
  parseDatabaseUrls,
} from '@tweets-viewer/shared'
import { ConfigError } from '../cli/exit'

export { isLocalDatabaseUrl, isLocalMode }

export const DEFAULT_LOCAL_DATABASE_URL = LOCAL_DATABASE_URL
export const DEFAULT_LOCAL_PROXY_ENDPOINT = LOCAL_PROXY_ENDPOINT
export const DEFAULT_CDN_BASE = 'https://s3.chilfish.top'

/** `LOCAL=1` 时把数据库变量切到本机；线上原样返回。 */
function normalizeEnv(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return applyLocalDefaults(env as Record<string, string | undefined>)
}

/**
 * 目标库地址：`DATABASE_URL` 第一个地址。
 *
 * 多地址用于每日抓取并发更新多个归档库，单命令只写主库。
 * `LOCAL=1` 时一律指向本机库，不会因为 `.env` 里还留着远程地址就写线上。
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const effective = normalizeEnv(env)
  const urls = parseDatabaseUrls(effective.DATABASE_URL)
  if (urls.length > 0) {
    return urls[0]!
  }
  throw new ConfigError('缺少环境变量 DATABASE_URL', {
    code: 'MISSING_ENV',
    hint: '在项目根目录 .env 里配置 DATABASE_URL，或设置 LOCAL=1 使用本机库',
    context: { name: 'DATABASE_URL' },
  })
}

/**
 * neon 驱动的 HTTP 地址。
 *
 * 本地库必须经 `/sql` 代理（neon-http 只说 HTTP，Postgres 只认 TCP），
 * 所以库地址是本机时，回落到本机代理。
 */
export function resolveNeonEndpoint(
  databaseUrl: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const effective = normalizeEnv(env)
  const configured = effective.NEON_HTTP_ENDPOINT?.trim()
  if (configured) {
    return configured
  }
  if (isLocalDatabaseUrl(databaseUrl)) {
    return DEFAULT_LOCAL_PROXY_ENDPOINT
  }
  return undefined
}

/** 媒体地址前缀，例如 `https://s3.chilfish.top`。 */
export function resolveCdnBase(env: NodeJS.ProcessEnv = process.env): string {
  return (env.IG_CDN_BASE?.trim() || DEFAULT_CDN_BASE).replace(/\/+$/, '')
}

/** 一行环境说明：模式 + 数据库主机/库名。不打印账号密码。 */
export function describeEnvironment(env: NodeJS.ProcessEnv = process.env): string {
  const effective = normalizeEnv(env)
  const mode = isLocalMode(env)
    ? '本地模式（LOCAL=1）'
    : '线上模式'
  const url = parseDatabaseUrls(effective.DATABASE_URL)[0]
  if (!url) {
    return `${mode} · 数据库未配置`
  }

  try {
    const parsed = new URL(url)
    return `${mode} · 数据库 ${parsed.hostname}${parsed.port
      ? `:${parsed.port}`
      : ''}${parsed.pathname}`
  }
  catch {
    return `${mode} · 数据库地址无法解析`
  }
}
