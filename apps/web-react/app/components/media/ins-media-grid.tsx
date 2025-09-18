import type { Tweet, User } from '@tweets-viewer/shared'
import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import type { PaginatedListActions } from '~/stores'
import type { InsMediaItem } from '~/stores/ins-store'
import { Waterfall, type WaterfallItem } from '../ui/waterfall'
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

// 确保 InsMediaItem 符合 WaterfallItem 接口
interface InsMediaWaterfallItem extends InsMediaItem, WaterfallItem {}

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

  return (
    <>
      <Waterfall<InsMediaWaterfallItem>
        list={mediaItems as InsMediaWaterfallItem[]}
        cols={{ mobile: 2, desktop: 3 }}
        margin={4}
        renderItem={(item) => (
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
        )}
        onItemClick={handleMediaClick}
        paginationActions={paginationActions}
        emptyState={{
          icon: (
            <ImageIcon className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
          ),
          title: '找不到Instagram内容',
          description: '暂时还没存档 ta 的 Instagram',
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
    </>
  )
}
