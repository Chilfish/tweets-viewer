import { create } from 'zustand'
import { getTweets as fetchTweets } from '~/lib/mock-data'
import type { Tweet, User } from '~/types'

export type SortOrder = 'asc' | 'desc'
export type SortBy = 'date'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

export interface TweetsFilters {
  dateRange: DateRange
  sortBy: SortBy
  sortOrder: SortOrder
}

interface TweetsState {
  tweets: Tweet[]
  isLoading: boolean
  hasMore: boolean
  error: string | null
  page: number
  currentUser: User | null
  filters: TweetsFilters
}

interface TweetsActions {
  setCurrentUser: (user: User) => void
  loadTweets: (screenName: string, isFirstLoad?: boolean) => Promise<void>
  loadMoreTweets: (screenName: string) => Promise<void>
  updateFilters: (filters: Partial<TweetsFilters>) => void
  setSortOrder: (order: SortOrder) => Promise<void>
  setDateRange: (range: DateRange) => Promise<void>
  reset: () => void
  sortTweets: (tweets: Tweet[]) => Tweet[]
}

type TweetsStore = TweetsState & TweetsActions

const initialState: TweetsState = {
  tweets: [],
  isLoading: false,
  hasMore: true,
  error: null,
  page: 1,
  currentUser: null,
  filters: {
    dateRange: { startDate: null, endDate: null },
    sortBy: 'date',
    sortOrder: 'desc', // 默认最新的在前
  },
}

export const useTweetsStore = create<TweetsStore>((set, get) => ({
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  sortTweets: (tweets) => {
    const { filters } = get()
    const sortedTweets = [...tweets]

    // 按日期排序
    if (filters.sortBy === 'date') {
      sortedTweets.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    }

    return sortedTweets
  },

  loadTweets: async (screenName, isFirstLoad = true) => {
    const state = get()
    if (state.isLoading) return

    set({ isLoading: true, error: null })

    try {
      // 未来API调用时，这里会传递筛选参数
      const result = await fetchTweets(
        screenName,
        isFirstLoad ? 1 : state.page,
        10,
        // 为未来API准备的参数
        {
          sortBy: state.filters.sortBy,
          sortOrder: state.filters.sortOrder,
          startDate: state.filters.dateRange.startDate,
          endDate: state.filters.dateRange.endDate,
        },
      )

      let tweets = result.tweets

      // 应用日期范围筛选（在mock数据阶段进行客户端筛选）
      if (
        state.filters.dateRange.startDate ||
        state.filters.dateRange.endDate
      ) {
        tweets = tweets.filter((tweet) => {
          const tweetDate = new Date(tweet.createdAt)
          const { startDate, endDate } = state.filters.dateRange

          if (startDate && tweetDate < startDate) return false
          if (endDate && tweetDate > endDate) return false
          return true
        })
      }

      // 应用排序
      tweets = state.sortTweets(tweets)

      const allTweets = isFirstLoad ? tweets : [...state.tweets, ...tweets]

      set({
        tweets: allTweets,
        hasMore: result.hasMore,
        page: isFirstLoad ? 2 : state.page + 1,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: 'Failed to load tweets. Please try again.',
        isLoading: false,
      })
      console.error('Error loading tweets:', error)
    }
  },

  loadMoreTweets: async (screenName) => {
    const state = get()
    if (!state.hasMore || state.isLoading) return

    await state.loadTweets(screenName, false)
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
      await state.loadTweets(state.currentUser.screenName, true)
    }
  },

  setDateRange: async (range) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, dateRange: range },
    }))

    // 重新加载数据以应用新的筛选
    if (state.currentUser) {
      await state.loadTweets(state.currentUser.screenName, true)
    }
  },

  reset: () => {
    set(initialState)
  },
}))
