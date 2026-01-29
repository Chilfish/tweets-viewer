import type { MediaDetails } from '@tweets-viewer/rettiwt-api'
import { ImageIcon } from 'lucide-react'
import { Waterfall } from '../ui/waterfall'
import { MediaItemComponent } from './media-item'

interface MediaGridProps {
  mediaItems: MediaDetails[]
  paginationActions?: PaginatedListActions
}

// 确保 MediaItem 符合 WaterfallItem 接口
interface MediaWaterfallItem extends MediaDetails {}

export function MediaGrid({
  mediaItems,
  paginationActions,
}: MediaGridProps) {
  return (
    <Waterfall<MediaWaterfallItem>
      list={mediaItems as MediaWaterfallItem[]}
      cols={{ mobile: 2, desktop: 3 }}
      margin={4}
      renderItem={item => (
        <MediaItemComponent
          item={item}
        />
      )}
      paginationActions={paginationActions}
      emptyState={{
        icon: (
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        ),
        title: '找不到媒体',
        description: '该用户还没有发布过任何照片或视频。',
      }}
      skeletonConfig={{
        count: 12,
        minHeight: 120,
        maxHeight: 280,
      }}
      infiniteScrollConfig={{
        threshold: 1200,
      }}
    />
  )
}
