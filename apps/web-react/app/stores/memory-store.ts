import { create } from 'zustand'
import { getLastYearsTodayTweets } from '~/lib/tweets-api'
import {
  createInitialPaginatedState,
  createLoadDataAction,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet } from '~/types'

export type SortOrder = 'asc' | 'desc'

interface MemoryState extends PaginatedStore<Tweet> {
  currentUser: string | null
  sortOrder: SortOrder
}

interface MemoryActions {
  setCurrentUser: (screenName: string | null) => void
  loadMemoryTweets: (screenName: string, isFirstLoad?: boolean) => Promise<void>
}

type MemoryStore = MemoryState & MemoryActions

const initialState: Omit<MemoryState, keyof PaginatedStore<Tweet>> = {
  currentUser: null,
  sortOrder: 'desc',
}

// 创建那年今日数据加载函数
const loadMemoryData = async (
  page: number,
  screenName: string,
  reverse: boolean,
): Promise<Tweet[]> => {
  // 注意：那年今日通常是一次性加载所有数据，不需要分页
  // 但这里保持接口一致性，如果API支持分页的话
  return getLastYearsTodayTweets(screenName, reverse)
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  ...createInitialPaginatedState<Tweet>(),
  ...initialState,

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
      loadMemoryData(page, screenName, reverse),
    )
    const reverse = state.sortOrder === 'desc'

    await loadData(isFirstLoad, set, get, state.currentUser, reverse)
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
