import { existsSync } from 'node:fs'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { convertDate } from '../../src/utils/date'

export const root = path.resolve(fileURLToPath(import.meta.url), '../../')

interface DirOptions {
  path: string
  user?: boolean
}

export function dir(options: string | DirOptions): string {
  let _path = ''

  if (typeof options !== 'string') {
    if (options.user) _path = path.resolve(os.homedir(), options.path)
    else _path = path.resolve(root, options.path)
  } else {
    if (path.isAbsolute(options)) _path = options
    else _path = path.resolve(root, options)
  }

  const _dir = path.dirname(_path)

  if (!existsSync(_dir)) {
    mkdir(_dir, { recursive: true })
  }

  return _path
}

export function baseDir(options: string | DirOptions) {
  const base = dir(options)

  return (sub: string) => dir(path.join(base, sub))
}

export async function writeJson(
  _file: string,
  _data: any,
  mode: 'write' | 'append' = 'write',
  indent = 2,
) {
  const file = dir(_file)
  let data = _data

  if (data instanceof Map) {
    data = Object.fromEntries([...data.entries()])
  } else if (data instanceof Set) {
    data = [...data]
  }

  if (mode === 'write') {
    data = JSON.stringify(data, null, indent)
    await writeFile(file, data)
  } else {
    data = `${JSON.stringify(data)},\n`
    await appendFile(file, data)
  }

  return file
}

export async function readJson<T = any>(_file: string, fallback?: T) {
  const file = dir(_file)

  try {
    const data = await readFile(file, 'utf-8').then(JSON.parse)
    convertDate(data)
    return data as T
  } catch {
    if (fallback) {
      console.warn(`${file} is invalid, using fallback.`)
      await writeJson(file, fallback)
      return fallback
    }

    throw new Error(`Invalid JSON data in ${file}`)
  }
}

export async function cachedData<T>(
  dest: string,
  getter: () => Promise<T>,
  force = false,
) {
  try {
    if (!force) return await readJson<T>(dest)
  } catch {
    // ignore
  }

  const data = await getter()
  await writeJson(dest, data)
  return data
}
