/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { AlertCircle, ImageIcon, Loader2, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { useInfiniteScroll } from '~/hooks/use-infinite-scroll'
import type { PaginatedListActions } from '~/stores'
import { useAppStore } from '~/stores/app-store'
import type { MediaItem } from '~/stores/media-store'
import type { Tweet, User } from '~/types'
import { MediaItemComponent } from './media-item'

interface MediaGridProps {
  mediaItems: MediaItem[]
  paginationActions?: PaginatedListActions
  // 为每个媒体项提供关联的推文和用户信息
  getMediaContext?: (mediaItem: MediaItem) => {
    tweet: Tweet
    user: User
    allMediaInTweet: MediaItem[]
  } | null
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

export function MediaGrid({
  mediaItems,
  paginationActions,
  getMediaContext,
}: MediaGridProps) {
  const { openTweetMediaModal } = useAppStore()

  const isLoading = paginationActions?.isLoading || false
  const hasMore = paginationActions?.hasMore || false
  const error = paginationActions?.error || null

  const columnCount = useResponsiveColumns()
  const columns = useMasonryLayout(mediaItems, columnCount)

  const handleLoadMore = () => {
    paginationActions?.loadMore()
  }

  const handleMediaClick = (clickedMedia: MediaItem) => {
    // const context = getMediaContext?.(clickedMedia)
    // if (!context) return
    // const startIndex = context.allMediaInTweet.findIndex(
    //   (m) => m.id === clickedMedia.id,
    // )
    // openTweetMediaModal({
    //   mediaItems: context.allMediaInTweet,
    //   startIndex: Math.max(0, startIndex),
    //   tweet: context.tweet,
    //   user: context.user,
    // })
  }

  const { loadingRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: handleLoadMore,
    threshold: 1200, // 提前1200px开始加载
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
      <div className='p-4'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              onClick={handleLoadMore}
              variant='link'
              className='p-0 h-auto ml-2'
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (mediaItems.length === 0 && !isLoading) {
    return (
      <div className='text-center py-12'>
        <ImageIcon className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
        <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
          No Media Found
        </h2>
        <p className='text-muted-foreground'>
          This user hasn't posted any photos or videos yet.
        </p>
      </div>
    )
  }

  return (
    <div className='pb-8'>
      <div className='flex gap-1 px-2 sm:px-0'>
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className='flex flex-col gap-1 flex-1'>
            {column.map((item, itemIndex) => (
              <div
                key={item.id}
                className='animate-in fade-in-0'
                style={{
                  animationDelay: `${Math.min((columnIndex * 5 + itemIndex) * 50, 800)}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <MediaItemComponent
                  item={item}
                  onClick={() => handleMediaClick(item)}
                />
              </div>
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
          <div className='p-4'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error loading more media</AlertTitle>
              <AlertDescription>
                {error}
                <Button
                  onClick={handleLoadMore}
                  variant='link'
                  className='p-0 h-auto ml-2'
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  )
}
