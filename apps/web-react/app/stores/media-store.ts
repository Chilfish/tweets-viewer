import type { Tweet, User } from '@tweets-viewer/shared'
import { create } from 'zustand'
import { getTweets, getTweetsByDateRange } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import {
  type DateRange,
  type PaginatedListActions,
  type SortFilterActions,
  type SortOrder,
  useTweetsStore,
} from './index'

export interface MediaItem {
  id: string
  url: string
  type: string
  width: number
  height: number
  tweetId: string
  createdAt: Date | string
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

// 智能加载媒体数据 - 持续获取直到有足够媒体或无更多数据
const loadMediaData = async (
  startPage: number,
  screenName: string,
  filters: MediaFilters,
  minMediaCount = 6,
  appendTweets: (newTweets: Tweet[]) => void,
  appendMedias: (newMedias: MediaItem[]) => void,
): Promise<{ mediaItems: MediaItem[]; hasMore: boolean; nextPage: number }> => {
  const reverse = filters.sortOrder === 'desc'
  const allMediaItems: MediaItem[] = []
  let currentPage = startPage
  let hasMore = true

  // 持续加载直到有足够媒体或无更多数据
  while (allMediaItems.length < minMediaCount && hasMore) {
    let tweets: Tweet[]

    try {
      // 如果有日期范围筛选，使用日期范围API
      if (filters.dateRange.startDate || filters.dateRange.endDate) {
        const start = filters.dateRange.startDate?.getTime() || 0
        const end = filters.dateRange.endDate?.getTime() || Date.now()

        tweets = await getTweetsByDateRange(screenName, {
          start,
          end,
          page: currentPage,
          reverse,
        })
      } else {
        // 使用普通的推文获取API
        tweets = await getTweets(screenName, {
          page: currentPage,
          reverse,
        })
      }

      // 如果没有获取到推文，说明没有更多数据
      if (tweets.length === 0) {
        hasMore = false
        break
      }

      appendTweets(tweets)

      // 提取媒体并添加到结果中
      const mediaItems = extractMediaFromTweets(tweets)
      allMediaItems.push(...mediaItems)
      appendMedias(mediaItems)

      // 准备获取下一页
      currentPage++

      // 如果推文数量少于预期，可能没有更多数据了
      if (tweets.length < 10) {
        hasMore = false
        break
      }
    } catch (error) {
      console.error('Error loading tweets for media:', error)
      hasMore = false
      break
    }
  }

  return {
    mediaItems: allMediaItems,
    hasMore,
    nextPage: currentPage,
  }
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  ...createInitialPaginatedState<MediaItem>(),
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  loadMedia: async (screenName, isFirstLoad = true) => {
    const state = get()
    const { appendData } = useTweetsStore.getState()

    if (state.isLoading) return

    set({ isLoading: true, error: null })

    try {
      const startPage = isFirstLoad ? 0 : state.page
      const minMediaCount = isFirstLoad ? 20 : 10 // 首次加载更多媒体

      const result = await loadMediaData(
        startPage,
        screenName,
        state.filters,
        minMediaCount,
        appendData,
        state.appendData.bind(state),
      )

      if (isFirstLoad) {
        set({
          data: result.mediaItems,
          hasMore: result.hasMore,
          page: result.nextPage,
          isLoading: false,
          error: null,
        })
      } else {
        set((prevState) => ({
          data: [...prevState.data, ...result.mediaItems],
          hasMore: result.hasMore,
          page: result.nextPage,
          isLoading: false,
          error: null,
        }))
      }
    } catch (error) {
      set({
        error: 'Failed to load media. Please try again.',
        isLoading: false,
      })
      console.error('Error loading media:', error)
    }
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
      page: 0, // 重置页码
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
      page: 0, // 重置页码
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
