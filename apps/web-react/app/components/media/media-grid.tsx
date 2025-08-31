/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { Loader2, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
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
    <div className='group relative overflow-hidden rounded-md bg-muted transition-all duration-200 hover:scale-[1.01] cursor-pointer mb-2'>
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

function useResponsiveColumns() {
  const [columnCount, setColumnCount] = useState(2)

  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth
      if (width >= 640) {
        setColumnCount(3) // sm
      } else {
        setColumnCount(2) // default
      }
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  return columnCount
}

function useMasonryLayout(mediaItems: MediaItem[], columnCount: number) {
  const [columns, setColumns] = useState<MediaItem[][]>([])

  useEffect(() => {
    if (mediaItems.length === 0) {
      setColumns([])
      return
    }

    // 初始化列数组
    const newColumns: MediaItem[][] = Array.from(
      { length: columnCount },
      () => [],
    )

    // 用于跟踪每列的估算高度
    const columnHeights = Array.from({ length: columnCount }, () => 0)

    // 将每个媒体项分配到最短的列
    mediaItems.forEach((item) => {
      // 找到最短的列
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights),
      )

      // 将项目添加到最短的列
      newColumns[shortestColumnIndex].push(item)

      // 估算这个项目的高度并更新列高度
      // 使用宽高比来估算高度，假设列宽为固定值
      const estimatedHeight = (item.height / item.width) * 300 + 16 // 300px列宽 + 16px间距
      columnHeights[shortestColumnIndex] += estimatedHeight
    })

    setColumns(newColumns)
  }, [mediaItems, columnCount])

  return columns
}

export function MediaGrid({ mediaItems, paginationActions }: MediaGridProps) {
  const isLoading = paginationActions?.isLoading || false
  const hasMore = paginationActions?.hasMore || false
  const error = paginationActions?.error || null

  const columnCount = useResponsiveColumns()
  const columns = useMasonryLayout(mediaItems, columnCount)

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
      <div className='flex gap-2 p-4'>
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className='flex-1'>
            {column.map((item) => (
              <MediaItemCard key={item.id} item={item} />
            ))}
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
