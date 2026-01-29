import type { Route } from './+types/media'
import { MediaGrid } from '~/components/media/media-grid'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { TweetsSortControls } from '~/components/tweets/tweets-sort-controls'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Medias` },
    { name: 'description', content: `Medias of tweets from @${name}` },
  ]
}

export default function MediaPage({ params }: Route.ComponentProps) {
  return (
    <div className="min-h-svh bg-background transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <ProfileHeader user={curUser} />

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
