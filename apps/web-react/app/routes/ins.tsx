import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { InsMediaGrid } from '~/components/media/ins-media-grid'
import { TweetsSortControls } from '~/components/tweets/tweets-sort-controls'
import { UserHeader } from '~/components/user-header'
import type { SortOrder } from '~/stores'
import { useInsStore } from '~/stores/ins-store'
import { useUserStore } from '~/stores/user-store'
import type { Route } from './+types/media'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Instagram` },
    { name: 'description', content: `Instagram content from @${name}` },
  ]
}

export default function InsPage({ params }: Route.ComponentProps) {
  const { isLoading: userLoading, curUser } = useUserStore()
  const {
    data,
    loadInsData,
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
  } = useInsStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const isInitialized = useRef(false)

  useEffect(() => {
    const targetUserName = params.name
    if (!curUser || !targetUserName) return

    const userChanged = storeUser?.screenName !== targetUserName
    if (userChanged) {
      reset()
      setCurrentUser(curUser)
      isInitialized.current = false
    }

    if (!isInitialized.current && curUser.screenName === targetUserName) {
      const sortParam = (searchParams.get('sort') as SortOrder) || 'desc'

      setSortOrder(sortParam)
      loadInsData(curUser.screenName, true)
      isInitialized.current = true
    }
  }, [
    params.name,
    curUser,
    storeUser,
    searchParams,
    reset,
    setCurrentUser,
    setSortOrder,
    loadInsData,
  ])

  useEffect(() => {
    if (!isInitialized.current) return

    const params = new URLSearchParams()
    if (filters.sortOrder !== 'desc') {
      params.set('sort', filters.sortOrder)
    }

    setSearchParams(params, { replace: true })
  }, [filters, setSearchParams])

  // 自动加载更多内容确保页面有足够的媒体项
  useEffect(() => {
    const autoLoadMore = async () => {
      // 如果初始加载完成，媒体数量少于12个，且还有更多数据，就自动加载更多
      // 添加防抖机制，避免频繁触发
      if (
        !isLoading &&
        data.length > 0 &&
        data.length < 12 &&
        hasMore &&
        curUser &&
        isInitialized.current
      ) {
        // 添加延迟，避免与其他加载操作冲突
        setTimeout(() => {
          if (!isLoading) {
            loadMore()
          }
        }, 500)
      }
    }

    autoLoadMore()
  }, [data.length, isLoading, hasMore, loadMore, curUser])

  if (userLoading || !curUser) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  function getMediaContext(item: (typeof data)[0]) {
    if (!curUser) return null

    // 创建一个模拟的Instagram帖子（使用Tweet结构）
    const post = {
      id: item.postId,
      tweetId: item.postId,
      userId: curUser.screenName,
      createdAt: item.createdAt,
      fullText: item.fullText || '',
      media: [
        {
          url: item.url,
          type: item.type,
          width: item.width,
          height: item.height,
        },
      ],
      retweetCount: 0,
      quoteCount: 0,
      replyCount: 0,
      favoriteCount: 0,
      viewsCount: 0,
      retweetedStatus: null,
      quotedStatus: null,
    }

    // 找到同一个帖子的所有媒体
    const allMediaInPost = data.filter(
      (mediaItem) => mediaItem.postId === item.postId,
    )

    return {
      post,
      user: curUser,
      allMediaInPost,
    }
  }

  const isDataStale =
    storeUser && curUser && storeUser.screenName !== curUser.screenName

  return (
    <div className='min-h-svh bg-background transition-colors duration-200'>
      <div className='max-w-6xl mx-auto'>
        <UserHeader user={curUser} />

        <TweetsSortControls
          showDateFilter={false}
          showSortControls={true}
          sortFilterActions={{
            setSortOrder,
            setDateRange,
            filters,
          }}
        />

        <InsMediaGrid
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
