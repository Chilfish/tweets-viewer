import useSWR from 'swr'
import {
  getLastYearsTodayTweets,
  getTweets,
  getTweetsByDateRange,
  searchTweets,
} from './tweets-api'

// 获取推文列表的hook
export function useTweets(name: string | null, page = 1, reverse = true) {
  const key = name ? ['tweets', name, page, reverse] : null

  return useSWR(key, () => (name ? getTweets(name, { page, reverse }) : []))
}

// 按日期范围获取推文的hook
export function useTweetsByDateRange(
  name: string | null,
  start: number,
  end: number,
  page = 1,
  reverse = true,
) {
  const key = name ? ['tweets-range', name, start, end, page, reverse] : null

  return useSWR(key, () =>
    name ? getTweetsByDateRange(name, { start, end, page, reverse }) : [],
  )
}

// 获取那年今日推文的hook
export function useLastYearsTodayTweets(name: string | null, reverse = true) {
  const key = name ? ['last-years-today', name, reverse] : null

  return useSWR(key, () => (name ? getLastYearsTodayTweets(name, reverse) : []))
}

// 搜索推文的hook
export function useSearchTweets(
  name: string | null,
  keyword: string | null,
  page = 1,
  reverse = true,
  start?: number,
  end?: number,
) {
  const key =
    name && keyword
      ? ['search-tweets', name, keyword, page, reverse, start, end]
      : null

  return useSWR(key, () =>
    name && keyword
      ? searchTweets(name, { q: keyword, page, reverse, start, end })
      : [],
  )
}
