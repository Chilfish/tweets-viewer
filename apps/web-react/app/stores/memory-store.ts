import { create } from 'zustand'
import { getLastYearsTodayTweets } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  createLoadDataAction,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet } from '~/types'
import type {
  DateRange,
  PaginatedListActions,
  SortFilterActions,
  SortOrder,
} from './index'

interface MemoryState extends PaginatedStore<Tweet> {
  currentUser: string | null
  filters: {
    sortOrder: SortOrder
    dateRange: DateRange
  }
}

interface MemoryActions extends PaginatedListActions, SortFilterActions {
  setCurrentUser: (screenName: string | null) => void
  loadMemoryTweets: (screenName: string, isFirstLoad?: boolean) => Promise<void>
}

type MemoryStore = MemoryState & MemoryActions

const initialState: Omit<MemoryState, keyof PaginatedStore<Tweet>> = {
  currentUser: null,
  filters: {
    sortOrder: 'desc',
    dateRange: { startDate: null, endDate: null },
  },
}

// 创建那年今日数据加载函数
const loadMemoryData = async (
  page: number,
  screenName: string,
  sortOrder: SortOrder,
): Promise<Tweet[]> => {
  const reverse = sortOrder === 'desc'
  // 注意：那年今日通常是一次性加载所有数据，不需要分页
  // 但这里保持接口一致性，如果API支持分页的话
  return getLastYearsTodayTweets(screenName, reverse)
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  ...createInitialPaginatedState<Tweet>(),
  ...initialState,

  hasMore: false, // 那年今日不需要分页，所以设置为false

  setCurrentUser: (screenName) => {
    set({ currentUser: screenName })
  },

  loadMemoryTweets: async (screenName: string, isFirstLoad = true) => {
    const state = get()

    if (!screenName) {
      set({ data: [], hasMore: false })
      return
    }

    const loadData = createLoadDataAction((page) =>
      loadMemoryData(page, screenName, state.filters.sortOrder),
    )

    await loadData(isFirstLoad, set, get, screenName, state.filters.sortOrder)
  },

  loadMore: async () => {
    const state = get()
    if (state.currentUser) {
      await state.loadMemoryTweets(state.currentUser, false)
    }
  },

  setSortOrder: async (order) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, sortOrder: order },
    }))

    // 重新加载数据以应用新的排序
    if (state.currentUser) {
      await state.loadMemoryTweets(state.currentUser, true)
    }
  },

  setDateRange: async (range) => {
    const state = get()
    set((prevState) => ({
      filters: { ...prevState.filters, dateRange: range },
    }))

    // 那年今日不需要日期筛选，但保持接口一致
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
