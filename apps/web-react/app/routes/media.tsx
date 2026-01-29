import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/media'
import type { PaginatedResponse } from './tweets'
import type { FlatMediaItem } from '~/lib/media'
import type { StreamStatus } from '~/store/use-tweet-store'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr/immutable'
import { MediaWall } from '~/components/media/MediaWall'
import { ProfileHeaderSkeleton } from '~/components/profile/profile-header-skeleton'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweets/tweets-toolbar-actions'
import { extractMediaFromTweets } from '~/lib/media'
import { useUserStore } from '~/store/use-user-store'

const PAGE_SIZE = 20

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Media` },
    { name: 'description', content: `Media gallery from @${name}` },
  ]
}

async function getTweets(username: string, page: number, reverse: boolean, start?: string, end?: string) {
  const { data } = await axios.get<PaginatedResponse<EnrichedTweet>>(`${apiUrl}/tweets/get/${username}`, {
    params: { page, reverse, pageSize: PAGE_SIZE, start, end },
  })
  return data
}

export default function MediaPage({ params }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined

  const { activeUser, setActiveUser } = useUserStore()
  const [mediaItems, setMediaItems] = useState<FlatMediaItem[]>([])
  const [status, setStatus] = useState<StreamStatus>('idle')

  // 1. 获取推文数据
  const { data: paginatedResponse, isLoading, error } = useSWR(
    [params.name, 'tweets-media-source', page, reverse, start, end],
    ([name, _, p, rev, s, e]) => getTweets(name, p, rev, s, e),
    { revalidateOnFocus: false },
  )

  const rawTweets = paginatedResponse?.data
  const meta = paginatedResponse?.meta

  // 2. 监听核心筛选参数变化，重置列表
  useEffect(() => {
    // 当筛选条件变化时，清空列表并重置状态
    // 注意：如果是切换用户(name变化)，也会触发
    setMediaItems([])
    setStatus('fetching')
  }, [params.name, reverse, start, end])

  // 3. 数据处理：提取、打平并追加媒体
  useEffect(() => {
    if (isLoading) {
      setStatus('fetching')
    }
    else if (error) {
      setStatus('error')
    }
    else if (rawTweets) {
      const newMedia = extractMediaFromTweets(rawTweets)

      // 判断是否耗尽
      // 这里的逻辑：如果当前返回数据为空，或者小于 PageSize (且不是第一页?)，通常意味着结束
      // 简单起见，如果 newMedia 为空，就是 exhausted (或者 empty)

      const isExhausted = newMedia.length === 0 || (meta && !meta.hasMore)

      setMediaItems((prev) => {
        // De-duplication
        const existingIds = new Set(prev.map(i => i.id))
        const uniqueNew = newMedia.filter(i => !existingIds.has(i.id))

        if (uniqueNew.length === 0)
          return prev
        return [...prev, ...uniqueNew]
      })

      if (isExhausted) {
        // 如果列表是空的，说明是 Empty 状态（ready but empty），TweetFeedStatus 会处理
        // 如果列表不为空，说明是 Exhausted
        // 为了配合 TweetFeedStatus: if (!hasTweets && status === 'ready') -> Empty
        // if (status === 'exhausted') -> "Archived"

        // 我们需要检查最终的 mediaItems 长度来决定是 Empty 还是 Exhausted，但这里拿不到最新的 mediaItems
        // 所以我们设置状态，而在渲染时判断 hasTweets

        // 如果 newMedia 是空的，且原本也没数据 -> Ready (Empty)
        // 如果 newMedia 是空的，但原本有数据 -> Exhausted
        // 这里的逻辑稍微复杂，因为 setMediaItems 是异步的。
        // 我们依赖下一次渲染的 status 决定

        setStatus((prevStatus) => {
          // 这里也很难拿到最新的 mediaItems length
          // 简化逻辑：
          // 如果 rawTweets 也是空的，暂且设为 ready (让 TweetFeedStatus 判断 !hasTweets)
          // 如果 rawTweets 不空但 newMedia 空 (都在 filtered)，设为 exhausted
          // 或者直接设为 exhausted，TweetFeedStatus 优先判断 !hasTweets

          // TweetFeedStatus logic:
          // if exhausted -> show "Exhausted" text
          // if ready and !hasTweets -> show "Empty" text

          // 如果是第一页且没数据 -> 应该显示 Empty -> Status: Ready, hasTweets: false
          // 如果是第 N 页且没数据 -> 应该显示 Exhausted -> Status: Exhausted

          if (page === 1 && newMedia.length === 0)
            return 'ready'
          if (newMedia.length === 0)
            return 'exhausted'
          if (meta && !meta.hasMore)
            return 'exhausted'

          return 'ready'
        })
      }
      else {
        setStatus('ready')
      }
    }
  }, [isLoading, error, rawTweets, page, meta])

  // 4. 用户信息同步
  const { data: userData } = useSWR(
    !activeUser || activeUser.userName !== params.name ? [params.name, 'user'] : null,
    async ([name]) => {
      const { data } = await axios.get(`${apiUrl}/users/get/${name}`)
      return data
    },
  )

  useEffect(() => {
    if (userData) {
      setActiveUser(userData)
    }
  }, [userData, setActiveUser])

  const user = activeUser && activeUser.userName === params.name ? activeUser : userData

  const totalTweets = meta?.total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalTweets / PAGE_SIZE)

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

  return (
    <main className="min-h-svh bg-background flex flex-col items-center">
      {user ? (
        <ProfileHeader user={user} />
      ) : (
        <div className="w-full flex justify-center">
          <ProfileHeaderSkeleton />
        </div>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-6xl mx-auto px-4 h-11 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions />
        </div>
      </div>

      <div className="w-full max-w-6xl px-4 mt-6 mb-20">
        <MediaWall
          items={mediaItems}
          isLoading={status === 'fetching' && mediaItems.length === 0}
          isEmpty={status === 'ready' && mediaItems.length === 0}
        />

        <TweetFeedStatus
          status={status}
          hasTweets={mediaItems.length > 0}
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
