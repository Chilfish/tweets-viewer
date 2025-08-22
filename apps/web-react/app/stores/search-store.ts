import { create } from 'zustand'
import { searchTweets } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  createLoadDataAction,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet } from '~/types'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

interface SearchState extends PaginatedStore<Tweet> {
  keyword: string
  dateRange: DateRange
  currentUser: string | null
}

interface SearchActions {
  setKeyword: (keyword: string) => void
  setDateRange: (range: DateRange) => void
  setCurrentUser: (screenName: string | null) => void
  searchTweets: (isFirstLoad?: boolean) => Promise<void>
  loadMoreResults: () => Promise<void>
  clearSearch: () => void
}

type SearchStore = SearchState & SearchActions

const initialState: Omit<SearchState, keyof PaginatedStore<Tweet>> = {
  keyword: '',
  dateRange: { startDate: null, endDate: null },
  currentUser: null,
}

// 创建搜索数据加载函数
const loadSearchData = async (
  page: number,
  screenName: string,
  keyword: string,
  dateRange: DateRange,
): Promise<Tweet[]> => {
  const start = dateRange.startDate?.getTime()
  const end = dateRange.endDate?.getTime()

  return searchTweets(screenName, {
    q: keyword,
    page,
    reverse: true, // 搜索结果默认按时间倒序
    start,
    end,
  })
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  ...createInitialPaginatedState<Tweet>(),
  ...initialState,

  setKeyword: (keyword) => {
    set({ keyword })
  },

  setDateRange: (range) => {
    set({ dateRange: range })
  },

  setCurrentUser: (screenName) => {
    set({ currentUser: screenName })
  },

  searchTweets: async (isFirstLoad = true) => {
    const state = get()

    if (!state.keyword.trim() || !state.currentUser) {
      set({ data: [], hasMore: false })
      return
    }

    const loadData = createLoadDataAction(loadSearchData)
    await loadData(
      isFirstLoad,
      set,
      get,
      state.currentUser,
      state.keyword.trim(),
      state.dateRange,
    )
  },

  loadMoreResults: async () => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await state.searchTweets(false)
  },

  clearSearch: () => {
    set({
      ...createInitialPaginatedState<Tweet>(),
      keyword: '',
      dateRange: { startDate: null, endDate: null },
    })
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
