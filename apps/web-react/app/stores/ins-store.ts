import { create } from 'zustand'
import { getInsData, getInsDataByDateRange } from '~/lib/ins-api'
import {
  createInitialPaginatedState,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
import type { Tweet, User } from '~/types'
import type {
  DateRange,
  PaginatedListActions,
  SortFilterActions,
  SortOrder,
} from './index'

export interface InsMediaItem {
  id: string
  url: string
  type: string
  width: number
  height: number
  postId: string
  createdAt: Date
}

export interface InsFilters {
  dateRange: DateRange
  sortOrder: SortOrder
}

interface InsState extends PaginatedStore<InsMediaItem> {
  currentUser: User | null
  filters: InsFilters
}

interface InsActions extends PaginatedListActions, SortFilterActions {
  setCurrentUser: (user: User) => void
  loadInsData: (screenName: string, isFirstLoad?: boolean) => Promise<void>
  loadMoreInsData: (screenName: string) => Promise<void>
  updateFilters: (filters: Partial<InsFilters>) => void
}

type InsStore = InsState & InsActions

const initialState: Omit<InsState, keyof PaginatedStore<InsMediaItem>> = {
  currentUser: null,
  filters: {
    dateRange: { startDate: null, endDate: null },
    sortOrder: 'desc',
  },
}

// 从Instagram数据中提取媒体项（兼容Tweet结构）
const extractMediaFromInsData = (insData: Tweet[]): InsMediaItem[] => {
  const mediaItems: InsMediaItem[] = []

  insData.forEach((post) => {
    // Instagram数据使用Tweet结构，但我们将其视为Instagram帖子
    post.media.forEach((media, index) => {
      mediaItems.push({
        id: `${post.tweetId}-${index}`,
        url: media.url,
        type: media.type,
        width: media.width,
        height: media.height,
        postId: post.tweetId,
        createdAt: post.createdAt,
      })
    })
  })

  return mediaItems
}

// 智能加载Instagram媒体数据
const loadInsMediaData = async (
  startPage: number,
  screenName: string,
  filters: InsFilters,
  minMediaCount = 6,
): Promise<{
  mediaItems: InsMediaItem[]
  hasMore: boolean
  nextPage: number
}> => {
  const reverse = filters.sortOrder === 'desc'
  const allMediaItems: InsMediaItem[] = []
  let currentPage = startPage
  let hasMore = true

  // 持续加载直到有足够媒体或无更多数据
  while (allMediaItems.length < minMediaCount && hasMore) {
    let insData: Tweet[]

    try {
      // 如果有日期范围筛选，使用日期范围API
      if (filters.dateRange.startDate || filters.dateRange.endDate) {
        const start = filters.dateRange.startDate?.getTime() || 0
        const end = filters.dateRange.endDate?.getTime() || Date.now()

        insData = await getInsDataByDateRange(screenName, {
          start,
          end,
          page: currentPage,
          reverse,
        })
      } else {
        // 使用普通的Instagram数据获取API
        insData = await getInsData(screenName, {
          page: currentPage,
          reverse,
        })
      }

      // 如果没有获取到数据，说明没有更多数据
      if (insData.length === 0) {
        hasMore = false
        break
      }

      // 提取媒体并添加到结果中
      const mediaItems = extractMediaFromInsData(insData)
      allMediaItems.push(...mediaItems)

      // 准备获取下一页
      currentPage++

      // 如果数据数量少于预期，可能没有更多数据了
      if (insData.length < 10) {
        hasMore = false
        break
      }
    } catch (error) {
      console.error('Error loading Instagram data:', error)
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

export const useInsStore = create<InsStore>((set, get) => ({
  ...createInitialPaginatedState<InsMediaItem>(),
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  loadInsData: async (screenName, isFirstLoad = true) => {
    const state = get()
    if (state.isLoading) return

    set({ isLoading: true, error: null })

    try {
      const startPage = isFirstLoad ? 0 : state.page
      const minMediaCount = isFirstLoad ? 20 : 10 // 首次加载更多媒体

      const result = await loadInsMediaData(
        startPage,
        screenName,
        state.filters,
        minMediaCount,
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
        error: 'Failed to load Instagram data. Please try again.',
        isLoading: false,
      })
      console.error('Error loading Instagram data:', error)
    }
  },

  loadMoreInsData: async (screenName) => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await state.loadInsData(screenName, false)
  },

  loadMore: async () => {
    const state = get()
    if (state.currentUser) {
      await state.loadMoreInsData(state.currentUser.screenName)
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
      await state.loadInsData(state.currentUser.screenName, true)
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
      await state.loadInsData(state.currentUser.screenName, true)
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
    set({ ...createInitialPaginatedState<InsMediaItem>(), ...initialState }),
}))
