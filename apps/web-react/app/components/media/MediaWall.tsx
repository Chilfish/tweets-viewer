import type { FlatMediaItem } from '~/lib/media'
import { VideoIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMediaColumns } from '~/hooks/use-media-columns'
import { MediaWallSkeleton } from '../skeletons/media'
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
  const columns = useMediaColumns()

  // Distribute items into columns (Round-Robin) to ensure L-R then T-B ordering stability
  const buckets = useMemo(() => {
    const _buckets = Array.from({ length: columns }, () => [] as { item: FlatMediaItem, originalIndex: number }[])
    items.forEach((item, i) => {
      _buckets[i % columns].push({ item, originalIndex: i })
    })
    return _buckets
  }, [items, columns])

  if (isLoading && items.length === 0) {
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
      <div className="flex gap-1 items-start">
        {buckets.map((bucket, colIndex) => (
          <div key={colIndex} className="flex-1 space-y-1">
            {bucket.map(({ item, originalIndex }) => (
              <div key={item.id}>
                <MediaCard
                  item={item}
                  onClick={() => {
                    setSelectedIndex(originalIndex)
                    setOpen(true)
                  }}
                />
              </div>
            ))}
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
