import { Search, X } from 'lucide-react'
import { useEffect } from 'react'
import { TweetsList } from '~/components/tweets/tweets-list'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
  } = useSearchStore()

  useEffect(() => {
    if (curUser) {
      setCurrentUser(curUser.screenName)
    }
  }, [curUser])

  if (!curUser) return null

  return (
    <div className='min-h-screen bg-background text-foreground transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        {/* Search Header */}
        <div className='sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              console.log(keyword)
              searchTweets()
            }}
            className='p-4 flex items-center gap-2'
          >
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                name='search'
                type='text'
                placeholder='Search tweets...'
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
              onClick={() => searchTweets()}
              disabled={!keyword.trim() || isSearching}
              className='bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200'
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </div>

        {/* Search Results */}
        <div className='p-4'>
          {!keyword?.trim() ? (
            <div className='text-center py-12'>
              <Search className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                Search Tweets
              </h2>
              <p className='text-muted-foreground'>
                Enter keywords to search through tweets
              </p>
            </div>
          ) : isSearching ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Searching...</p>
            </div>
          ) : data.length === 0 ? (
            <div className='text-center py-12'>
              <Search className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                No results found
              </h2>
              <p className='text-muted-foreground'>
                Try different keywords or check your spelling
              </p>
            </div>
          ) : null}
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
        </div>
      </div>
    </div>
  )
}
