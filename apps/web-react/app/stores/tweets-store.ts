import { create } from 'zustand'
import { getTweets, getTweetsByDateRange } from '~/lib/tweets-api'
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
      const currentPage = isFirstLoad ? 1 : state.page
      const reverse = state.filters.sortOrder === 'desc'

      let tweets: Tweet[]

      // 如果有日期范围筛选，使用日期范围API
      if (
        state.filters.dateRange.startDate ||
        state.filters.dateRange.endDate
      ) {
        const start = state.filters.dateRange.startDate?.getTime() || 0
        const end = state.filters.dateRange.endDate?.getTime() || Date.now()

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

      const allTweets = isFirstLoad ? tweets : [...state.tweets, ...tweets]
      const hasMore = tweets.length === 10 // 假设每页10条，如果少于10条说明没有更多了

      set({
        tweets: allTweets,
        hasMore,
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
