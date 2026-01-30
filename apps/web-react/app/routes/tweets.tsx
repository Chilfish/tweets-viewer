import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/tweets'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr/immutable'
import { ProfileHeaderSkeleton } from '~/components/profile/profile-header-skeleton'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetSkeleton } from '~/components/tweet/tweet-skeleton'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweets/tweets-toolbar-actions'
import { useTweetStore } from '~/store/use-tweet-store'
import { useUserStore } from '~/store/use-user-store'

const PAGE_SIZE = 10

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Tweets` },
    { name: 'description', content: `See all tweets from @${name}` },
  ]
}

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

async function getTweets(username: string, page: number, reverse: boolean, start?: string, end?: string) {
  const { data } = await axios.get<PaginatedResponse<EnrichedTweet>>(`${apiUrl}/tweets/get/${username}`, {
    params: { page, reverse, pageSize: PAGE_SIZE, start, end },
  })
  return data
}

async function getUser(username: string) {
  const { data } = await axios.get<EnrichedUser>(`${apiUrl}/users/get/${username}`)
  return data
}

export default function TweetsPage({ params }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()
  const setActiveUser = useUserStore(state => state.setActiveUser)
  const prevNameRef = useRef<string>(params.name)

  const { data: user, isLoading: userIsLoading } = useSWR(
    [params.name, 'user'],
    ([name]) => getUser(name),
  )

  const { data: paginatedResponse, isLoading, error } = useSWR(
    [params.name, 'tweets', page, reverse, start, end],
    ([name, _, p, rev, s, e]) => getTweets(name, p, rev, s, e),
    { revalidateOnFocus: false },
  )

  const newData = paginatedResponse?.data
  const meta = paginatedResponse?.meta

  useEffect(() => {
    if (user)
      setActiveUser(user)
  }, [user, setActiveUser])

  useEffect(() => {
    resetStream()
  }, [params.name, reverse, start, end, resetStream])

  useEffect(() => {
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
  }, [isLoading, error, newData, setStatus, appendTweets, tweets.length])

  const totalCount = meta?.total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

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

  // 渲染逻辑分支：优先处理加载状态
  const renderProfile = () => {
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

  const renderTweets = () => {
    // 初始加载或 Hard Reload 时的骨架屏
    if (isLoading && tweets.length === 0) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TweetSkeleton key={i} />
      ))
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
    <main className="min-h-svh bg-background flex flex-col items-center">
      {renderProfile()}

      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions />
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 px-4 mt-4 mb-20">
        {renderTweets()}
      </div>
    </main>
  )
}
