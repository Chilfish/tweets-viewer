import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export * from './promise'

export function tweetUrl(name: string, id: string) {
  return `https://twitter.com/${name}/status/${id}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function canGoogle() {
  try {
    const aborter = new AbortController()
    setTimeout(() => aborter.abort('Timeout 2s'), 2000)

    const urls = [
      // 居然有时能直连推特图床
      'https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_400x400.jpg',
      'https://x.com',
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

export function avatarUrl(name: string) {
  return `https://unavatar.io/${name}`
}
