import type { Tweet } from '@tweets-viewer/shared'
import { request } from '@tweets-viewer/shared'
import type { CacheRequestConfig } from 'axios-cache-interceptor'

interface InsApiParams {
  page: number
  reverse?: boolean
}

interface DateRangeParams extends InsApiParams {
  start: number
  end: number
}

// 生成缓存key的辅助函数
function getCacheKey(
  name: string,
  params: Record<string, any>,
  domain: string,
): string {
  return `${domain}-${name}-${JSON.stringify(params)}`
}

// 获取Instagram数据列表
export async function getInsData(
  name: string,
  params: InsApiParams,
): Promise<Tweet[]> {
  if (!name) return []

  const config: CacheRequestConfig = {
    id: getCacheKey(name, params, 'ins-get'),
  }

  const res = await request.get<Tweet[]>(`/ins/get/${name}`, {
    params,
    ...config,
  })

  return res.data
}

// 按日期范围获取Instagram数据
export async function getInsDataByDateRange(
  name: string,
  params: DateRangeParams,
): Promise<Tweet[]> {
  if (!name) return []

  const config: CacheRequestConfig = {
    id: getCacheKey(name, params, 'ins-range'),
  }

  const res = await request.get<Tweet[]>(`/ins/get/${name}/range`, {
    params,
    ...config,
  })

  return res.data
}
