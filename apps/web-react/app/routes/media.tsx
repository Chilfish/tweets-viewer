import { useEffect } from 'react'
import { Link } from 'react-router'
import { MediaGrid } from '~/components/media/media-grid'
import { TweetsSortControls } from '~/components/tweets/tweets-sort-controls'
import { UserHeader } from '~/components/user-header'
import { useMediaStore, useTweetsStore } from '~/stores'
import type { MediaItem } from '~/stores/media-store'
import { useUserStore } from '~/stores/user-store'
import type { Route } from './+types/media'

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
  } = useMediaStore()

  useEffect(() => {
    if (curUser?.screenName) {
      // 重置store状态，清除之前用户的数据
      reset()
      setCurrentUser(curUser)
      loadMedia(curUser.screenName)
    }
  }, [curUser, reset, setCurrentUser, loadMedia])

  // 自动加载更多内容确保页面有足够的媒体项
  useEffect(() => {
    const autoLoadMore = async () => {
      // 如果初始加载完成，媒体数量少于15个，且还有更多数据，就自动加载更多
      if (
        !isLoading &&
        data.length > 0 &&
        data.length < 15 &&
        hasMore &&
        curUser
      ) {
        await loadMore()
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

  function getMediaContext(item: MediaItem) {
    const tweet = getTweetById(item.tweetId)
    if (!tweet || !curUser) return null
    return {
      tweet,
      user: curUser,
      allMediaInTweet: tweet.media as MediaItem[],
    }
  }

  return (
    <div className='min-h-svh bg-background transition-colors duration-200'>
      <div className='max-w-6xl mx-auto'>
        <UserHeader user={curUser} />

        {/* Tabs */}
        <div className='border-b border-border px-4 transition-colors duration-200'>
          <div className='flex'>
            <Link
              to={`/tweets/${curUser.screenName}`}
              className='px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200'
            >
              Tweets
            </Link>
            <div className='px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary'>
              Media
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className='p-4 border-b border-border bg-card'>
          <TweetsSortControls
            showDateFilter={true}
            showSortControls={true}
            sortFilterActions={{
              setSortOrder,
              setDateRange,
              filters,
            }}
          />
        </div>

        <MediaGrid
          mediaItems={data}
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
