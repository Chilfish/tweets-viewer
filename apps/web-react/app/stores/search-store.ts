import { create } from 'zustand'
import { searchTweets } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  createLoadDataAction,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet } from '@tweets-viewer/shared'
import type {
  DateRange,
  PaginatedListActions,
  SortFilterActions,
  SortOrder,
} from './index'

interface SearchState extends PaginatedStore<Tweet> {
  keyword: string
  filters: {
    dateRange: DateRange
    sortOrder: SortOrder
  }
  currentUser: string | null
}

interface SearchActions extends PaginatedListActions, SortFilterActions {
  setKeyword: (keyword: string) => void
  setCurrentUser: (screenName: string | null) => void
  searchTweets: (isFirstLoad?: boolean) => Promise<void>
  loadMoreResults: () => Promise<void>
  clearSearch: () => void
  clearData: () => void
  setPage: (page: number) => void
}

type SearchStore = SearchState & SearchActions

const initialState: Omit<SearchState, keyof PaginatedStore<Tweet>> = {
  keyword: '',
  filters: {
    dateRange: { startDate: null, endDate: null },
    sortOrder: 'desc',
  },
  currentUser: null,
}

// 创建搜索数据加载函数
const loadSearchData = async (
  page: number,
  screenName: string,
  keyword: string,
  filters: { dateRange: DateRange; sortOrder: SortOrder },
): Promise<Tweet[]> => {
  const start = filters.dateRange.startDate?.getTime()
  const end = filters.dateRange.endDate?.getTime()
  const reverse = filters.sortOrder === 'desc'

  return searchTweets(screenName, {
    q: keyword,
    page,
    reverse,
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

  setDateRange: async (range) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, dateRange: range },
    }))

    // 重新搜索以应用新的筛选
    if (state.keyword.trim() && state.currentUser) {
      await state.searchTweets(true)
    }
  },

  setSortOrder: async (order) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, sortOrder: order },
    }))

    // 重新搜索以应用新的排序
    if (state.keyword.trim() && state.currentUser) {
      await state.searchTweets(true)
    }
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
      state.filters,
    )
  },

  loadMoreResults: async () => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await state.searchTweets(false)
  },

  loadMore: async () => {
    const state = get()
    await state.loadMoreResults()
  },

  clearSearch: () => {
    set({
      ...createInitialPaginatedState<Tweet>(),
      keyword: '',
      filters: {
        dateRange: { startDate: null, endDate: null },
        sortOrder: 'desc',
      },
    })
  },

  clearData: () => {
    set({
      ...createInitialPaginatedState<Tweet>(),
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
  setPage: (page) => set({ page }),
  reset: () =>
    set({ ...createInitialPaginatedState<Tweet>(), ...initialState }),
}))
