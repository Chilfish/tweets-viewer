import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TweetsList } from '~/components/tweets/tweets-list'
import { UserHeader } from '~/components/user-header'
import type { SortOrder } from '~/stores'
import { useTweetsStore } from '~/stores/tweets-store'
import { useUserStore } from '~/stores/user-store'
import type { Route } from './+types/tweets'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Tweets` },
    { name: 'description', content: `See all tweets from @${name}` },
  ]
}

export default function TweetsPage({ params }: Route.ComponentProps) {
  const { isLoading: userLoading, curUser } = useUserStore()
  const {
    data,
    loadTweets,
    setCurrentUser,
    isLoading,
    hasMore,
    error,
    loadMore,
    setSortOrder,
    setDateRange,
    filters,
    reset,
    page,
    setPage,
    currentUser: storeUser,
  } = useTweetsStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!curUser) return

    const userChanged = storeUser?.screenName !== curUser.screenName
    if (userChanged) {
      reset()
      setCurrentUser(curUser)
      isInitialized.current = false
    }

    if (!isInitialized.current) {
      const pageParam = parseInt(searchParams.get('page') || '1', 10) - 1
      const sortParam = (searchParams.get('sort') as SortOrder) || 'desc'
      const startDateParam = searchParams.get('startDate')
      const endDateParam = searchParams.get('endDate')

      setPage(pageParam)
      setSortOrder(sortParam)
      setDateRange({
        startDate: startDateParam ? new Date(startDateParam) : null,
        endDate: endDateParam ? new Date(endDateParam) : null,
      })

      loadTweets(curUser.screenName, true)
      isInitialized.current = true
    }
  }, [
    curUser,
    storeUser,
    searchParams,
    reset,
    setCurrentUser,
    setPage,
    setSortOrder,
    setDateRange,
    loadTweets,
  ])

  useEffect(() => {
    if (!isInitialized.current) return

    const params = new URLSearchParams()
    if (page > 0) {
      params.set('page', String(page + 1))
    }
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
  }, [page, filters, setSearchParams])

  if (userLoading || !curUser) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='min-h-svh bg-background transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        <UserHeader user={curUser} />

        {/* Tabs */}
        <div className='border-b border-border px-4 transition-colors duration-200'>
          <div className='flex'>
            <div className='px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary'>
              Tweets
            </div>
            <Link
              to={`/media/${curUser.screenName}`}
              className='px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200'
            >
              Media
            </Link>
          </div>
        </div>

        <TweetsList
          user={curUser}
          tweets={data}
          paginationActions={{
            isLoading,
            hasMore,
            error,
            loadMore,
          }}
          sortControlsActions={{
            setSortOrder,
            setDateRange,
            filters,
          }}
        />
      </div>
    </div>
  )
}
