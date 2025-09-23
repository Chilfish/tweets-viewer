import { AlertCircle, Loader2 } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { useInfiniteScroll } from '~/hooks/use-infinite-scroll'
import { Skeleton } from './skeleton'

// 瀑布流项目的基础接口
export interface WaterfallItem {
  id: string
  width: number
  height: number
}

// 分页操作接口
export interface PaginationActions {
  isLoading?: boolean
  hasMore?: boolean
  error?: string | null
  loadMore?: () => void
}

// 瀑布流组件属性
export interface WaterfallProps<T extends WaterfallItem> {
  // 数据列表
  list: T[]
  // 列数配置，可以是固定数字或响应式配置
  cols?: number | { mobile: number; desktop: number }
  // 总宽度，默认为100%
  width?: string | number
  // 列间距，默认为4px (gap-1)
  margin?: number
  // 自定义渲染每个项目
  renderItem: (item: T, index: number) => ReactNode
  // 项目点击事件
  onItemClick?: (item: T, index: number) => void
  // 分页相关
  paginationActions?: PaginationActions
  // 空状态显示
  emptyState?: {
    icon?: ReactNode
    title?: string
    description?: string
  }
  // 骨架屏配置
  skeletonConfig?: {
    count?: number
    minHeight?: number
    maxHeight?: number
  }
  // 无限滚动配置
  infiniteScrollConfig?: {
    threshold?: number
  }
  // 自定义类名
  className?: string
  // 容器内边距
  containerPadding?: string
}

// 响应式列数 Hook
function useResponsiveColumns(
  cols: number | { mobile: number; desktop: number },
) {
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof cols === 'number') return cols
    return typeof window !== 'undefined' && window.innerWidth >= 640
      ? cols.desktop
      : cols.mobile
  })

  useEffect(() => {
    if (typeof cols === 'number') {
      setColumnCount(cols)
      return
    }

    const updateColumnCount = () => {
      const width = window.innerWidth
      setColumnCount(width >= 640 ? cols.desktop : cols.mobile)
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [cols])

  return columnCount
}

// 瀑布流布局 Hook - 稳定的排列算法，预先计算高度避免布局闪烁
function useMasonryLayout<T extends WaterfallItem>(
  items: T[],
  columnCount: number,
  containerWidth: number = 800,
) {
  const [columns, setColumns] = useState<
    (T & { calculatedHeight: number })[][]
  >([])

  useEffect(() => {
    if (items.length === 0) {
      setColumns([])
      return
    }

    // 计算每列的实际宽度（考虑间距）
    const columnWidth = (containerWidth - (columnCount - 1) * 4) / columnCount

    // 初始化列数组
    const newColumns: (T & { calculatedHeight: number })[][] = Array.from(
      { length: columnCount },
      () => [],
    )

    // 用于跟踪每列的累计高度
    const columnHeights = Array.from({ length: columnCount }, () => 0)

    // 为每个项目预先计算高度并分配到最短的列
    items.forEach((item, index) => {
      // 计算基于宽高比的预期高度
      const aspectRatio =
        item.width > 0 && item.height > 0 ? item.height / item.width : 1
      const calculatedHeight = Math.max(120, aspectRatio * columnWidth) // 最小高度120px

      let targetColumnIndex: number

      // 前几个项目按顺序分配，确保初始分布均匀
      if (index < columnCount) {
        targetColumnIndex = index
      } else {
        // 选择当前最短的列
        const minHeight = Math.min(...columnHeights)
        targetColumnIndex = columnHeights.findIndex(
          (height) => height === minHeight,
        )
      }

      // 将项目添加到目标列，包含预计算的高度
      const itemWithHeight = { ...item, calculatedHeight }
      newColumns[targetColumnIndex].push(itemWithHeight)

      // 更新列高度（包含间距）
      columnHeights[targetColumnIndex] += calculatedHeight + 4
    })

    setColumns(newColumns)
  }, [items, columnCount, containerWidth])

  return columns
}

export function Waterfall<T extends WaterfallItem>({
  list,
  cols = { mobile: 2, desktop: 3 },
  width = '100%',
  margin = 4,
  renderItem,
  onItemClick,
  paginationActions,
  emptyState,
  skeletonConfig = { count: 8, minHeight: 120, maxHeight: 280 },
  infiniteScrollConfig = { threshold: 1200 },
  className = '',
  containerPadding = 'px-2 sm:px-0',
}: WaterfallProps<T>) {
  const isLoading = paginationActions?.isLoading || false
  const hasMore = paginationActions?.hasMore || false
  const error = paginationActions?.error || null

  const columnCount = useResponsiveColumns(cols)
  // 根据屏幕尺寸估算容器宽度
  const containerWidth = columnCount === 2 ? 600 : 900
  const columns = useMasonryLayout(list, columnCount, containerWidth)

  const handleLoadMore = () => {
    paginationActions?.loadMore?.()
  }

  const handleItemClick = (item: T, columnIndex: number, itemIndex: number) => {
    const globalIndex =
      columns.slice(0, columnIndex).reduce((acc, col) => acc + col.length, 0) +
      itemIndex
    onItemClick?.(item, globalIndex)
  }

  const { loadingRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: handleLoadMore,
    threshold: infiniteScrollConfig.threshold,
  })

  // 骨架屏渲染
  const renderSkeleton = () => (
    <div className='pb-8 pt-4'>
      <div
        className={`flex ${containerPadding}`}
        style={{ gap: `${margin}px`, width }}
      >
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className='flex flex-col flex-1'
            style={{ gap: `${margin}px` }}
          >
            {Array.from({
              length: Math.ceil(skeletonConfig.count! / columnCount),
            }).map((_, itemIndex) => (
              <Skeleton
                key={itemIndex}
                className='w-full rounded-lg'
                style={{
                  height: `${skeletonConfig.minHeight! + Math.random() * (skeletonConfig.maxHeight! - skeletonConfig.minHeight!)}px`,
                  animationDelay: `${Math.min((columnIndex * 5 + itemIndex) * 60, 700)}ms`,
                  animationFillMode: 'backwards',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  // 空状态渲染
  const renderEmptyState = () => (
    <div className='text-center py-12'>
      {emptyState?.icon}
      {emptyState?.title && (
        <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
          {emptyState.title}
        </h2>
      )}
      {emptyState?.description && (
        <p className='text-muted-foreground'>{emptyState.description}</p>
      )}
    </div>
  )

  // 错误状态渲染
  const renderError = () => (
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

  // 加载状态
  if (list.length === 0 && isLoading) {
    return renderSkeleton()
  }

  // 错误状态（无数据时）
  if (error && list.length === 0) {
    return renderError()
  }

  // 空状态
  if (list.length === 0 && !isLoading) {
    return renderEmptyState()
  }

  return (
    <div className={`pb-8 ${className}`}>
      {/* 瀑布流内容 */}
      <div className={containerPadding}>
        <div className='flex' style={{ gap: `${margin}px`, width }}>
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className='flex flex-col flex-1'
              style={{ gap: `${margin}px` }}
            >
              {column.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className='animate-in fade-in-0 cursor-pointer'
                  style={{
                    height: `${item.calculatedHeight}px`,
                    animationDelay: `${Math.min((columnIndex * 5 + itemIndex) * 50, 800)}ms`,
                    animationFillMode: 'backwards',
                  }}
                  onClick={() => handleItemClick(item, columnIndex, itemIndex)}
                >
                  {renderItem(item, columnIndex * column.length + itemIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 加载指示器 */}
      <div ref={loadingRef} className='py-4'>
        {isLoading && (
          <div className='flex items-center justify-center'>
            <Loader2 className='size-5 animate-spin' />
            <span className='ml-2 text-sm text-muted-foreground'>
              Loading more...
            </span>
          </div>
        )}

        {!hasMore && list.length > 0 && (
          <div className='text-center text-sm text-muted-foreground'>
            没有更多内容了
          </div>
        )}

        {error && list.length > 0 && (
          <div className='p-4'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error loading more</AlertTitle>
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
