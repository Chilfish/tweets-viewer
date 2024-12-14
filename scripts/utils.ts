import { existsSync } from 'node:fs'
import {
  appendFile,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

export const root = path.resolve(fileURLToPath(import.meta.url), '../../')

interface DirOptions {
  path: string
  root?: boolean
  user?: boolean
}

export function dir(options: string | DirOptions): string {
  let _path = ''

  if (typeof options !== 'string') {
    if (options.root)
      _path = path.resolve(root, options.path)
    else if (options.user)
      _path = path.resolve(os.homedir(), options.path)
    else
      _path = path.resolve(options.path)
  }
  else {
    if (path.isAbsolute(options))
      _path = options
    else
      _path = path.resolve(root, options)
  }

  const isFile = !!_path.split('/').at(-1)?.includes('.')
  const _dir = isFile ? path.dirname(_path) : _path

  if (!existsSync(_dir)) {
    mkdir(_dir, { recursive: true })
  }

  return _path
}

export async function writeJson(
  file: string,
  data: any,
  mode: 'write' | 'append' = 'write',
  indent = 2,
) {
  file = dir(file)

  if (data instanceof Map) {
    data = Object.fromEntries([...data.entries()])
  }
  else if (data instanceof Set) {
    data = [...data]
  }

  if (mode === 'write') {
    data = JSON.stringify(data, null, indent)
    await writeFile(file, data)
  }
  else {
    data = `${JSON.stringify(data)},\n`
    await appendFile(file, data)
  }

  return file
}

export async function readJson<T = any>(
  file: string,
  fallback?: T,
) {
  file = dir(file)

  try {
    const data = await readFile(file, 'utf-8')
    return JSON.parse(data) as T
  }
  catch {
    if (fallback) {
      console.warn(`${file} is invalid, using fallback.`)
      await writeJson(file, fallback)
      return fallback
    }

    throw new Error('Invalid JSON data.')
  }
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
