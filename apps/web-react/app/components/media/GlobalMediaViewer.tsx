import type { FlatMediaItem } from '~/lib/media'
import { useMemo } from 'react'
import { MediaPreviewModal } from '~/components/media/MediaPreviewModal'
import { useMediaViewer } from '~/store/use-media-viewer'

/**
 * 全局媒体查看器组件
 * 修复版：确保传递完整的 tweet 对象以防止渲染崩溃，并优化重渲染逻辑
 */
export function GlobalMediaViewer() {
  const { tweet, items, currentIndex, isOpen, close, setCurrentIndex } = useMediaViewer()

  const formattedItems = useMemo(() => {
    if (!tweet || !items.length)
      return []

    return items.map((media, index) => {
      const w = media.original_info?.width || 1000
      const h = media.original_info?.height || 1000

      const item: FlatMediaItem = {
        id: media.media_url_https,
        url: media.media_url_https,
        type: media.type as any,
        width: w,
        height: h,
        aspectRatio: h / w,
        videoInfo: (media as any).video_info,
        mediaIndex: index,
        tweetId: tweet.id,
        createdAt: tweet.created_at,
        tweet, // 传递完整的推文对象
      }
      return item
    })
  }, [tweet, items])

  if (!isOpen || !formattedItems.length)
    return null

  return (
    <MediaPreviewModal
      items={formattedItems}
      currentIndex={currentIndex}
      open={isOpen}
      onOpenChange={open => !open && close()}
      onNavigate={setCurrentIndex}
    />
  )
}
