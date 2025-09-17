/** biome-ignore-all lint/a11y/useButtonType: <explanation> */

import type { Tweet, User } from '@tweets-viewer/shared'
import { ImageIcon } from 'lucide-react'
import type { PaginatedListActions } from '~/stores'
import { useAppStore } from '~/stores/app-store'
import type { MediaItem } from '~/stores/media-store'
import { Waterfall, type WaterfallItem } from '../ui/waterfall'
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

// 确保 MediaItem 符合 WaterfallItem 接口
interface MediaWaterfallItem extends MediaItem, WaterfallItem {}

export function MediaGrid({
  mediaItems,
  paginationActions,
  getMediaContext,
}: MediaGridProps) {
  const { openTweetMediaModal } = useAppStore()

  const handleMediaClick = (clickedMedia: MediaItem) => {
    const context = getMediaContext?.(clickedMedia)
    if (!context) return
    const startIndex = context.allMediaInTweet.findIndex(
      (m) => m.id === clickedMedia.id,
    )
    openTweetMediaModal({
      mediaItems: context.allMediaInTweet,
      startIndex: Math.max(0, startIndex),
      tweet: context.tweet,
      user: context.user,
    })
  }

  return (
    <Waterfall<MediaWaterfallItem>
      list={mediaItems as MediaWaterfallItem[]}
      cols={{ mobile: 2, desktop: 3 }}
      margin={4}
      renderItem={(item) => (
        <MediaItemComponent
          item={item}
          onClick={() => handleMediaClick(item)}
        />
      )}
      onItemClick={handleMediaClick}
      paginationActions={paginationActions}
      emptyState={{
        icon: (
          <ImageIcon className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
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
