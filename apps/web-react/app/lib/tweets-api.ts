import type { Tweet } from '@tweets-viewer/shared'
import { request } from '@tweets-viewer/shared'
import type { CacheRequestConfig } from 'axios-cache-interceptor'

interface TweetsApiParams {
  page: number
  reverse?: boolean
}

interface DateRangeParams extends TweetsApiParams {
  start: number
  end: number
}

interface SearchParams extends TweetsApiParams {
  q: string
  start?: number
  end?: number
}

// 生成缓存key的辅助函数
function getCacheKey(
  name: string,
  params: Record<string, any>,
  domain: string,
): string {
  return `${domain}-${name}-${JSON.stringify(params)}`
}

// 获取推文列表
export async function getTweets(
  name: string,
  params: TweetsApiParams,
): Promise<Tweet[]> {
  if (!name) return []

  const config: CacheRequestConfig = {
    id: getCacheKey(name, params, 'get'),
  }

  const res = await request.get<Tweet[]>(`/tweets/get/${name}`, {
    params,
    ...config,
  })

  return res.data
}

// 按日期范围获取推文
export async function getTweetsByDateRange(
  name: string,
  params: DateRangeParams,
): Promise<Tweet[]> {
  if (!name) return []

  const config: CacheRequestConfig = {
    id: getCacheKey(name, params, 'range'),
  }

  const res = await request.get<Tweet[]>(`/tweets/get/${name}/range`, {
    params,
    ...config,
  })

  return res.data
}

// 获取那年今日数据
export async function getLastYearsTodayTweets(
  name: string,
  reverse = true,
): Promise<Tweet[]> {
  if (!name) return []

  const params = { reverse }
  const config: CacheRequestConfig = {
    id: getCacheKey(name, params, 'last-years-today'),
  }

  const res = await request.get<Tweet[]>(
    `/tweets/get/${name}/last-years-today`,
    {
      params,
      ...config,
    },
  )

  return res.data
}

// 搜索推文
export async function searchTweets(
  name: string,
  params: SearchParams,
): Promise<Tweet[]> {
  if (!name) return []

  const config: CacheRequestConfig = {
    id: getCacheKey(name, params, 'search'),
  }

  const res = await request.get<Tweet[]>(`/tweets/search/${name}`, {
    params,
    ...config,
  })

  return res.data
}
