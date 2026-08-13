import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { StreamState } from '~/lib/paginated-stream'
import { useCallback, useEffect, useRef, useState } from 'react'
import { applyFetchedPage, applyLoaderPage } from '~/lib/paginated-stream'

export type { StreamStatus } from '~/lib/paginated-stream'

interface UseUrlPaginatedStreamOptions<TPage, TItem extends { id: string }> {
  /** 当前页数据（来自 loader，每次 loader 重跑后更新） */
  pageData: PaginatedResponse<TPage>
  /** 从 pageData 提取条目（如媒体墙的 extractMediaFromTweets / 一般列表 identity） */
  extract: (data: PaginatedResponse<TPage>) => TItem[]
  /** 过滤器键：变化时整流（重置 + 替换），如 `${name}-${reverse}-${start}-${end}` */
  filterKey: string
  /** 当前 URL page（定位锚点；滚动续载不写 URL） */
  page: number
  /**
   * 拉取下一页（滚动续载用，keyset 优先）。
   * 返回 `null` 表示失败（网络错误等），进入 error 态。成功返回该页原始数据。
   */
  fetchNextPage: (ctx: { page: number, cursor: string | undefined }) => Promise<PaginatedResponse<TPage> | null>
}

/**
 * URL 驱动的分页流统一状态机（深度模块，4B-1）。
 *
 * 收敛 tweets / memo / media / ins / search 五条列表流的既有手写实现：
 * - **loader 数据吸收**：委托纯函数 `applyLoaderPage`（状态转移逻辑全部可单测）；
 *   用 latest-ref 读取 extract/fetchNextPage，effect 不再依赖每次新对象的 loader 数据（修复 r2 漏项）。
 * - **滚动续载**：`loadMore()` 显式调 `fetchNextPage`（keyset cursor 优先，无游标回退 page），
 *   不写 URL、不重跑 loader；结果经 `applyFetchedPage` 转换并追加去重。
 * - **定位**：分页器跳页由 URL page 变化 → loader 重跑 → 替换。
 *
 * 泛型：`TPage` = loader/API 返回的原始条目类型（如 EnrichedTweet / IGPost）；
 * `TItem` = 流内条目类型（如媒体墙的 FlatMediaItem），默认与 `TPage` 相同。
 */
export function useUrlPaginatedStream<TPage, TItem extends { id: string } = TPage & { id: string }>({
  pageData,
  extract,
  filterKey,
  page,
  fetchNextPage,
}: UseUrlPaginatedStreamOptions<TPage, TItem>) {
  const [state, setState] = useState<StreamState<TItem>>(() => ({
    items: extract(pageData),
    status: pageData.meta.hasMore ? 'ready' : 'exhausted',
    total: pageData.meta.total,
    nextCursor: pageData.meta.nextCursor == null ? undefined : String(pageData.meta.nextCursor),
  }))

  // latest-ref：避免 effect 依赖每次新对象的回调/数据引用
  const extractRef = useRef(extract)
  extractRef.current = extract
  const fetchNextPageRef = useRef(fetchNextPage)
  fetchNextPageRef.current = fetchNextPage

  const stateRef = useRef(state)
  stateRef.current = state

  const fetchingRef = useRef(false)
  const isFirstRender = useRef(true)
  const prevRef = useRef({ filterKey, page })

  // ── loader 数据吸收：pageData/filterKey/page 变化时同步流状态 ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevRef.current = { filterKey, page }
      return
    }

    const { state: next, prevFilterKey, prevPage } = applyLoaderPage({
      pageData,
      extract: extractRef.current,
      filterKey,
      page,
      prevFilterKey: prevRef.current.filterKey,
      prevPage: prevRef.current.page,
      currentItems: stateRef.current.items,
    })
    prevRef.current = { filterKey: prevFilterKey, page: prevPage }
    setState(next)
  }, [pageData, filterKey, page])

  // ── 滚动续载：keyset cursor 优先，失败进入 error 态 ──
  const loadMore = useCallback(async () => {
    if (fetchingRef.current)
      return
    if (stateRef.current.status !== 'ready')
      return

    fetchingRef.current = true
    setState(prev => ({ ...prev, status: 'fetching' }))
    try {
      const res = await fetchNextPageRef.current({
        page: page + 1,
        cursor: stateRef.current.nextCursor,
      })
      if (res === null) {
        setState(prev => ({ ...prev, status: 'error' }))
        return
      }
      setState(prev => applyFetchedPage(prev, res, extractRef.current))
    }
    catch {
      setState(prev => ({ ...prev, status: 'error' }))
    }
    finally {
      fetchingRef.current = false
    }
  }, [page])

  /** 重试上一次失败的滚动续载（TweetFeedStatus 的"点击重试"） */
  const retry = useCallback(async () => {
    if (stateRef.current.status === 'error') {
      await loadMore()
    }
  }, [loadMore])

  return {
    items: state.items,
    status: state.status,
    total: state.total,
    nextCursor: state.nextCursor,
    /** 是否还有更多（status === 'ready'） */
    hasMore: state.status === 'ready',
    loadMore,
    retry,
  }
}
