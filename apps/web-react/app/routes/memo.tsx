import type { Route } from './+types/memo'
import { Calendar } from 'lucide-react'
import { useEffect } from 'react'
import { TweetsList } from '~/components/tweets/tweets-list'
import { UserHeader } from '~/components/user-header'
import { useMemoryStore } from '~/stores'
import { useUserStore } from '~/stores/user-store'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Memories` },
    { name: 'description', content: `Historical tweets from @${name}` },
  ]
}

export default function MemoPage({ params }: Route.ComponentProps) {
  const { name: targetUserName } = params
  const { curUser, isLoading: userLoading } = useUserStore()
  const {
    data,
    loadMemoryTweets,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    currentUser: storeUser,
  } = useMemoryStore()

  useEffect(() => {
    if (targetUserName) {
      // Reset store only if user has changed
      if (storeUser !== targetUserName) {
        reset()
        loadMemoryTweets(targetUserName)
      }
    }
  }, [targetUserName, storeUser, reset, loadMemoryTweets])

  if (userLoading || !curUser) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading user...</div>
      </div>
    )
  }

  const isDataStale = storeUser && curUser && storeUser !== curUser.screenName

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-2xl mx-auto">
        <UserHeader user={curUser} />

        {isLoading && data.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">记忆加载中...</p>
          </div>
        ) : !isLoading && data.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-muted-foreground">
              找不到记忆
            </h2>
            <p className="text-muted-foreground">今天没有任何历史推文。</p>
          </div>
        ) : (
          <TweetsList
            tweets={isDataStale ? [] : data}
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
      </div>
    </div>
  )
}
