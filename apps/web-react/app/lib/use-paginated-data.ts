// 通用的分页状态接口
export interface PaginatedState<T> {
  data: T[]
  isLoading: boolean
  hasMore: boolean
  error: string | null
  page: number
}

// 通用的分页操作接口
export interface PaginatedActions<T> {
  setData: (data: T[]) => void
  appendData: (data: T[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHasMore: (hasMore: boolean) => void
  nextPage: () => void
  reset: () => void
}

// 通用的分页数据管理类型
export type PaginatedStore<T> = PaginatedState<T> & PaginatedActions<T>

// 创建分页状态的初始值
export const createInitialPaginatedState = <T>(): PaginatedState<T> => ({
  data: [],
  isLoading: false,
  hasMore: true,
  error: null,
  page: 0,
})

// 创建通用的分页操作
export const createPaginatedActions = <T>() => ({
  setData: (data: T[]) => (state: PaginatedState<T>) => ({
    ...state,
    data,
  }),

  appendData: (newData: T[]) => (state: PaginatedState<T>) => ({
    ...state,
    data: [...state.data, ...newData],
  }),

  setLoading: (loading: boolean) => (state: PaginatedState<T>) => ({
    ...state,
    isLoading: loading,
  }),

  setError: (error: string | null) => (state: PaginatedState<T>) => ({
    ...state,
    error,
    isLoading: false,
  }),

  setHasMore: (hasMore: boolean) => (state: PaginatedState<T>) => ({
    ...state,
    hasMore,
  }),

  nextPage: () => (state: PaginatedState<T>) => ({
    ...state,
    page: state.page + 1,
  }),

  reset: () => createInitialPaginatedState<T>(),
})

// 通用的分页数据加载逻辑
export const createLoadDataAction = <T>(
  loadFn: (page: number, ...args: any[]) => Promise<T[]>,
  pageSize = 10,
) => {
  return async (
    isFirstLoad: boolean,
    set: (fn: (state: PaginatedState<T>) => PaginatedState<T>) => void,
    get: () => PaginatedState<T>,
    ...args: any[]
  ) => {
    const state = get()
    if (state.isLoading) return

    set(createPaginatedActions<T>().setLoading(true))

    try {
      const currentPage = isFirstLoad ? 0 : state.page
      const newData = await loadFn(currentPage, ...args)

      const hasMore = newData.length === pageSize

      if (isFirstLoad) {
        set((state) => ({
          ...createPaginatedActions<T>().setData(newData)(state),
          hasMore,
          page: 0,
          isLoading: false,
          error: null,
        }))
      } else {
        set((state) => ({
          ...createPaginatedActions<T>().appendData(newData)(state),
          hasMore,
          page: state.page + 1,
          isLoading: false,
          error: null,
        }))
      }
    } catch (error) {
      set(
        createPaginatedActions<T>().setError(
          'Failed to load data. Please try again.',
        ),
      )
      console.error('Error loading data:', error)
    }
  }
}
