import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/search'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { Search, SearchX } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useRevalidator, useRouteLoaderData, useSearchParams } from 'react-router'
import { SearchInput } from '~/components/search-input'
import { TweetsHydrateFallback } from '~/components/skeletons/tweets'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { apiClient } from '~/lib/utils'
import { useTweetStore } from '~/store/use-tweet-store'

export const handle = {
  isWide: false,
  skeleton: <TweetsHydrateFallback />,
}

export function meta({ location }: Route.MetaArgs) {
  const params = new URLSearchParams(location.search)
  const q = params.get('q')
  return [
    { title: q ? `搜索「${q}」` : '搜索归档' },
    { name: 'description', content: '在归档中全文检索推文' },
  ]
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q') || ''
  const page = Number(url.searchParams.get('page')) || 1
  const username = params.name

  let paginatedTweets: PaginatedResponse<EnrichedTweet> = {
    data: [],
    meta: {
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      hasMore: false,
    },
  }

  if (q) {
    try {
      const tweetsRes = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/search`, {
        params: { q, name: username, page, pageSize: PAGE_SIZE },
      })
      paginatedTweets = tweetsRes.data
    }
    catch { /* ignore */ }
  }

  return { paginatedTweets, q }
}

export default function SearchPage({ loaderData, params }: Route.ComponentProps) {
  const { paginatedTweets, q: serverQ } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const page = Number(searchParams.get('page')) || 1
  const username = params.name

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()
  const revalidator = useRevalidator()
  const layoutData = useRouteLoaderData('rootLayout') as { activeUser: EnrichedUser | null }
  const user = layoutData?.activeUser

  const prevFilterKey = useRef<string>('')
  const filterKey = `${q}-${username}`

  useEffect(() => {
    let shouldReset = false
    if (prevFilterKey.current !== filterKey) {
      shouldReset = true
      prevFilterKey.current = filterKey
    }

    if (shouldReset || page === 1) {
      resetStream()
    }

    if (paginatedTweets.data.length > 0) {
      appendTweets(paginatedTweets.data)
    }

    if (!q) {
      setStatus('ready')
    }
    else {
      if (!paginatedTweets.meta.hasMore) {
        setStatus('exhausted')
      }
      else {
        setStatus('ready')
      }
    }
  }, [paginatedTweets, filterKey, page, resetStream, appendTweets, setStatus, q])

  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    setSearchParams((prev) => {
      const currentP = Number(prev.get('page')) || 1
      prev.set('page', (currentP + 1).toString())
      return prev
    }, { replace: true })
  }

  const renderContent = () => {
    if (!q) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/60">
            <Search className="size-7 text-muted-foreground/60" />
          </div>
          <p className="text-base font-medium">输入关键词开始搜索</p>
          <p className="text-sm text-muted-foreground">
            {username ? `在 @${username} 的归档中全文检索` : '支持全文检索归档推文'}
          </p>
        </div>
      )
    }

    if (tweets.length === 0 && status !== 'fetching' && status !== 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/60">
            <SearchX className="size-7 text-muted-foreground/60" />
          </div>
          <p className="text-base font-medium">没有找到匹配的推文</p>
          <p className="text-sm text-muted-foreground">
            换个关键词试试
            {username ? '，或清除用户筛选' : ''}
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="flex flex-col gap-3">
          {tweets.map(tweet => (
            <MyTweet
              tweet={tweet}
              tweetAuthorName={user?.fullName ?? username ?? ''}
              key={tweet.id}
            />
          ))}
        </div>

        <TweetFeedStatus
          status={status}
          hasTweets={tweets.length > 0}
          onRetry={() => revalidator.revalidate()}
        />

        <InfiniteScrollTrigger
          onIntersect={handleLoadMore}
          disabled={status === 'fetching' || status === 'exhausted' || status === 'error'}
        />
      </>
    )
  }

  return (
    <>
      {/* 搜索工具栏：与时间线/媒体同一 sticky glass 材质，滚动不消失 */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <SearchInput
            user={user ?? undefined}
            defaultValue={q || serverQ}
            placeholder={username ? `搜索 @${username} 的推文` : '搜索全部归档推文'}
            className="flex-1"
          />
          {username && (
            <span className="hidden sm:inline-flex shrink-0 items-center text-xs text-muted-foreground">
              在 @
              {username}
              {' '}
              中
            </span>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 mt-4 mb-16">
        {q && tweets.length > 0 && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-sm font-semibold text-foreground">
              「
              {q}
              」
            </span>
            <span className="text-xs text-muted-foreground">
              ·
              {' '}
              {paginatedTweets.meta?.total ?? 0}
              {' '}
              条结果
            </span>
          </div>
        )}
        {renderContent()}
      </div>
    </>
  )
}
