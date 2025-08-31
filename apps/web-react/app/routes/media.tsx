import { useEffect } from 'react'
import { Link } from 'react-router'
import { MediaGrid } from '~/components/media/media-grid'
import { TweetsSortControls } from '~/components/tweets/tweets-sort-controls'
import { UserHeader } from '~/components/user-header'
import { useMediaStore } from '~/stores'
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
  } = useMediaStore()

  useEffect(() => {
    if (curUser?.screenName) {
      setCurrentUser(curUser)
      loadMedia(curUser.screenName)
    }
  }, [curUser])

  if (userLoading || !curUser) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    )
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
        />
      </div>
    </div>
  )
}
