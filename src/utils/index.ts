import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function canGoogle() {
  try {
    const aborter = new AbortController()
    setTimeout(() => aborter.abort('Timeout 2s'), 2000)

    const urls = [
      'https://x.com/',
    ]
    console.log('Checking network... ping to', urls)

    await Promise.all(urls.map(url => fetch(url, {
      mode: 'no-cors',
      signal: aborter.signal,
    })))
    return true
  }
  catch (error) {
    console.error('Google is not reachable', error)
    return false
  }
}
