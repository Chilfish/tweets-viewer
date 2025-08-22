import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TweetCard } from '~/components/tweets/tweet-card'
import { TweetsSortControls } from '~/components/tweets/tweets-sort-controls'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useTweetsStore } from '~/stores/tweets-store'
import { useUserStore } from '~/stores/user-store'
import type { Tweet } from '~/types'

export function meta() {
  return [
    { title: 'Search Tweets' },
    { name: 'description', content: 'Search through tweets' },
  ]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Tweet[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const { findUserById, curUser } = useUserStore()
  const { tweets, loadTweets, sortTweets } = useTweetsStore()

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    loadTweets(curUser?.screenName!)

    // 模拟搜索延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 简单的文本搜索实现
    const allTweets = tweets
    const results = allTweets.filter((tweet) =>
      tweet.fullText.toLowerCase().includes(query.toLowerCase()),
    )

    // 应用当前的排序设置
    const sortedResults = sortTweets(results)
    setSearchResults(sortedResults)
    setIsSearching(false)
  }

  const clearSearch = () => {
    setQuery('')
    setSearchResults([])
    setHasSearched(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className='min-h-screen bg-background text-foreground transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        {/* Search Header */}
        <div className='sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200'>
          <div className='p-4'>
            <div className='flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search tweets...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className='pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground transition-colors duration-200'
                />
                {query && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={clearSearch}
                    className='absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0'
                  >
                    <X className='h-3 w-3' />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={!query.trim() || isSearching}
                className='bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200'
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className='p-4'>
          {!hasSearched ? (
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
          ) : searchResults.length === 0 ? (
            <div className='text-center py-12'>
              <Search className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                No results found
              </h2>
              <p className='text-muted-foreground'>
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <div>
              <div className='mb-4 pb-2 border-b border-border flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? 's' : ''} for "{query}"
                </p>
                <TweetsSortControls showDateFilter={false} />
              </div>

              <div className='divide-y divide-border'>
                {searchResults.map((tweet) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    user={findUserById(tweet.userId)!}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
