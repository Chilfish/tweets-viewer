/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { Loader2, Play } from 'lucide-react'
import { useInfiniteScroll } from '~/hooks/use-infinite-scroll'
import type { PaginatedListActions } from '~/stores'
import type { MediaItem } from '~/stores/media-store'

interface MediaGridProps {
  mediaItems: MediaItem[]
  paginationActions?: PaginatedListActions
}

interface MediaItemCardProps {
  item: MediaItem
}

function MediaItemCard({ item }: MediaItemCardProps) {
  const isVideo = item.type === 'video' || item.url.includes('.mp4')

  return (
    <div className='group relative overflow-hidden rounded-md bg-muted transition-all duration-200 hover:scale-[1.01] cursor-pointer'>
      <div className='relative'>
        {isVideo ? (
          <div className='relative'>
            <img
              src={item.url}
              alt=''
              className='w-full h-auto object-cover'
              loading='lazy'
              style={{
                aspectRatio: `${item.width} / ${item.height}`,
              }}
            />
            <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
              <Play className='size-8 text-white fill-white' />
            </div>
          </div>
        ) : (
          <img
            src={item.url}
            alt=''
            className='w-full h-auto object-cover'
            loading='lazy'
            style={{
              aspectRatio: `${item.width} / ${item.height}`,
            }}
          />
        )}
      </div>
    </div>
  )
}

export function MediaGrid({ mediaItems, paginationActions }: MediaGridProps) {
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
    threshold: 800, // 提前800px开始加载
  })

  if (mediaItems.length === 0 && isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='size-6 animate-spin' />
        <span className='ml-2 text-sm text-muted-foreground'>
          Loading media...
        </span>
      </div>
    )
  }

  if (error && mediaItems.length === 0) {
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

  if (mediaItems.length === 0 && !isLoading) {
    return (
      <div className='text-center py-12'>
        <div className='text-muted-foreground'>No media found</div>
      </div>
    )
  }

  return (
    <div className='pb-8'>
      {/* 瀑布流网格 */}
      <div className='columns-2 sm:columns-3 lg:columns-4 gap-2 p-4'>
        {mediaItems.map((item) => (
          <div key={item.id} className='mb-2 break-inside-avoid'>
            <MediaItemCard item={item} />
          </div>
        ))}
      </div>

      {/* 加载指示器 */}
      <div ref={loadingRef} className='py-4'>
        {isLoading && (
          <div className='flex items-center justify-center'>
            <Loader2 className='size-5 animate-spin' />
            <span className='ml-2 text-sm text-muted-foreground'>
              Loading more media...
            </span>
          </div>
        )}

        {!hasMore && mediaItems.length > 0 && (
          <div className='text-center text-sm text-muted-foreground'>
            No more media to load
          </div>
        )}

        {error && mediaItems.length > 0 && (
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
      </div>
    </div>
  )
}
