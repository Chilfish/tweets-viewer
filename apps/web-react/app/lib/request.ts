import { request } from '@tweets-viewer/shared'
import type { CacheRequestConfig } from 'axios-cache-interceptor'
import useSwr from 'swr'

const fetcher = async (url: string, options?: CacheRequestConfig) => {
  const res = await request.get(url, options)
  return res.data
}

export const useSwrFetch = <T>(path: string, options?: CacheRequestConfig) =>
  useSwr<T>(path, () => fetcher(path, options))
