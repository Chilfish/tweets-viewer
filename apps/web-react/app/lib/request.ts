import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import type { CacheRequestConfig } from 'axios-cache-interceptor'
import { setupCache } from 'axios-cache-interceptor'
import useSwr from 'swr'

const instance = setupCache(
  axios.create({
    baseURL: apiUrl,
    timeout: 10000,
  }),
)

const fetcher = async (url: string, options?: CacheRequestConfig) => {
  const res = await instance.get(url, options)
  return res.data
}

export const useSwrFetch = <T>(path: string, options?: CacheRequestConfig) =>
  useSwr<T>(path, () => fetcher(path, options))

export default instance
