import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/search'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr/immutable'
import { ProfileHeaderSkeleton } from '~/components/profile/profile-header-skeleton'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { SearchInput } from '~/components/search-input'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetSkeleton } from '~/components/tweet/tweet-skeleton'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { useTweetStore } from '~/store/use-tweet-store'

const PAGE_SIZE = 20

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    hasMore: boolean
    nextCursor?: number | string
  }
}

export function meta({ location }: Route.MetaArgs) {
  const params = new URLSearchParams(location.search)
  const q = params.get('q')
  return [
    { title: q ? `Search: ${q}` : 'Search Tweets' },
    { name: 'description', content: 'Search tweets' },
  ]
}

async function searchTweets(q: string, name: string | null, page: number) {
  const { data } = await axios.get<PaginatedResponse<EnrichedTweet>>(`${apiUrl}/tweets/search`, {
    params: { q, name, page, pageSize: PAGE_SIZE },
  })
  return data
}

async function getUser(username: string) {
  const { data } = await axios.get<EnrichedUser>(`${apiUrl}/users/get/${username}`)
  return data
}

export default function SearchPage({ params }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const username = params.name
  const page = Number(searchParams.get('page')) || 1

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()

  const { data: user, isLoading: userIsLoading } = useSWR(
    username ? [username, 'user'] : null,
    ([name]) => getUser(name),
  )

  const { data: paginatedResponse, isLoading, error } = useSWR(
    q ? ['search', q, username, page] : null,
    ([_, qVal, uVal, pVal]) => searchTweets(qVal, uVal || null, pVal as number),
    { revalidateOnFocus: false },
  )

  const newData = paginatedResponse?.data
  const meta = paginatedResponse?.meta

  useEffect(() => {
    resetStream()
  }, [q, username, resetStream])

  useEffect(() => {
    if (!q) {
      setStatus('ready')
      return
    }

    if (isLoading) {
      setStatus('fetching')
    }
    else if (error) {
      setStatus('error')
    }
    else if (newData) {
      if (newData.length === 0) {
        setStatus(tweets.length > 0 ? 'exhausted' : 'ready')
      }
      else {
        appendTweets(newData)
      }
    }
  }, [isLoading, error, newData, setStatus, appendTweets, tweets.length, q])

  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    if (meta && !meta.hasMore) {
      setStatus('exhausted')
      return
    }

    setSearchParams((prev) => {
      const currentP = Number(prev.get('page')) || 1
      prev.set('page', (currentP + 1).toString())
      return prev
    }, { replace: true })
  }

  const renderProfileCtx = () => {
    if (!username)
      return null
    if (userIsLoading && !user) {
      return (
        <div className="w-full flex justify-center">
          <ProfileHeaderSkeleton />
        </div>
      )
    }
    if (user) {
      return (
        <div className="w-full flex flex-col items-center gap-2 py-2">
          <ProfileHeader user={user} />
        </div>
      )
    }
    return null
  }

  const renderContent = () => {
    if (!q) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <div className="text-lg">Enter keywords to search</div>
        </div>
      )
    }

    // Initial loading or skeleton
    if (isLoading && tweets.length === 0) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TweetSkeleton key={i} />
      ))
    }

    // No results found
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
            <MyTweet tweet={tweet} key={tweet.id} />
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
    <main className="min-h-svh bg-background flex flex-col justify-center mx-auto gap-2 items-center sm:max-w-[600px]">
      {renderProfileCtx()}

      <SearchInput
        user={user}
        defaultValue={q}
        placeholder={username ? `Search tweets by ${username}...` : 'Search tweets...'}
        className="px-4 w-full mx-auto"
      />

      <div className="w-full max-w-3xl flex flex-col gap-4 px-4 mt-4 mb-20">
        {renderContent()}
      </div>
    </main>
  )
}
