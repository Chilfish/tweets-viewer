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
