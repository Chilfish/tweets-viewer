import { create } from 'zustand'
import { getTweets, getTweetsByDateRange } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  createLoadDataAction,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet, User } from '~/types'
import type {
  DateRange,
  PaginatedListActions,
  SortFilterActions,
  SortOrder,
} from './index'

export interface TweetsFilters {
  dateRange: DateRange
  sortOrder: SortOrder
}

interface TweetsState extends PaginatedStore<Tweet> {
  currentUser: User | null
  filters: TweetsFilters
}

interface TweetsActions extends PaginatedListActions, SortFilterActions {
  setCurrentUser: (user: User) => void
  loadTweets: (screenName: string, isFirstLoad?: boolean) => Promise<void>
  loadMoreTweets: (screenName: string) => Promise<void>
  updateFilters: (filters: Partial<TweetsFilters>) => void
}

type TweetsStore = TweetsState & TweetsActions

const initialState: Omit<TweetsState, keyof PaginatedStore<Tweet>> = {
  currentUser: null,
  filters: {
    dateRange: { startDate: null, endDate: null },
    sortOrder: 'desc',
  },
}

// 创建数据加载函数
const loadTweetsData = async (
  page: number,
  screenName: string,
  filters: TweetsFilters,
): Promise<Tweet[]> => {
  const reverse = filters.sortOrder === 'desc'

  // 如果有日期范围筛选，使用日期范围API
  if (filters.dateRange.startDate || filters.dateRange.endDate) {
    const start = filters.dateRange.startDate?.getTime() || 0
    const end = filters.dateRange.endDate?.getTime() || Date.now()

    return getTweetsByDateRange(screenName, {
      start,
      end,
      page,
      reverse,
    })
  }

  // 使用普通的推文获取API
  return getTweets(screenName, {
    page,
    reverse,
  })
}

export const useTweetsStore = create<TweetsStore>((set, get) => ({
  ...createInitialPaginatedState<Tweet>(),
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  loadTweets: async (screenName, isFirstLoad = true) => {
    const state = get()
    const loadData = createLoadDataAction(loadTweetsData)
    await loadData(isFirstLoad, set, get, screenName, state.filters)
  },

  loadMoreTweets: async (screenName) => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await state.loadTweets(screenName, false)
  },

  loadMore: async () => {
    const state = get()
    if (state.currentUser) {
      await state.loadMoreTweets(state.currentUser.screenName)
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

  // 通用分页操作
  setData: (data) => set({ data }),
  appendData: (newData) =>
    set((state) => ({ data: [...state.data, ...newData] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setHasMore: (hasMore) => set({ hasMore }),
  nextPage: () => set((state) => ({ page: state.page + 1 })),
  reset: () =>
    set({ ...createInitialPaginatedState<Tweet>(), ...initialState }),
}))
