import { create } from 'zustand'
import { getTweets, getTweetsByDateRange } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  createLoadDataAction,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet, TweetMedia, User } from '~/types'
import type {
  DateRange,
  PaginatedListActions,
  SortFilterActions,
  SortOrder,
} from './index'

export interface MediaItem {
  id: string
  url: string
  type: string
  width: number
  height: number
  tweetId: string
  createdAt: Date
}

export interface MediaFilters {
  dateRange: DateRange
  sortOrder: SortOrder
}

interface MediaState extends PaginatedStore<MediaItem> {
  currentUser: User | null
  filters: MediaFilters
}

interface MediaActions extends PaginatedListActions, SortFilterActions {
  setCurrentUser: (user: User) => void
  loadMedia: (screenName: string, isFirstLoad?: boolean) => Promise<void>
  loadMoreMedia: (screenName: string) => Promise<void>
  updateFilters: (filters: Partial<MediaFilters>) => void
}

type MediaStore = MediaState & MediaActions

const initialState: Omit<MediaState, keyof PaginatedStore<MediaItem>> = {
  currentUser: null,
  filters: {
    dateRange: { startDate: null, endDate: null },
    sortOrder: 'desc',
  },
}

// 从推文中提取媒体项
const extractMediaFromTweets = (tweets: Tweet[]): MediaItem[] => {
  const mediaItems: MediaItem[] = []

  tweets.forEach((tweet) => {
    // 只处理原创推文的媒体，不包括转推
    const targetTweet = tweet.retweetedStatus?.tweet || tweet
    if (tweet.retweetedStatus) return // 跳过转推

    targetTweet.media.forEach((media, index) => {
      mediaItems.push({
        id: `${targetTweet.tweetId}-${index}`,
        url: media.url,
        type: media.type,
        width: media.width,
        height: media.height,
        tweetId: targetTweet.tweetId,
        createdAt: targetTweet.createdAt,
      })
    })
  })

  return mediaItems
}

// 创建媒体数据加载函数
const loadMediaData = async (
  page: number,
  screenName: string,
  filters: MediaFilters,
): Promise<MediaItem[]> => {
  const reverse = filters.sortOrder === 'desc'

  let tweets: Tweet[]

  // 如果有日期范围筛选，使用日期范围API
  if (filters.dateRange.startDate || filters.dateRange.endDate) {
    const start = filters.dateRange.startDate?.getTime() || 0
    const end = filters.dateRange.endDate?.getTime() || Date.now()

    tweets = await getTweetsByDateRange(screenName, {
      start,
      end,
      page,
      reverse,
    })
  } else {
    // 使用普通的推文获取API
    tweets = await getTweets(screenName, {
      page,
      reverse,
    })
  }

  return extractMediaFromTweets(tweets)
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  ...createInitialPaginatedState<MediaItem>(),
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  loadMedia: async (screenName, isFirstLoad = true) => {
    const state = get()
    const loadData = createLoadDataAction(loadMediaData, 20) // 每次加载更多推文来获取媒体
    await loadData(isFirstLoad, set, get, screenName, state.filters)
  },

  loadMoreMedia: async (screenName) => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await state.loadMedia(screenName, false)
  },

  loadMore: async () => {
    const state = get()
    if (state.currentUser) {
      await state.loadMoreMedia(state.currentUser.screenName)
    }
  },

  updateFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  setSortOrder: async (order) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, sortOrder: order },
    }))

    // 重新加载数据以应用新的排序
    if (state.currentUser) {
      await state.loadMedia(state.currentUser.screenName, true)
    }
  },

  setDateRange: async (range) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, dateRange: range },
    }))

    // 重新加载数据以应用新的筛选
    if (state.currentUser) {
      await state.loadMedia(state.currentUser.screenName, true)
    }
  },

  // 通用分页操作
  setData: (data) => set({ data }),
  appendData: (newData) =>
    set((state) => ({ data: [...state.data, ...newData] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setHasMore: (hasMore) => set({ hasMore }),
  nextPage: () => set((state) => ({ page: state.page + 1 })),
  reset: () =>
    set({ ...createInitialPaginatedState<MediaItem>(), ...initialState }),
}))
