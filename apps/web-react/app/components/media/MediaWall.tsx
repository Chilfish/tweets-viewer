import type { FlatMediaItem } from '~/routes/media'
import { VideoIcon } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { MediaCard } from './MediaCard'
import { MediaPreviewModal } from './MediaPreviewModal'

interface MediaWallProps {
  items: FlatMediaItem[]
  isLoading: boolean
  isEmpty: boolean
}

export function MediaWall({ items, isLoading, isEmpty }: MediaWallProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  // 瀑布流渲染项
  const renderItem = (item: FlatMediaItem, index: number) => {
    return (
      <MediaCard
        item={item}
        onClick={() => {
          setSelectedIndex(index)
          setOpen(true)
        }}
      />
    )
  }

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
            {renderItem(item, index)}
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
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full rounded-lg"
          style={{
            height: `${Math.floor(Math.random() * 200) + 150}px`,
            // 避免骨架屏在列尾断裂
            breakInside: 'avoid',
          }}
        />
      ))}
    </div>
  )
}
