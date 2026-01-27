import type { Route } from './+types/media'
import type { SortOrder } from '~/stores'
import type { MediaItem } from '~/stores/media-store'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { MediaGrid } from '~/components/media/media-grid'
import { TweetsSortControls } from '~/components/tweets/tweets-sort-controls'
import { UserHeader } from '~/components/user-header'
import { useMediaStore, useTweetsStore } from '~/stores'
import { useUserStore } from '~/stores/user-store'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Medias` },
    { name: 'description', content: `Medias of tweets from @${name}` },
  ]
}

export default function MediaPage({ params }: Route.ComponentProps) {
  const { isLoading: userLoading, curUser } = useUserStore()
  const { getTweetById } = useTweetsStore()
  const {
    data,
    loadMedia,
    setCurrentUser,
    isLoading,
    hasMore,
    error,
    loadMore,
    setSortOrder,
    setDateRange,
    filters,
    reset,
    currentUser: storeUser,
  } = useMediaStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const isInitialized = useRef(false)

  useEffect(() => {
    const targetUserName = params.name
    if (!curUser || !targetUserName)
      return

    const userChanged = storeUser?.screenName !== targetUserName
    if (userChanged) {
      reset()
      setCurrentUser(curUser)
      isInitialized.current = false
    }

    if (!isInitialized.current && curUser.screenName === targetUserName) {
      const sortParam = (searchParams.get('sort') as SortOrder) || 'desc'
      const startDateParam = searchParams.get('startDate')
      const endDateParam = searchParams.get('endDate')

      setSortOrder(sortParam)
      setDateRange({
        startDate: startDateParam ? new Date(startDateParam) : null,
        endDate: endDateParam ? new Date(endDateParam) : null,
      })

      loadMedia(curUser.screenName, true)
      isInitialized.current = true
    }
  }, [
    params.name, // Depend directly on the URL parameter
    curUser,
    storeUser,
    searchParams,
    reset,
    setCurrentUser,
    setSortOrder,
    setDateRange,
    loadMedia,
  ])

  useEffect(() => {
    if (!isInitialized.current)
      return

    const params = new URLSearchParams()
    if (filters.sortOrder !== 'desc') {
      params.set('sort', filters.sortOrder)
    }
    if (filters.dateRange.startDate) {
      params.set(
        'startDate',
        filters.dateRange.startDate.toISOString().split('T')[0],
      )
    }
    if (filters.dateRange.endDate) {
      params.set(
        'endDate',
        filters.dateRange.endDate.toISOString().split('T')[0],
      )
    }

    setSearchParams(params, { replace: true })
  }, [filters, setSearchParams])

  // 自动加载更多内容确保页面有足够的媒体项
  useEffect(() => {
    const autoLoadMore = async () => {
      // 如果初始加载完成，媒体数量少于15个，且还有更多数据，就自动加载更多
      if (
        !isLoading
        && data.length > 0
        && data.length < 15
        && hasMore
        && curUser
      ) {
        await loadMore()
      }
    }

    autoLoadMore()
  }, [data.length, isLoading, hasMore, loadMore, curUser])

  if (userLoading || !curUser) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  function getMediaContext(item: MediaItem) {
    const tweet = getTweetById(item.tweetId)
    if (!tweet || !curUser)
      return null

    const allMediaInTweet: MediaItem[] = tweet.media.map((media, index) => ({
      ...media,
      id: `${tweet.tweetId}-${index}`,
      tweetId: tweet.tweetId,
      createdAt: tweet.createdAt,
    }))

    return {
      tweet,
      user: curUser,
      allMediaInTweet,
    }
  }

  const isDataStale
    = storeUser && curUser && storeUser.screenName !== curUser.screenName

  return (
    <div className="min-h-svh bg-background transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <UserHeader user={curUser} />

        <TweetsSortControls
          showDateFilter={true}
          showSortControls={true}
          sortFilterActions={{
            setSortOrder,
            setDateRange,
            filters,
          }}
        />

        <MediaGrid
          mediaItems={isDataStale ? [] : data}
          paginationActions={{
            isLoading,
            hasMore,
            error,
            loadMore,
          }}
          getMediaContext={getMediaContext}
        />
      </div>
    </div>
  )
}
