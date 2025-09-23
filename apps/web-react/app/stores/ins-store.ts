import type { Tweet, User } from '@tweets-viewer/shared'
import { create } from 'zustand'
import { getInsData } from '~/lib/ins-api'
import {
  createInitialPaginatedState,
  type PaginatedStore,
} from '~/lib/use-paginated-data'
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
  createdAt: Date | string
  fullText: string
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
        fullText: post.fullText || '',
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
  minMediaCount = 10,
  existingMediaIds: Set<string> = new Set(),
): Promise<{
  mediaItems: InsMediaItem[]
  hasMore: boolean
  nextPage: number
}> => {
  const reverse = filters.sortOrder === 'desc'
  const allMediaItems: InsMediaItem[] = []
  let currentPage = startPage
  let hasMore = true
  let consecutiveEmptyPages = 0
  const maxConsecutiveEmptyPages = 3 // 连续3页没有新数据就停止

  // 持续加载直到有足够媒体或无更多数据
  while (
    allMediaItems.length < minMediaCount &&
    hasMore &&
    consecutiveEmptyPages < maxConsecutiveEmptyPages
  ) {
    try {
      // 使用普通的Instagram数据获取API
      const insData = await getInsData(screenName, {
        page: currentPage,
        reverse,
      })

      // 如果没有获取到数据，说明没有更多数据
      if (insData.length === 0) {
        consecutiveEmptyPages++
        if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
          hasMore = false
          break
        }
        currentPage++
        continue
      }

      // 提取媒体并进行去重
      const mediaItems = extractMediaFromInsData(insData)
      const newMediaItems = mediaItems.filter(
        (item) => !existingMediaIds.has(item.id),
      )

      // 如果这一页没有新的媒体项，增加空页计数
      if (newMediaItems.length === 0) {
        consecutiveEmptyPages++
      } else {
        consecutiveEmptyPages = 0 // 重置空页计数
        allMediaItems.push(...newMediaItems)
        // 将新的媒体ID添加到已存在的集合中
        newMediaItems.forEach((item) => existingMediaIds.add(item.id))
      }

      // 准备获取下一页
      currentPage++

      // 如果原始数据数量少于预期，可能没有更多数据了
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

      // 创建已存在媒体ID的集合，用于去重
      const existingMediaIds = new Set(state.data.map((item) => item.id))

      const result = await loadInsMediaData(
        startPage,
        screenName,
        state.filters,
        minMediaCount,
        isFirstLoad ? new Set() : existingMediaIds, // 首次加载不需要去重，后续加载需要
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
