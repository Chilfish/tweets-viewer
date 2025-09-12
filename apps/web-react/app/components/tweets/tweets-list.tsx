/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { AlertCircle, Loader2, MessageSquareX } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
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
    threshold: 600,
  })

  if (tweets.length === 0 && isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='size-6 animate-spin' />
        <span className='ml-2 text-sm text-muted-foreground'>
          推文加载中...
        </span>
      </div>
    )
  }

  if (error && tweets.length === 0) {
    return (
      <div className='p-4'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              onClick={handleLoadMore}
              variant='link'
              className='p-0 h-auto ml-2'
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='pb-8'>
      <TweetsSortControls
        showDateFilter={showDateFilter}
        showSortControls={showSortControls}
        sortFilterActions={sortControlsActions}
      />

      <div className='divide-y divide-border'>
        {tweets.map((tweet, index) => (
          <div
            key={tweet.tweetId}
            className='animate-in fade-in-0'
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <TweetCard tweet={tweet} user={user} />
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div ref={loadingRef} className='py-4'>
        {isLoading && (
          <div className='flex items-center justify-center'>
            <Loader2 className='size-5 animate-spin' />
            <span className='ml-2 text-sm text-muted-foreground'>
              加载更多推文...
            </span>
          </div>
        )}

        {!hasMore && tweets.length > 0 && (
          <div className='text-center text-sm text-muted-foreground'>
            没有更多推文了
          </div>
        )}

        {error && tweets.length > 0 && (
          <div className='p-4'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error loading more tweets</AlertTitle>
              <AlertDescription>
                {error}
                <Button
                  onClick={handleLoadMore}
                  variant='link'
                  className='p-0 h-auto ml-2'
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {tweets.length < 1 && !isLoading && (
          <div className='text-center py-12'>
            <MessageSquareX className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
            <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
              找不到推文
            </h2>
            <p className='text-muted-foreground'>暂时没有推文可以显示。</p>
          </div>
        )}
      </div>
    </div>
  )
}
