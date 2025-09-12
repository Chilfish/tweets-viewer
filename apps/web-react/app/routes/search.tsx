import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { TweetsList } from '~/components/tweets/tweets-list'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { SortOrder } from '~/stores'
import { useSearchStore } from '~/stores'
import { useUserStore } from '~/stores/user-store'

export function meta() {
  return [
    { title: 'Search Tweets' },
    { name: 'description', content: 'Search through tweets' },
  ]
}

export default function SearchPage() {
  const { curUser } = useUserStore()
  const {
    data,
    searchTweets,
    clearSearch,
    setKeyword,
    keyword,
    isLoading: isSearching,
    setCurrentUser,
    hasMore,
    error,
    loadMore,
    setSortOrder,
    setDateRange,
    filters,
    clearData,
    page,
    setPage,
    currentUser: storeUser,
  } = useSearchStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!curUser) return

    const userChanged = storeUser !== curUser.screenName
    if (userChanged) {
      clearData()
      setCurrentUser(curUser.screenName)
      isInitialized.current = false
    }

    if (!isInitialized.current) {
      const q = searchParams.get('q') || ''
      const pageParam = parseInt(searchParams.get('page') || '1', 10) - 1
      const sortParam = (searchParams.get('sort') as SortOrder) || 'desc'
      const startDateParam = searchParams.get('startDate')
      const endDateParam = searchParams.get('endDate')

      setKeyword(q)
      setPage(pageParam)
      setSortOrder(sortParam)
      setDateRange({
        startDate: startDateParam ? new Date(startDateParam) : null,
        endDate: endDateParam ? new Date(endDateParam) : null,
      })

      if (q) {
        searchTweets(true)
      }
      isInitialized.current = true
    }
  }, [
    curUser,
    storeUser,
    searchParams,
    clearData,
    setCurrentUser,
    setKeyword,
    setPage,
    setSortOrder,
    setDateRange,
    searchTweets,
  ])

  useEffect(() => {
    if (!isInitialized.current) return

    const params = new URLSearchParams()
    if (keyword) {
      params.set('q', keyword)
    }
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
  }, [keyword, page, filters, setSearchParams])

  if (!curUser) return null

  return (
    <div className='min-h-screen bg-background text-foreground transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        {/* Search Header */}
        <div className='sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              searchTweets(true)
            }}
            className='p-4 flex items-center gap-2'
          >
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                name='search'
                type='text'
                placeholder='搜索推文...'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className='pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground transition-colors duration-200'
              />
              {keyword && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={clearSearch}
                  type='reset'
                  className='absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0'
                >
                  <X className='h-3 w-3' />
                </Button>
              )}
            </div>
            <Button
              type='submit'
              disabled={!keyword.trim() || isSearching}
              className='bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200'
            >
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
          </form>
        </div>

        {/* Search Results */}
        <div className='p-4'>
          {!keyword?.trim() ? (
            <div className='text-center py-12'>
              <Search className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                搜索推文
              </h2>
            </div>
          ) : isSearching && data.length === 0 ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Searching...</p>
            </div>
          ) : !isSearching && data.length === 0 ? (
            <div className='text-center py-12'>
              <Search className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                找不到结果
              </h2>
              <p className='text-muted-foreground'>
                请尝试不同的关键词或检查拼写
              </p>
            </div>
          ) : null}
          {data.length > 0 && (
            <TweetsList
              user={curUser}
              tweets={data}
              showDateFilter={false}
              showSortControls={false}
              paginationActions={{
                isLoading: isSearching,
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
          )}
        </div>
      </div>
    </div>
  )
}
