import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/tweets'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr/immutable'
import { UserTabs } from '~/components/layout/user-tabs'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { MyTweet } from '~/components/tweet/Tweet'
import { useTweetStore } from '~/store/use-tweet-store'
import { useUserStore } from '~/store/use-user-store'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Tweets` },
    { name: 'description', content: `See all tweets from @${name}` },
  ]
}

async function getTweets(username: string, page: number, reverse: boolean) {
  // 注意：如果后端 page 是从 0 开始的，这里可以按需调整，目前按 1 传递给后端
  const { data } = await axios.get<EnrichedTweet[]>(`${apiUrl}/tweets/get/${username}`, {
    params: { page, reverse },
  })
  return data
}

async function getUser(username: string) {
  const { data } = await axios.get<EnrichedUser>(`${apiUrl}/users/get/${username}`)
  return data
}

export default function TweetsPage({ params }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. 默认从第 1 页开始
  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()
  const setActiveUser = useUserStore(state => state.setActiveUser)

  const loaderRef = useRef<HTMLDivElement>(null)
  const prevNameRef = useRef<string>(params.name)

  // 1. 获取用户信息
  const { data: user } = useSWR(
    [params.name, 'user'],
    ([name]) => getUser(name),
  )

  // 2. 获取推文数据
  const { data: newData, isLoading, error } = useSWR(
    [params.name, 'tweets', page, reverse],
    ([name, _, p, rev]) => getTweets(name, p, rev),
    {
      revalidateOnFocus: false,
    },
  )

  // 同步当前用户到全局 Store
  useEffect(() => {
    if (user)
      setActiveUser(user)
  }, [user, setActiveUser])

  // 处理“用户切换”逻辑：仅当用户名变化时才执行硬重置
  useEffect(() => {
    if (prevNameRef.current !== params.name) {
      resetStream()
      // 清空 URL 中的分页参数
      if (searchParams.get('page')) {
        setSearchParams((prev) => {
          prev.delete('page')
          return prev
        }, { replace: true })
      }
      prevNameRef.current = params.name
    }
  }, [params.name, resetStream, setSearchParams, searchParams])

  // 同步推文数据到 Store
  useEffect(() => {
    if (isLoading) {
      setStatus('fetching')
    }
    else if (error) {
      setStatus('error')
    }
    else if (newData) {
      if (newData.length === 0) {
        // 如果第一页就没数据，直接 Ready；后续页没数据则视为 Exhausted
        setStatus(tweets.length > 0 ? 'exhausted' : 'ready')
      }
      else {
        appendTweets(newData)
      }
    }
  }, [isLoading, error, newData, setStatus, appendTweets, tweets.length])

  // 无限滚动监听
  useEffect(() => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSearchParams((prev) => {
            const currentP = Number(prev.get('page')) || 1
            prev.set('page', (currentP + 1).toString())
            return prev
          }, { replace: true })
        }
      },
      { threshold: 0.1, rootMargin: '300px' },
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [status, setSearchParams])

  return (
    <main className="min-h-svh bg-background flex flex-col items-center gap-4 py-6">
      {user && <ProfileHeader user={user} />}
      {user && <UserTabs user={user} />}

      <div className="w-full max-w-2xl flex flex-col gap-4 px-4 mt-2">
        {tweets.map(tweet => (
          <MyTweet tweet={tweet} key={tweet.id} />
        ))}

        {/* 底部加载状态指示器 */}
        <div ref={loaderRef} className="py-12 flex flex-col items-center justify-center min-h-20">
          {status === 'fetching' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm font-medium">正在获取推文...</span>
            </div>
          )}

          {status === 'exhausted' && (
            <p className="text-sm text-muted-foreground py-4 italic">
              — 已加载全部归档推文 —
            </p>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-destructive font-medium">加载失败</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-3 py-1 bg-secondary hover:bg-secondary/80 rounded transition-colors"
              >
                点击重试
              </button>
            </div>
          )}

          {tweets.length === 0 && !isLoading && status === 'ready' && (
            <div className="text-center p-12 text-muted-foreground">
              <p>该用户暂无推文归档。</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
