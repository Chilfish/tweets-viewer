/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useInfiniteScroll } from '~/hooks/use-infinite-scroll'
import { cn } from '~/lib/utils'
import { useTweetsStore } from '~/stores/tweets-store'
import type { User } from '~/types'
import { TweetCard } from './tweet-card'
import { TweetsSortControls } from './tweets-sort-controls'

interface TweetsListProps {
  user: User
  showSortControls?: boolean
}

export function TweetsList({ user, showSortControls = true }: TweetsListProps) {
  const {
    tweets,
    isLoading,
    hasMore,
    error,
    loadTweets,
    loadMoreTweets,
    setCurrentUser,
  } = useTweetsStore()

  const handleLoadMore = () => {
    loadMoreTweets(user.screenName)
  }

  const { loadingRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: handleLoadMore,
  })

  useEffect(() => {
    setCurrentUser(user)
    loadTweets(user.screenName, true)
  }, [user.screenName, setCurrentUser, loadTweets])

  if (tweets.length === 0 && isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='size-6 animate-spin' />
        <span className='ml-2 text-sm text-muted-foreground'>
          Loading tweets...
        </span>
      </div>
    )
  }

  if (error && tweets.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-500 mb-4'>{error}</p>
        <button
          onClick={() => loadTweets(user.screenName, true)}
          className='text-blue-500 hover:text-blue-600'
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Sort Controls */}
      {showSortControls && tweets.length > 0 && (
        <div className='p-4 border-b border-border bg-card'>
          <TweetsSortControls />
        </div>
      )}

      <div className='divide-y divide-border'>
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} user={user} />
        ))}
      </div>

      {/* Loading indicator */}
      <div ref={loadingRef} className='py-4'>
        {isLoading && (
          <div className='flex items-center justify-center'>
            <Loader2 className='size-5 animate-spin' />
            <span className='ml-2 text-sm text-muted-foreground'>
              Loading more tweets...
            </span>
          </div>
        )}

        {!hasMore && tweets.length > 0 && (
          <div className='text-center text-sm text-muted-foreground'>
            No more tweets to load
          </div>
        )}

        {error && tweets.length > 0 && (
          <div className='text-center'>
            <p className='text-red-500 text-sm mb-2'>{error}</p>
            <button
              onClick={handleLoadMore}
              className='text-blue-500 hover:text-blue-600 text-sm'
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
