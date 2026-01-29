import type { FlatMediaItem } from '~/routes/media'
import { VideoIcon } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { MediaCard } from './MediaCard'
import { MediaPreviewModal } from './MediaPreviewModal'

interface MediaWallProps {
  items: FlatMediaItem[]
  isLoading: boolean
  isEmpty: boolean
}

const MediaWallItem = memo(({ item, index, onSelect }: { item: FlatMediaItem, index: number, onSelect: (index: number) => void }) => {
  const handleClick = useCallback(() => {
    onSelect(index)
  }, [index, onSelect])

  return (
    <div className="break-inside-avoid mb-2 transition-transform duration-200">
      <MediaCard
        item={item}
        onClick={handleClick}
      />
    </div>
  )
})
MediaWallItem.displayName = 'MediaWallItem'

export function MediaWall({ items, isLoading, isEmpty }: MediaWallProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return <MediaWallSkeleton />
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="bg-accent/50 p-6 rounded-full mb-4">
          <VideoIcon className="size-8 opacity-50" />
        </div>
        <p className="text-sm">本页没有发现媒体内容</p>
      </div>
    )
  }

  return (
    <>
      {/* 纯瀑布流网格 - 使用原生 CSS Columns */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="break-inside-avoid">
            <MediaCard
              item={item}
              onClick={() => {
                setSelectedIndex(index)
                setOpen(true)
              }}
            />
          </div>
        ))}
      </div>

      {/* 预览模态框 */}
      {selectedIndex !== null && (
        <MediaPreviewModal
          items={items}
          currentIndex={selectedIndex}
          open={open}
          onOpenChange={setOpen}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  )
}

function MediaWallSkeleton() {
  // 使用确定的高度数组，避免 SSR Hydration Mismatch (Math.random 不一致)
  const skeletonHeights = [
    220,
    380,
    280,
    200,
    320,
    240,
    180,
    300,
    260,
    340,
    210,
    290,
  ]

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
      {skeletonHeights.map((height, i) => (
        <Skeleton
          key={i}
          className="w-full rounded-lg"
          style={{
            height: `${height}px`,
            // 避免骨架屏在列尾断裂
            breakInside: 'avoid',
          }}
        />
      ))}
    </div>
  )
}
