import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/search'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { useEffect, useRef } from 'react'
import { useRouteLoaderData, useSearchParams } from 'react-router'
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
    { title: q ? `Search: ${q}` : 'Search Tweets' },
    { name: 'description', content: 'Search tweets' },
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
    catch (e) { /* ignore */ }
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
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <div className="text-lg">Enter keywords to search</div>
        </div>
      )
    }

    if (tweets.length === 0 && status !== 'fetching' && status !== 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <div className="text-lg">No tweets found</div>
          <div className="text-sm">
            Try different keywords
            {username ? ' or clear user filter' : ''}
          </div>
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
      <SearchInput
        user={user ?? undefined}
        defaultValue={q}
        placeholder={username ? `Search tweets by ${username}...` : 'Search tweets...'}
        className="px-4 w-full mx-auto"
      />

      <div className="w-full max-w-3xl flex flex-col gap-4 mt-4 mb-16">
        {renderContent()}
      </div>
    </>
  )
}
