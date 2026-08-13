import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/media'
import type { FlatMediaItem } from '~/lib/media'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { useSearchParams } from 'react-router'
import { FeedStatus } from '~/components/feed-status'
import { MediaWall } from '~/components/media/MediaWall'
import { MediaHydrateFallback } from '~/components/skeletons/media'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { YearNavigator } from '~/components/tweet/year-navigator'
import { useUrlPaginatedStream } from '~/hooks/use-url-paginated-stream'
import { extractMediaFromTweets } from '~/lib/media'
import { apiClient } from '~/lib/utils'

export const handle = {
  isWide: true,
  pageTransition: 'slide',
  skeleton: <MediaHydrateFallback />,
}

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name} 的媒体` },
    { name: 'description', content: `查看 @${name} 的媒体墙` },
  ]
}

/**
 * Loader 读取 URL 当前页，作为该页注水数据（URL 驱动分页，与 tweets/ins 一致）。
 * 滚动续载走 keyset cursor（不写 URL）；分页器跳页由 URL page 变化 → loader 重跑驱动。
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
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined

  const { items, status, total, loadMore, retry } = useUrlPaginatedStream<EnrichedTweet, FlatMediaItem>({
    pageData,
    extract: data => extractMediaFromTweets(data.data),
    filterKey: `${params.name}-${reverse}-${start}-${end}`,
    page,
    fetchNextPage: async ({ cursor }) => {
      try {
        const { data } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/medias/${params.name}`, {
          params: {
            page: page + 1,
            pageSize: PAGE_SIZE,
            reverse,
            start,
            end,
            cursor,
          },
        })
        return data
      }
      catch {
        return null
      }
    },
  })

  // 计算总页数
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 h-11 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto">
          <TweetNavigation totalPages={totalPages} className="shrink-0" />
          <div className="flex min-w-0 items-center gap-1 shrink-0">
            <YearNavigator name={params.name} />
            <TweetsToolbarActions hideComments />
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-4 mb-16">
        {/* 5B-3：跳页/筛选变化 → 媒体墙整体淡入；滚动续载追加的卡片各自入场 */}
        <div key={searchParams.toString()} className="animate-in fade-in duration-300">
          <MediaWall
            items={items}
            isLoading={status === 'fetching' && items.length === 0}
            isEmpty={status !== 'fetching' && items.length === 0}
          />
        </div>

        <div className="mt-8 mb-10">
          <FeedStatus
            status={status}
            hasItems={items.length > 0}
            onRetry={retry}
            // MediaWall 内置空态，FeedStatus 只负责尾部加载/错误/已全部
            hideEmptyState
            tailText="已加载全部媒体"
          />
          {/* 触底触发器 */}
          <InfiniteScrollTrigger
            onIntersect={loadMore}
            disabled={status !== 'ready'}
          />
        </div>
      </div>
    </>
  )
}
