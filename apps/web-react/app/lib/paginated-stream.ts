import type { PaginatedResponse } from '@tweets-viewer/shared'

export type StreamStatus = 'idle' | 'fetching' | 'ready' | 'exhausted' | 'error'

export interface StreamState<T extends { id: string }> {
  items: T[]
  status: StreamStatus
  total: number
  nextCursor?: string
  /**
   * 已并入流的 API 页数（阅读进度）。
   * loader 吸收（applyLoaderPage）后恒对齐 URL `page`；滚动续载（applyFetchedPage）成功后 `+1`。
   * hook 据此把 URL `page` 同步为已加载页数（replace，见 Specification §4.2）。
   */
  loadedPages: number
}

/** 规范化 meta.nextCursor（number 时转 string，保持游标为字符串协议） */
export function normalizeCursor(cursor: number | string | undefined): string | undefined {
  return cursor == null ? undefined : String(cursor)
}

export interface LoaderPageInput<TPage, TItem extends { id: string }> {
  pageData: PaginatedResponse<TPage>
  extract: (data: PaginatedResponse<TPage>) => TItem[]
  filterKey: string
  page: number
  prevFilterKey: string
  prevPage: number
  /** 当前已累积的 items（"顺序下一页"分支的追加基底） */
  currentItems: TItem[]
}

export interface LoaderPageResult<TItem extends { id: string }> {
  state: StreamState<TItem>
  prevFilterKey: string
  prevPage: number
}

/** 按 id 追加去重 */
export function appendUnique<T extends { id: string }>(items: T[], newItems: T[]): T[] {
  const ids = new Set(items.map(i => i.id))
  return [...items, ...newItems.filter(i => !ids.has(i.id))]
}

/**
 * loader 数据吸收（纯函数，4B-1 状态转移核心）。
 *
 * - 筛选变化（filterKey 变）→ 重置 + 替换
 * - 顺序下一页（URL 被外部推进到 prevPage+1）→ 追加去重
 * - 跳页（page 不连续）→ 替换
 *
 * 返回新的流状态 + 更新后的 prev 跟踪值，供 hook 内部引用。
 */
export function applyLoaderPage<TPage, TItem extends { id: string }>(
  input: LoaderPageInput<TPage, TItem>,
): LoaderPageResult<TItem> {
  const { pageData, extract, filterKey, page, prevFilterKey, prevPage, currentItems } = input
  const filterChanged = prevFilterKey !== filterKey
  const isSequentialNext = page === prevPage + 1

  const newItems = extract(pageData)
  const items = filterChanged || !isSequentialNext
    ? newItems
    : appendUnique(currentItems, newItems)

  return {
    state: {
      items,
      status: pageData.meta.hasMore ? 'ready' : 'exhausted',
      total: pageData.meta.total,
      nextCursor: normalizeCursor(pageData.meta.nextCursor),
      // URL page 是当前流的锚点：替换或顺序追加后，已加载页数恒对齐 URL page
      loadedPages: page,
    },
    prevFilterKey: filterKey,
    prevPage: page,
  }
}

/** 滚动续载结果吸收（纯函数）：extract 转换 + 追加去重 + 更新游标/总数/状态/已加载页数 */
export function applyFetchedPage<TPage, TItem extends { id: string }>(
  current: StreamState<TItem>,
  pageData: PaginatedResponse<TPage>,
  extract: (data: PaginatedResponse<TPage>) => TItem[],
): StreamState<TItem> {
  return {
    items: appendUnique(current.items, extract(pageData)),
    status: pageData.meta.hasMore ? 'ready' : 'exhausted',
    total: pageData.meta.total,
    nextCursor: normalizeCursor(pageData.meta.nextCursor),
    loadedPages: current.loadedPages + 1,
  }
}
