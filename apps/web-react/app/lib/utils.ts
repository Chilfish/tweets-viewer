import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

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
