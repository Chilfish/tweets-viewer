import type { PaginatedResponse } from '@tweets-viewer/shared'
import { describe, expect, it } from 'vitest'
import {
  appendUnique,
  applyFetchedPage,
  applyLoaderPage,
} from '../paginated-stream'

interface Item {
  id: string
  text: string
}

function pageOf(items: Item[], hasMore: boolean, nextCursor?: string): PaginatedResponse<Item> {
  return {
    data: items,
    meta: { total: 100, page: 1, pageSize: 15, hasMore, nextCursor },
  }
}

const A = { id: '1', text: 'a' }
const B = { id: '2', text: 'b' }
const C = { id: '3', text: 'c' }

const identity = (data: PaginatedResponse<Item>) => data.data

describe('appendUnique', () => {
  it('should append and dedupe by id', () => {
    expect(appendUnique([A, B], [B, C])).toEqual([A, B, C])
  })
})

describe('applyLoaderPage (loader 数据吸收契约)', () => {
  it('should replace on filter change', () => {
    const { state } = applyLoaderPage({
      pageData: pageOf([C], true, '3'),
      extract: identity,
      filterKey: 'user-reverse',
      page: 1,
      prevFilterKey: 'user',
      prevPage: 1,
      currentItems: [A, B],
    })
    expect(state.items).toEqual([C])
    expect(state.status).toBe('ready')
    expect(state.nextCursor).toBe('3')
    expect(state.loadedPages).toBe(1)
  })

  it('should replace on page jump (non-sequential page)', () => {
    const { state } = applyLoaderPage({
      pageData: pageOf([C], true),
      extract: identity,
      filterKey: 'user',
      page: 5,
      prevFilterKey: 'user',
      prevPage: 1,
      currentItems: [A, B],
    })
    expect(state.items).toEqual([C])
    expect(state.loadedPages).toBe(5)
  })

  it('should append (deduped) on sequential next page', () => {
    const { state } = applyLoaderPage({
      pageData: pageOf([B, C], true, '3'),
      extract: identity,
      filterKey: 'user',
      page: 2,
      prevFilterKey: 'user',
      prevPage: 1,
      currentItems: [A, B],
    })
    expect(state.items).toEqual([A, B, C])
    expect(state.loadedPages).toBe(2)
  })

  it('should track prev values for next absorption', () => {
    const { prevFilterKey, prevPage } = applyLoaderPage({
      pageData: pageOf([A], false),
      extract: identity,
      filterKey: 'user',
      page: 2,
      prevFilterKey: 'user',
      prevPage: 1,
      currentItems: [A],
    })
    expect(prevFilterKey).toBe('user')
    expect(prevPage).toBe(2)
  })

  it('should mark exhausted when hasMore is false', () => {
    const { state } = applyLoaderPage({
      pageData: pageOf([A], false),
      extract: identity,
      filterKey: 'user',
      page: 1,
      prevFilterKey: 'user',
      prevPage: 1,
      currentItems: [],
    })
    expect(state.status).toBe('exhausted')
    expect(state.loadedPages).toBe(1)
  })
})

describe('applyFetchedPage (滚动续载吸收契约)', () => {
  it('should extract, append deduped items and update cursor/status', () => {
    const next = applyFetchedPage(
      { items: [A, B], status: 'ready', total: 100, nextCursor: '2', loadedPages: 1 },
      pageOf([B, C], true, '3'),
      identity,
    )
    expect(next.items).toEqual([A, B, C])
    expect(next.nextCursor).toBe('3')
    expect(next.status).toBe('ready')
    expect(next.total).toBe(100)
    // 续载成功：已加载页数 +1（URL page 同步的基准）
    expect(next.loadedPages).toBe(2)
  })

  it('should mark exhausted when no more', () => {
    const next = applyFetchedPage(
      { items: [A], status: 'ready', total: 100, nextCursor: '1', loadedPages: 4 },
      pageOf([C], false),
      identity,
    )
    expect(next.status).toBe('exhausted')
    expect(next.nextCursor).toBeUndefined()
    expect(next.loadedPages).toBe(5)
  })

  it('should normalize numeric cursor to string', () => {
    const next = applyFetchedPage(
      { items: [A], status: 'ready', total: 100, loadedPages: 1 },
      { data: [C], meta: { total: 100, page: 2, pageSize: 15, hasMore: true, nextCursor: 42 } },
      identity,
    )
    expect(next.nextCursor).toBe('42')
    expect(next.loadedPages).toBe(2)
  })
})
