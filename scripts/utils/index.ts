import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import 'dotenv/config'

export * from './download'
export * from './files'

export function createDb() {
  const {
    DATABASE_URL,
  } = process.env

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.')
  }

  const client = neon(DATABASE_URL)
  return drizzle({ client })
}

export function uniqueObj<T extends Record<string, any>[]>(arr: T, key: string) {
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
 * Check if the script is not imported
 * like if __name__ == '__main__' in Python
 *
 * @example
 * ```ts
 * isNotInImport(import.meta.filename)
 * ```
 */
export function isNotInImport(importMetaFilename: string) {
  const [_tsx, argFile] = process.argv

  return path.resolve(importMetaFilename) === path.resolve(argFile)
}
