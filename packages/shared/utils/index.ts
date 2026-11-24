export * from './date'

export function uniqueObj<T extends Record<string, any>[]>(
  arr: T,
  key: string,
) {
  const map = new Map()
  arr.forEach((item) => {
    map.set(item[key], item)
  })
  return Array.from(map.values()) as T
}

export function mergeData<T, K extends keyof T>(
  oldData: T[],
  newData: T[],
  key: K,
): T[] {
  const dataMap = new Map<T[K], T>()

  // Add keys from oldData without overwriting
  for (const item of oldData) {
    if (!dataMap.has(item[key])) {
      dataMap.set(item[key], item)
    }
  }

  // Add or replace with newData
  for (const item of newData) {
    dataMap.set(item[key], item)
  }

  return Array.from(dataMap.values())
}

export function tweetUrl(id: string, name = 'i') {
  return `https://twitter.com/${name}/status/${id}`
}

export function snowId2millis(id: string) {
  return (BigInt(id) >> BigInt(22)) + BigInt(1288834974657)
}

export function pubTime(id: string) {
  return new Date(Number(snowId2millis(id)))
}

/**
 * 解析逗号分隔的连接串列表（`DATABASE_URL` 多地址）。
 *
 * 去首尾空白、丢弃空项、按首次出现去重（同一个库不会被抓两遍）。
 * 地址本身若含逗号，需写成 `%2C`（与 `TWEET_KEYS` 的 CSV 约定一致）。
 */
export function parseDatabaseUrls(raw: string | null | undefined): string[] {
  if (!raw)
    return []

  const seen = new Set<string>()
  const urls: string[] = []

  for (const part of raw.split(',')) {
    const url = part.trim()
    if (!url || seen.has(url))
      continue
    seen.add(url)
    urls.push(url)
  }

  return urls
}

/** 本地开发模式总开关：`LOCAL=1` / `true` / `yes`。 */
export const LOCAL_DATABASE_URL = 'postgres://postgres@localhost:5432/tweets_dev'
// 4444 会被同机的其他 devkit 项目占用，本项目固定 4445。
export const LOCAL_PROXY_ENDPOINT = 'http://127.0.0.1:4445/sql'

export function isLocalMode(env: Record<string, string | undefined> = process.env): boolean {
  const value = (env.LOCAL ?? '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes'
}

/** 只认本机地址：localhost / 127.0.0.1 / ::1 / 0.0.0.0。 */
export function isLocalDatabaseUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return [
      'localhost',
      '127.0.0.1',
      '::1',
      '0.0.0.0',
    ].includes(hostname)
  }
  catch {
    return false
  }
}

/**
 * 本地模式下把数据库相关变量切到本机。
 *
 * `LOCAL=1` 的语义是「只动本机库」，因此显式配了远程地址也会被替换；
 * 已经是本机地址（含自定义端口）时保持原样。线上原样返回。
 */
export function applyLocalDefaults(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  if (!isLocalMode(env))
    return env

  const next = { ...env }
  const databaseUrl = parseDatabaseUrls(next.DATABASE_URL)[0] ?? ''
  if (!isLocalDatabaseUrl(databaseUrl))
    next.DATABASE_URL = LOCAL_DATABASE_URL

  const endpoint = next.NEON_HTTP_ENDPOINT?.trim() ?? ''
  if (!isLocalDatabaseUrl(endpoint))
    next.NEON_HTTP_ENDPOINT = LOCAL_PROXY_ENDPOINT

  return next
}
