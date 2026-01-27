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

export function formatDate(
  date: Date | string,
  formatString = 'yyyy-MM-dd',
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}
