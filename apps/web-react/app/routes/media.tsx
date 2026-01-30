import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/media'
import type { FlatMediaItem } from '~/lib/media'
import type { StreamStatus } from '~/store/use-tweet-store'
import { apiUrl, PAGE_SIZE } from '@tweets-viewer/shared'
import axios, { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useRouteLoaderData, useSearchParams } from 'react-router'
import { MediaWall } from '~/components/media/MediaWall'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweets/tweets-toolbar-actions'
import { extractMediaFromTweets } from '~/lib/media'
import { useUserStore } from '~/store/use-user-store'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Media` },
    { name: 'description', content: `Media gallery from @${name}` },
  ]
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const reverse = url.searchParams.get('reverse') === 'true'
  const start = url.searchParams.get('start') || undefined
  const end = url.searchParams.get('end') || undefined

  try {
    const { data: paginatedTweets } = await axios.get<PaginatedResponse<EnrichedTweet>>(`${apiUrl}/tweets/get/${name}`, {
      params: { page, reverse, pageSize: PAGE_SIZE, start, end },
    })

    return {
      paginatedTweets,
    }
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Response('User not found', { status: 404 })
    }
    throw error // Let ErrorBoundary handle it
  }
}

export default function MediaPage({ loaderData, params }: Route.ComponentProps) {
  const { paginatedTweets } = loaderData
  const [searchParams, setSearchParams] = useSearchParams() // URL state is primary now

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined

  const { activeUser: userFromStore } = useUserStore()
  const layoutData = useRouteLoaderData('rootLayout') as { activeUser: EnrichedUser | null }
  const user = layoutData?.activeUser || userFromStore
  const [mediaItems, setMediaItems] = useState<FlatMediaItem[]>([])
  const [status, setStatus] = useState<StreamStatus>('idle')

  const prevFilterKey = useRef<string>('')
  const filterKey = `${params.name}-${reverse}-${start}-${end}`

  // Hydrate Media Items
  useEffect(() => {
    let shouldReset = false
    if (prevFilterKey.current !== filterKey) {
      shouldReset = true
      prevFilterKey.current = filterKey
    }

    if (shouldReset) {
      setMediaItems([])
      setStatus('fetching')
      // If we reset, we expect page 1 data.
      // If URL is ?page=3, we get page 3 data.
      // We append it.
    }
    else if (page === 1) {
      // Explicit page 1 reload
      setMediaItems([])
    }

    const newMedia = extractMediaFromTweets(paginatedTweets.data)

    setMediaItems((prev) => {
      // If we reset (shouldReset), prev should be ignored if we handled it above.
      // But above we setMediaItems([]) async? No, setState is async.
      // So we need to handle it here.

      let base = prev
      if (shouldReset || page === 1) {
        base = []
      }

      // De-duplication
      const existingIds = new Set(base.map(i => i.id))
      const uniqueNew = newMedia.filter(i => !existingIds.has(i.id))

      return [...base, ...uniqueNew]
    })

    if (!paginatedTweets.meta.hasMore) {
      setStatus('exhausted')
    }
    else {
      setStatus('ready')
    }
  }, [paginatedTweets, filterKey, page])

  // Calculate total pages
  const totalTweets = paginatedTweets.meta?.total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalTweets / PAGE_SIZE)

  // Use URL for pagination now
  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    setSearchParams((prev) => {
      const currentP = Number(prev.get('page')) || 1
      prev.set('page', (currentP + 1).toString())
      return prev
    }, { replace: true })
  }

  // Custom Handler for jump pagination (MediaPage had full pagination UI)
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString())
      return prev
    }, { replace: true })
  }

  return (
    <main className="min-h-svh bg-background flex flex-col items-center">
      <div className="w-full flex flex-col items-center gap-2 py-2">
        <ProfileHeader user={user} />
      </div>

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
          isLoading={false}
          isEmpty={status === 'ready' && mediaItems.length === 0}
        />

        <div className="mt-8 mb-10">
          <TweetFeedStatus
            status={status}
            hasTweets={mediaItems.length > 0}
            onRetry={handleLoadMore}
          />
          <InfiniteScrollTrigger
            onIntersect={handleLoadMore}
            disabled={status === 'fetching' || status === 'exhausted' || status === 'error'}
          />
        </div>
      </div>
    </main>
  )
}
