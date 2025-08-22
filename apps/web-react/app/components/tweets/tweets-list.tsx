/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { Loader2 } from 'lucide-react'
import { useInfiniteScroll } from '~/hooks/use-infinite-scroll'
import type { PaginatedListActions } from '~/stores'
import type { Tweet, User } from '~/types'
import { TweetCard } from './tweet-card'
import { TweetsSortControls } from './tweets-sort-controls'

interface TweetsListProps {
  user: User
  tweets: Tweet[]
  showDateFilter?: boolean
  showSortControls?: boolean
  paginationActions?: PaginatedListActions
  sortControlsActions?: {
    setSortOrder: (order: 'asc' | 'desc') => Promise<void>
    setDateRange: (range: {
      startDate: Date | null
      endDate: Date | null
    }) => Promise<void>
    filters: {
      sortOrder: 'asc' | 'desc'
      dateRange: { startDate: Date | null; endDate: Date | null }
    }
  }
}

export function TweetsList({
  user,
  tweets,
  showDateFilter = true,
  showSortControls = true,
  paginationActions,
  sortControlsActions,
}: TweetsListProps) {
  const isLoading = paginationActions?.isLoading || false
  const hasMore = paginationActions?.hasMore || false
  const error = paginationActions?.error || null

  const handleLoadMore = () => {
    paginationActions?.loadMore()
  }

  const { loadingRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: handleLoadMore,
  })

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
          onClick={handleLoadMore}
          className='text-blue-500 hover:text-blue-600'
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className='pb-8'>
      <div className='p-4 border-b border-border bg-card'>
        <TweetsSortControls
          showDateFilter={showDateFilter}
          showSortControls={showSortControls}
          sortFilterActions={sortControlsActions}
        />
      </div>

      <div className='divide-y divide-border'>
        {tweets.map((tweet) => (
          <TweetCard key={tweet.tweetId} tweet={tweet} user={user} />
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

        {tweets.length < 1 && !isLoading && (
          <div className='text-center text-sm text-muted-foreground'>
            No tweets found
          </div>
        )}
      </div>
    </div>
  )
}
