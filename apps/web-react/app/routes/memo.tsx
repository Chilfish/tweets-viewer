import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TweetsList } from '~/components/tweets/tweets-list'
import { useMemoryStore } from '~/stores'
import { useUserStore } from '~/stores/user-store'
import type { Route } from './+types/memo'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Memories` },
    { name: 'description', content: `Historical tweets from @${name}` },
  ]
}

export default function MemoPage({ params }: Route.ComponentProps) {
  const currentYear = new Date().getFullYear()
  const { curUser } = useUserStore()
  const {
    data,
    loadMemoryTweets,
    isLoading,
    hasMore,
    error,
    loadMore,
    setSortOrder,
    setDateRange,
    filters,
    reset,
  } = useMemoryStore()

  useEffect(() => {
    if (curUser) {
      reset()
      loadMemoryTweets(curUser.screenName)
    }
  }, [curUser, reset, loadMemoryTweets])

  if (!curUser) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-muted-foreground'>Loading user...</div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background text-foreground transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        <header className='sticky top-0 z-10 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200'>
          <h1 className='text-2xl font-bold'>那年今日</h1>
        </header>

        {/* Content */}
        <main className='p-4'>
          {isLoading && data.length === 0 ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Loading memories...</p>
            </div>
          ) : !isLoading && data.length === 0 ? (
            <div className='text-center py-12'>
              <Calendar className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                No memories found
              </h2>
              <p className='text-muted-foreground'>
                No historical tweets found for this day.
              </p>
            </div>
          ) : (
            <TweetsList
              tweets={data}
              user={curUser}
              showDateFilter={false}
              showSortControls={false}
              paginationActions={{
                isLoading,
                hasMore,
                error,
                loadMore,
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
