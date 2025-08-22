// 用户相关状态管理

import type { Tweet } from '~/types'

// 通用分页接口
export interface PaginatedListActions {
  isLoading: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => Promise<void>
}

// 通用排序筛选接口
export interface SortFilterActions {
  setSortOrder: (order: SortOrder) => Promise<void>
  setDateRange: (range: DateRange) => Promise<void>
  filters: {
    sortOrder: SortOrder
    dateRange: DateRange
  }
}

export type SortOrder = 'asc' | 'desc'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

// 应用设置状态管理
export { useAppStore } from './app-store'
// 那年今日功能状态管理
export { useMemoryStore } from './memory-store'
// 搜索功能状态管理
export { useSearchStore } from './search-store'
// 推文列表状态管理（用户推文页面）
export { useTweetsStore } from './tweets-store'
export { useUserStore } from './user-store'
