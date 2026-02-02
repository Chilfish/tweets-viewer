import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/media'
import type { FlatMediaItem } from '~/lib/media'
import type { StreamStatus } from '~/store/use-tweet-store'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MediaWall } from '~/components/media/MediaWall'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { extractMediaFromTweets } from '~/lib/media'
import { apiClient } from '~/lib/utils'

export const handle = {
  isWide: true,
}

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Media` },
    { name: 'description', content: `Media gallery from @${name}` },
  ]
}

/**
 * Loader 现在仅处理第一页，作为首屏注水数据
 */
export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const reverse = url.searchParams.get('reverse') === 'true'
  const start = url.searchParams.get('start') || undefined
  const end = url.searchParams.get('end') || undefined

  try {
    const { data: firstPage } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/medias/${name}`, {
      params: { page: 1, reverse, pageSize: PAGE_SIZE, start, end },
    })
    return { firstPage }
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Response('User not found', { status: 404 })
    }
    throw error
  }
}

export default function MediaPage({ loaderData, params }: Route.ComponentProps) {
  const { firstPage } = loaderData
  const [searchParams] = useSearchParams()

  // 1. 纯客户端状态：分页、数据、状态
  const [mediaItems, setMediaItems] = useState<FlatMediaItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [totalCount, setTotalCount] = useState(0)

  // 过滤参数 (来自 URL)
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined
  const filterKey = `${params.name}-${reverse}-${start}-${end}`

  // 2. 核心：数据获取逻辑 (封装为纯客户端调用)
  const fetchNextPage = useCallback(async (pageNum: number, isReset = false) => {
    setStatus('fetching')
    try {
      const { data: response } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/medias/${params.name}`, {
        params: { page: pageNum, reverse, pageSize: PAGE_SIZE, start, end },
      })

      const newMedia = extractMediaFromTweets(response.data)

      setMediaItems((prev) => {
        if (isReset)
          return newMedia
        const existingIds = new Set(prev.map(i => i.id))
        return [...prev, ...newMedia.filter(i => !existingIds.has(i.id))]
      })

      setTotalCount(response.meta.total)
      setStatus(response.meta.hasMore ? 'ready' : 'exhausted')
    }
    catch (error) {
      console.error('Failed to fetch media:', error)
      setStatus('error')
    }
  }, [params.name, reverse, start, end])

  // 3. 处理初始化与过滤器重置
  const isFirstMount = useRef(true)
  useEffect(() => {
    // 首次加载，直接从 loaderData (注水数据) 初始化
    if (isFirstMount.current) {
      const initialMedia = extractMediaFromTweets(firstPage.data)
      setMediaItems(initialMedia)
      setTotalCount(firstPage.meta.total)
      setStatus(firstPage.meta.hasMore ? 'ready' : 'exhausted')
      setCurrentPage(1)
      isFirstMount.current = false
      return
    }

    // 当过滤器改变（URL 变化）时，重置并重新抓取第 1 页
    setCurrentPage(1)
    fetchNextPage(1, true)
  }, [filterKey, firstPage]) // 同时也监听 firstPage 以应对路由切换

  // 4. 交互处理
  const handleLoadMore = () => {
    if (status !== 'ready')
      return
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchNextPage(nextPage)
  }

  const handlePageChange = (targetPage: number) => {
    if (targetPage === currentPage || status === 'fetching')
      return
    // 点击跳转依然会导致列表重新从该页开始（因为我们是瀑布流结合分页）
    // 但根据需求，这里我们采取“跳转即重置”逻辑，或者“滚动到”逻辑
    // 这里保持简单：跳转到新页并重置列表
    setCurrentPage(targetPage)
    fetchNextPage(targetPage, true)
  }

  // 计算总页数
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-6xl mx-auto px-4 h-11 flex items-center justify-between gap-4">
          <TweetNavigation
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
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
            onRetry={handleLoadMore}
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
