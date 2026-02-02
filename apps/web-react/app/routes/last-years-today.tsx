import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/last-years-today'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { History } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useRouteLoaderData, useSearchParams } from 'react-router'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { apiClient } from '~/lib/utils'
import { useTweetStore } from '~/store/use-tweet-store'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `那年今日 - @${name}` },
    { name: 'description', content: `查看 @${name} 在往年今天的推文` },
  ]
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const reverse = url.searchParams.get('reverse') === 'true'

  try {
    const { data: paginatedTweets } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/get/${name}/last-years-today`, {
      params: {
        page,
        reverse,
        pageSize: PAGE_SIZE,
      },
    })

    return {
      paginatedTweets,
    }
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Response('User not found', { status: 404 })
    }
    throw error
  }
}

export default function LastYearsTodayPage({ loaderData, params }: Route.ComponentProps) {
  const { paginatedTweets } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()
  const layoutData = useRouteLoaderData('rootLayout') as { activeUser: EnrichedUser | null }
  const user = layoutData?.activeUser

  const prevFilterKey = useRef<string>('')
  const filterKey = `${params.name}-${reverse}`

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

    if (!paginatedTweets.meta.hasMore) {
      setStatus('exhausted')
    }
    else {
      setStatus('ready')
    }
  }, [paginatedTweets, filterKey, page, resetStream, appendTweets, setStatus])

  const totalCount = paginatedTweets.meta?.total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    setSearchParams((prev) => {
      const currentP = Number(prev.get('page')) || 1
      prev.set('page', (currentP + 1).toString())
      return prev
    }, { replace: true })
  }

  const renderTweets = () => {
    if (status !== 'fetching' && tweets.length === 0) {
      return (
        <div className="py-12 text-center flex flex-col gap-2 items-center justify-center text-muted-foreground">
          <History className="size-12 opacity-20" />
          <p>没有找到那年今日的推文</p>
        </div>
      )
    }

    return (
      <>
        <div className="flex flex-col gap-3">
          {tweets.map(tweet => (
            <MyTweet
              tweet={tweet}
              tweetAuthorName={user!.fullName}
              key={tweet.id}
            />
          ))}
        </div>

        <TweetFeedStatus
          status={status}
          hasTweets={tweets.length > 0}
          onRetry={() => window.location.reload()}
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
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions hideComments />
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 mt-4 mb-16">
        <div className="flex items-center gap-2 px-1 pt-2 pb-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="size-6 text-primary" />
            <span>那年今日</span>
          </h2>
          <span className="text-sm text-muted-foreground ml-auto bg-muted/50 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </span>
        </div>
        {renderTweets()}
      </div>
    </>
  )
}
