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

/** 本地对象存储（SILO / MinIO）默认值，与 yumemita-stream-dashboard 保持一致。 */
export const DEFAULT_LOCAL_S3_ENDPOINT = 'http://127.0.0.1:9000'
export const DEFAULT_LOCAL_S3_ACCESS_KEY = 'silo-admin'
export const DEFAULT_LOCAL_S3_SECRET_KEY = 'silo-admin'
export const DEFAULT_LOCAL_BUCKET = 'tweets-viewer'

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

/** 本地对象存储端点，默认 `http://127.0.0.1:9000`。 */
export function localStorageEndpoint(env: NodeJS.ProcessEnv = process.env): string {
  return (env.S3_ENDPOINT ?? env.MINIO_ENDPOINT ?? DEFAULT_LOCAL_S3_ENDPOINT).replace(/\/+$/, '')
}

/** 本地桶的匿名读地址：path-style，`<endpoint>/<bucket>`。 */
export function localStoragePublicBase(env: NodeJS.ProcessEnv = process.env): string {
  const bucket = env.R2_BUCKET ?? DEFAULT_LOCAL_BUCKET
  return `${localStorageEndpoint(env)}/${bucket}`
}

export interface StorageConfig {
  local: boolean
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  /** 匿名读地址；写媒体链接时用它。 */
  publicBase: string
}

/** 上传目标：`LOCAL=1` 用本机 SILO，否则用 R2（或通用 S3）。 */
export function resolveStorage(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  if (isLocalMode(env)) {
    return {
      local: true,
      endpoint: localStorageEndpoint(env),
      accessKeyId: env.S3_ACCESS_KEY_ID ?? env.MINIO_ROOT_USER ?? DEFAULT_LOCAL_S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? env.MINIO_ROOT_PASSWORD ?? DEFAULT_LOCAL_S3_SECRET_KEY,
      bucket: env.R2_BUCKET ?? DEFAULT_LOCAL_BUCKET,
      publicBase: localStoragePublicBase(env),
    }
  }

  const accountId = env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() ?? env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() ?? env.S3_SECRET_ACCESS_KEY?.trim()
  const bucket = env.R2_BUCKET?.trim() ?? env.S3_BUCKET_NAME?.trim()
  const endpoint = accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : env.S3_ENDPOINT?.trim()?.replace(/\/+$/, '')

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new ConfigError('缺少对象存储凭据，无法上传', {
      code: 'MISSING_ENV',
      hint: '配置 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET，'
        + '或设置 LOCAL=1 用本机 SILO（bun run ig dev storage）',
      context: {
        missing: [
          !endpoint && 'R2_ACCOUNT_ID 或 S3_ENDPOINT',
          !accessKeyId && 'R2_ACCESS_KEY_ID 或 S3_ACCESS_KEY_ID',
          !secretAccessKey && 'R2_SECRET_ACCESS_KEY 或 S3_SECRET_ACCESS_KEY',
          !bucket && 'R2_BUCKET 或 S3_BUCKET_NAME',
        ].filter(Boolean),
      },
    })
  }

  return {
    local: false,
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBase: (env.IG_CDN_BASE?.trim() || DEFAULT_CDN_BASE).replace(/\/+$/, ''),
  }
}

/** 媒体地址前缀：本地模式指向本机桶，线上用 `IG_CDN_BASE`。 */
export function resolveCdnBase(env: NodeJS.ProcessEnv = process.env): string {
  if (isLocalMode(env)) {
    return localStoragePublicBase(env)
  }
  return (env.IG_CDN_BASE?.trim() || DEFAULT_CDN_BASE).replace(/\/+$/, '')
}

/** 一行环境说明：模式 + 数据库主机/库名（+ 本地对象存储）。不打印账号密码。 */
export function describeEnvironment(env: NodeJS.ProcessEnv = process.env): string {
  const effective = normalizeEnv(env)
  const mode = isLocalMode(env)
    ? '本地模式（LOCAL=1）'
    : '线上模式'
  const url = parseDatabaseUrls(effective.DATABASE_URL)[0]
  const storage = isLocalMode(env)
    ? ` · 对象存储 ${localStoragePublicBase(env)}`
    : ''
  if (!url) {
    return `${mode} · 数据库未配置${storage}`
  }

  try {
    const parsed = new URL(url)
    return `${mode} · 数据库 ${parsed.hostname}${parsed.port
      ? `:${parsed.port}`
      : ''}${parsed.pathname}${storage}`
  }
  catch {
    return `${mode} · 数据库地址无法解析${storage}`
  }
}
