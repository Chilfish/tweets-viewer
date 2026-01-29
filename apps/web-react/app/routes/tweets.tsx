import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/tweets'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr/immutable'
import { UserTabs } from '~/components/layout/user-tabs'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetPagination } from '~/components/tweet/TweetPagination'
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

/**
 * 通用分页响应接口
 */
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

async function getTweets(username: string, page: number, reverse: boolean) {
  const { data } = await axios.get<PaginatedResponse<EnrichedTweet>>(`${apiUrl}/tweets/get/${username}`, {
    params: { page, reverse, pageSize: PAGE_SIZE },
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

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()
  const setActiveUser = useUserStore(state => state.setActiveUser)
  const prevNameRef = useRef<string>(params.name)

  // 1. 获取用户信息
  const { data: user } = useSWR(
    [params.name, 'user'],
    ([name]) => getUser(name),
  )

  // 2. 获取当前页推文数据
  const { data: paginatedResponse, isLoading, error } = useSWR(
    [params.name, 'tweets', page, reverse],
    ([name, _, p, rev]) => getTweets(name, p, rev),
    { revalidateOnFocus: false },
  )

  // 数据层解析
  const newData = paginatedResponse?.data
  const meta = paginatedResponse?.meta

  useEffect(() => {
    if (user)
      setActiveUser(user)
  }, [user, setActiveUser])

  useEffect(() => {
    if (prevNameRef.current !== params.name) {
      resetStream()
      if (searchParams.get('page')) {
        setSearchParams((prev) => {
          prev.delete('page')
          return prev
        }, { replace: true })
      }
      prevNameRef.current = params.name
    }
  }, [params.name, resetStream, setSearchParams])

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

  // 优先使用后端返回的数据总量，如果没有则回退到用户信息中的计数
  const totalCount = meta?.total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // 这里的交互逻辑：
  // 1. 无限滚动负责“向下探索”
  // 2. 分页器负责“跨时空传送”和显示当前进度
  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return
    // 只有在还有更多数据时才触发下一页
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

  return (
    <main className="min-h-svh bg-background flex flex-col items-center">
      {user && (
        <div className="w-full flex flex-col items-center gap-2 ">
          <ProfileHeader user={user} />
          <UserTabs user={user} />
        </div>
      )}

      <TweetPagination totalPages={totalPages} />

      <div className="w-full max-w-2xl flex flex-col gap-4 px-4 mb-20">
        <div className="flex flex-col gap-2">
          {tweets.map(tweet => (
            <MyTweet tweet={tweet} key={tweet.id} />
          ))}
        </div>

        {/* 状态展示：仅展示，不负责触发逻辑 */}
        <TweetFeedStatus
          status={status}
          hasTweets={tweets.length > 0}
          onRetry={() => window.location.reload()}
        />

        <InfiniteScrollTrigger
          onIntersect={handleLoadMore}
          disabled={status === 'fetching' || status === 'exhausted' || status === 'error'}
        />
      </div>
    </main>
  )
}
