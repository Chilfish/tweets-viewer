import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/media'
import type { FlatMediaItem } from '~/lib/media'
import type { StreamStatus } from '~/store/use-tweet-store'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useRevalidator, useSearchParams } from 'react-router'
import { MediaWall } from '~/components/media/MediaWall'
import { MediaHydrateFallback } from '~/components/skeletons/media'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { extractMediaFromTweets } from '~/lib/media'
import { apiClient } from '~/lib/utils'

export const handle = {
  isWide: true,
  skeleton: <MediaHydrateFallback />,
}

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Media` },
    { name: 'description', content: `Media gallery from @${name}` },
  ]
}

/**
 * Loader 读取 URL 当前页，作为该页注水数据（URL 驱动分页，与 tweets/ins 一致）。
 * 滚动追加下一页 / 分页器跳页，均由 URL page 变化 → loader 重跑驱动。
 */
export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const reverse = url.searchParams.get('reverse') === 'true'
  const start = url.searchParams.get('start') || undefined
  const end = url.searchParams.get('end') || undefined

  try {
    const { data: pageData } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/medias/${name}`, {
      params: { page, reverse, pageSize: PAGE_SIZE, start, end },
    })
    return { pageData }
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Response('User not found', { status: 404 })
    }
    throw error
  }
}

export default function MediaPage({ loaderData, params }: Route.ComponentProps) {
  const { pageData } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const revalidator = useRevalidator()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined
  const filterKey = `${params.name}-${reverse}-${start}-${end}`

  // 1. 纯客户端状态：从 loaderData 初始化，避免 effect 内同步 setState
  const [mediaItems, setMediaItems] = useState<FlatMediaItem[]>(() =>
    extractMediaFromTweets(pageData.data),
  )
  const [status, setStatus] = useState<StreamStatus>(() =>
    pageData.meta.hasMore ? 'ready' : 'exhausted',
  )
  const [totalCount, setTotalCount] = useState(() => pageData.meta.total)

  const isFirstMount = useRef(true)
  const lastPageRef = useRef(page)
  const prevFilterKey = useRef('')

  // 2. URL page 变化时同步 loader 数据：顺序下一页追加，否则（跳页/筛选变化）替换
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const isFilterChange = prevFilterKey.current !== filterKey
    prevFilterKey.current = filterKey

    const newMedia = extractMediaFromTweets(pageData.data)
    const isSequential = page === lastPageRef.current + 1

    if (isFilterChange || !isSequential) {
      // 筛选变化 / 分页器跳页 → 替换为当前页
      setMediaItems(newMedia)
    }
    else {
      // 滚动下一页 → 追加（按 id 去重）
      setMediaItems((prev) => {
        const existingIds = new Set(prev.map(i => i.id))
        return [...prev, ...newMedia.filter(i => !existingIds.has(i.id))]
      })
    }
    lastPageRef.current = page
    setTotalCount(pageData.meta.total)
    setStatus(pageData.meta.hasMore ? 'ready' : 'exhausted')
  }, [pageData, page, filterKey])

  // 3. 交互处理：滚动加载更多 = 更新 URL page（loader 自动重跑）
  const handleLoadMore = () => {
    if (status !== 'ready')
      return
    setSearchParams((prev) => {
      prev.set('page', ((Number(prev.get('page')) || 1) + 1).toString())
      return prev
    }, { replace: true })
  }

  // 计算总页数
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-6xl mx-auto px-4 h-11 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions hideComments />
        </div>
      </div>

      <div className="w-full max-w-6xl mt-4 mb-16">
        <MediaWall
          items={mediaItems}
          isLoading={status === 'fetching' && mediaItems.length === 0}
          isEmpty={status !== 'fetching' && mediaItems.length === 0}
        />

        <div className="mt-8 mb-10">
          <TweetFeedStatus
            status={status}
            hasTweets={mediaItems.length > 0}
            onRetry={() => revalidator.revalidate()}
          />
          {/* 触底触发器 */}
          <InfiniteScrollTrigger
            onIntersect={handleLoadMore}
            disabled={status !== 'ready'}
          />
        </div>
      </div>
    </>
  )
}
