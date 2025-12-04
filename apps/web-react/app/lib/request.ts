import type { CacheRequestConfig } from 'axios-cache-interceptor'
import { request } from '@tweets-viewer/shared'
import useSwr from 'swr'

async function fetcher(url: string, options?: CacheRequestConfig) {
  const res = await request.get(url, options)
  return res.data
}

export function useSwrFetch<T>(path: string, options?: CacheRequestConfig) {
  return useSwr<T>(path, () => fetcher(path, options))
}
