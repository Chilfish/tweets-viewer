import type { PQueueOptions } from '../../src/utils/promise'
import { createWriteStream, existsSync } from 'node:fs'
import { utimes } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { consola } from 'consola'
import { PQueue } from '../../src/utils/promise'
import { dir } from './files'

const streamPipeline = promisify(pipeline)

export interface DownloadFileInfo {
  url: string
  name?: string
}

export interface DownloadOptions {
  dest?: string
}

const defaultOptions = {
  dest: 'D:/Downloads',
}

export async function downloadBlob(
  options: (DownloadOptions & DownloadFileInfo) | string,
): Promise<boolean> {
  const { url, ...optionsRest } = typeof options === 'string' ? { url: options } : options

  const {
    dest,
  } = { ...defaultOptions, ...optionsRest }

  if (!url)
    throw new Error('URL is required')

  const name = optionsRest.name?.trim() || new URL(url).pathname.split('/').pop() || 'unknown_file'
  let filename = dir(`${dest}/${name}`)

  if (existsSync(filename)) {
    return true
  }

  try {
    const res = await fetch(url)

    if (!res.ok || !res.body) {
      throw new Error(`Invalid response: ${res.status} ${res.statusText}`)
    }

    // set file name to the original file's name
    if (!optionsRest.name) {
      const redirectedFilename = new URL(res.url).pathname.split('/').pop()
      if (redirectedFilename) {
        filename = path.resolve(dest, redirectedFilename)
      }
    }

    await streamPipeline(res.body, createWriteStream(filename))

    // set file created time to the original file's created time
    const createdAt = new Date(res.headers.get('last-modified') || Date.now())
    await utimes(filename, createdAt, createdAt)

    consola.success(`Downloaded ${res.url} to ${filename}`)
    return true
  }
  catch (error) {
    consola.error(`Failed to download ${url}:`, error)
    return false
  }
}

export async function downloadFiles(
  files: DownloadFileInfo[] | string[],
  options?: DownloadOptions & Partial<PQueueOptions>,
) {
  options = {
    concurrency: 10,
    ...defaultOptions,
    ...options,
  }

  let downloaded = 0
  const queue = new PQueue(options)
  const fileArr = files.map(file => typeof file === 'string' ? { url: file } : file)

  queue.addAll(fileArr.map(file => async () => {
    const res = await downloadBlob({
      ...options,
      ...file,
    })
    if (res) {
      downloaded++
    }
  }))
  await queue.onIdle()

  return downloaded
}
