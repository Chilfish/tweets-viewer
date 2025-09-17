/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { useInfiniteScroll } from '~/hooks/use-infinite-scroll'
import type { PaginatedListActions } from '~/stores'
import type { InsMediaItem } from '~/stores/ins-store'
import type { Tweet, User } from '~/types'
import { Skeleton } from '../ui/skeleton'
import { MediaItemComponent } from './media-item'
import { MediaViewerWithText } from './media-viewer-with-text'

interface InsMediaGridProps {
  mediaItems: InsMediaItem[]
  paginationActions?: PaginatedListActions
  // 为每个媒体项提供关联的Instagram帖子和用户信息
  getMediaContext?: (mediaItem: InsMediaItem) => {
    post: Tweet
    user: User
    allMediaInPost: InsMediaItem[]
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

function useMasonryLayout(mediaItems: InsMediaItem[], columnCount: number) {
  const [columns, setColumns] = useState<InsMediaItem[][]>([])

  useEffect(() => {
    if (mediaItems.length === 0) {
      setColumns([])
      return
    }

    // 初始化列数组
    const newColumns: InsMediaItem[][] = Array.from(
      { length: columnCount },
      () => [],
    )

    // 用于跟踪每列的估算高度
    const columnHeights = Array.from({ length: columnCount }, () => 0)

    // 将每个媒体项分配到最短的列
    mediaItems.forEach((item) => {
      // 找到最短的列
      const shortestColumnIndex = Math.max(
        columnHeights.indexOf(Math.min(...columnHeights)),
        0,
      )

      // 将项目添加到最短的列
      newColumns[shortestColumnIndex].push(item)

      // 估算这个项目的高度并更新列高度
      // 使用宽高比来估算高度，假设列宽为固定值
      const aspectRatio =
        item.width > 0 && item.height > 0 ? item.height / item.width : 1
      const estimatedHeight = aspectRatio * 300 + 16 // 300px列宽 + 16px间距
      columnHeights[shortestColumnIndex] += estimatedHeight
    })

    setColumns(newColumns)
  }, [mediaItems, columnCount])

  return columns
}

export function InsMediaGrid({
  mediaItems,
  paginationActions,
  getMediaContext,
}: InsMediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<{
    mediaItems: InsMediaItem[]
    startIndex: number
    post: Tweet
    user: User
  } | null>(null)

  const isLoading = paginationActions?.isLoading || false
  const hasMore = paginationActions?.hasMore || false
  const error = paginationActions?.error || null

  const columnCount = useResponsiveColumns()
  const columns = useMasonryLayout(mediaItems, columnCount)

  const handleLoadMore = () => {
    paginationActions?.loadMore()
  }

  const handleMediaClick = (clickedMedia: InsMediaItem) => {
    const context = getMediaContext?.(clickedMedia)
    console.log(context)
    if (!context) return
    const startIndex = context.allMediaInPost.findIndex(
      (m) => m.id === clickedMedia.id,
    )
    setSelectedMedia({
      mediaItems: context.allMediaInPost,
      startIndex: Math.max(0, startIndex),
      post: context.post,
      user: context.user,
    })
  }

  const handleCloseViewer = () => {
    setSelectedMedia(null)
  }

  const { loadingRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: handleLoadMore,
    threshold: 1200, // 提前1200px开始加载
  })

  if (mediaItems.length === 0 && isLoading) {
    return (
      <div className='pb-8 pt-4'>
        <div className='flex gap-1 px-2 sm:px-0'>
          {Array.from({ length: columnCount }).map((_, columnIndex) => (
            <div key={columnIndex} className='flex flex-col gap-1 flex-1'>
              {Array.from({ length: 4 }).map((_, itemIndex) => (
                <Skeleton
                  key={itemIndex}
                  className='w-full rounded-lg'
                  style={{
                    height: `${120 + Math.random() * 160}px`, // 120px to 280px
                    animationDelay: `${Math.min(
                      (columnIndex * 5 + itemIndex) * 60,
                      700,
                    )}ms`,
                    animationFillMode: 'backwards',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
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
      <div className='text-center py-6 h-56'>
        <ImageIcon className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
        <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
          找不到Instagram内容
        </h2>
        <p className='text-muted-foreground'>暂时还没存档 ta 的 Instagram</p>
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
                  item={{
                    id: item.id,
                    url: item.url,
                    type: item.type,
                    width: item.width,
                    height: item.height,
                    tweetId: item.postId,
                    createdAt: item.createdAt,
                  }}
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
              Loading more Instagram content...
            </span>
          </div>
        )}
      </div>

      {!hasMore && mediaItems.length > 0 && (
        <div className='text-center text-sm text-muted-foreground'>
          没有更多Instagram内容了
        </div>
      )}

      {error && mediaItems.length > 0 && (
        <div className='p-4'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error loading more content</AlertTitle>
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
      {/* Instagram 媒体查看器 */}
      {selectedMedia && (
        <MediaViewerWithText
          isOpen={true}
          onClose={handleCloseViewer}
          mediaItems={selectedMedia.mediaItems}
          startIndex={selectedMedia.startIndex}
          post={selectedMedia.post}
          user={selectedMedia.user}
        />
      )}
    </div>
  )
}
