import type { ClassValue } from 'clsx'
import { apiUrl } from '@tweets-viewer/shared'
import Axios from 'axios'
import { buildMemoryStorage, buildWebStorage, setupCache } from 'axios-cache-interceptor'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export const apiClient = Axios.create({
  baseURL: `${apiUrl}/v3`,
})

const cacheStorage = typeof sessionStorage === 'undefined'
  ? buildMemoryStorage(
    /* cloneData default= */ false,
      /* cleanupInterval default= */ 5 * 60 * 1000,
      /* maxEntries default= */ 1024,
      /* maxStaleAge default= */ 60 * 60 * 1000,
    )
  : buildWebStorage(sessionStorage, 'axios-cache:')

setupCache(apiClient, {
  storage: cacheStorage,
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function proxyMedia(url: string) {
  return `https://proxy.chilfish.top/${url}`
}

export function callAll<Args extends Array<unknown>>(
  ...fns: Array<((...args: Args) => unknown) | undefined>
) {
  return (...args: Args) => {
    for (const fn of fns) {
      fn?.(...args)
    }
  }
}

export function snowId2millis(id: string) {
  return (BigInt(id) >> BigInt(22)) + BigInt(1288834974657)
}

export function pubTime(id: string) {
  return new Date(Number(snowId2millis(id)))
}

export function formatDate(
  date: Date | string,
  formatString = 'yyyy-MM-dd',
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}
