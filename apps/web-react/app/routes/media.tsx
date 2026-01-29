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
  const [searchParams] = useSearchParams()

  // Use local state for pagination instead of URL persistence
  const [page, setPage] = useState(1)

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
    setMediaItems([])
    setStatus('fetching')
    setPage(1)
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
        setStatus((prevStatus) => {
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

  // Calculate total pages logic similar to original
  const totalTweets = meta?.total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalTweets / PAGE_SIZE)

  // Use local state for pagination
  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    if (meta && !meta.hasMore) {
      setStatus('exhausted')
      return
    }

    setPage(prev => prev + 1)
  }

  const handlePageChange = (newPage: number) => {
    // If the user jumps to a new page, we might want to clear existing items
    // to strictly simulate "going to that page" rather than infinite scroll gap.
    // However, existing logic is purely append-based relying on SWR.
    // To be safe and visually consistent:
    if (newPage === 1) {
      setMediaItems([])
    }
    setPage(newPage)
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
          <TweetNavigation
            totalPages={totalPages}
            currentPage={page}
            onPageChange={handlePageChange}
          />
          <TweetsToolbarActions />
        </div>
      </div>

      <div className="w-full max-w-6xl px-4 mt-6 mb-20">
        <MediaWall
          items={mediaItems}
          isLoading={status === 'fetching' && mediaItems.length === 0}
          isEmpty={status === 'ready' && mediaItems.length === 0}
        />

        <div className="mt-8 mb-10">
          <TweetFeedStatus
            status={status}
            hasTweets={mediaItems.length > 0}
          />
          <InfiniteScrollTrigger
            onIntersect={handleLoadMore}
            status={status}
          />
        </div>
      </div>
    </main>
  )
}
