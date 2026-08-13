import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { FlatMediaItem } from '~/lib/media'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MyTweet } from '~/components/tweet/Tweet'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { proxyMedia } from '~/lib/utils'
import { getMp4Video } from '../react-tweet/utils'
import { MediaImage, MediaVideo } from '../ui/media'
import { MediaViewerOverlay } from './MediaViewerOverlay'

interface MobileMediaViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentItem: FlatMediaItem | undefined
  currentTweet: EnrichedTweet | undefined
  tweetMediaItems: FlatMediaItem[]
  currentMediaIndexInTweet: number
  onNavigateMedia: (direction: 'next' | 'prev') => void
  /** 共享元素过渡名（hero transition），与触发缩略图同名 */
  heroName?: string
}

export function MobileMediaViewer({
  open,
  onOpenChange,
  currentItem,
  currentTweet,
  tweetMediaItems,
  currentMediaIndexInTweet,
  onNavigateMedia,
  heroName,
}: MobileMediaViewerProps) {
  const [showTweetDetails, setShowTweetDetails] = useState(false)
  const [showControls, setShowControls] = useState(true)
  // 5E-3：灯箱滑动切换手势（横向滑动阈值 50px）
  const touchStartX = useRef<number | null>(null)

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current == null)
      return
    const deltaX = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null
    // 只处理明显横向滑动（> 50px），纵向滚动不受影响
    if (Math.abs(deltaX) < 50)
      return
    onNavigateMedia(deltaX < 0 ? 'next' : 'prev')
  }, [onNavigateMedia])

  useEffect(() => {
    if (open) {
      setShowControls(true)
      const timer = setTimeout(setShowControls, 3500, false)
      return () => clearTimeout(timer)
    }
  }, [open, currentMediaIndexInTweet])

  if (!open)
    return null

  const isVideo = currentItem?.type === 'video' || currentItem?.type === 'animated_gif'
  const mp4Video = isVideo && currentItem?.videoInfo ? getMp4Video({ video_info: currentItem.videoInfo } as any) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 gap-0 border-none bg-black h-dvh outline-none overflow-hidden"
        showCloseButton={false}
      >
        <div
          className="h-full w-full bg-black flex items-center justify-center relative touch-none select-none"
          role="button"
          tabIndex={0}
          onClick={toggleControls}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleControls()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo && mp4Video ? (
            <MediaVideo
              key={mp4Video.url}
              className="max-w-full max-h-full object-contain"
              controls={showControls}
              autoPlay
              playsInline
              loop={currentItem.type === 'animated_gif'}
              onClick={e => e.stopPropagation()}
              style={heroName ? { viewTransitionName: heroName } : undefined}
            >
              <source src={proxyMedia(mp4Video.url)} type={mp4Video.content_type} />
            </MediaVideo>
          ) : (
            <MediaImage
              src={currentItem?.url}
              alt="preview"
              className="max-w-full max-h-full object-contain"
              draggable={false}
              style={heroName ? { viewTransitionName: heroName } : undefined}
            />
          )}
        </div>

        <MediaViewerOverlay
          show={showControls}
          onClose={() => onOpenChange(false)}
          onShowDetails={() => setShowTweetDetails(true)}
          hasMultipleMedia={tweetMediaItems.length > 1}
          currentIndex={currentMediaIndexInTweet}
          totalMedia={tweetMediaItems.length}
          onNavigate={onNavigateMedia}
        />

        {/* 推文详情抽屉（内联，原 TweetDetailDrawer） */}
        <Sheet open={showTweetDetails} onOpenChange={setShowTweetDetails}>
          <SheetContent
            side="bottom"
            className="max-h-[82vh] rounded-t-xl transition-all duration-200 ease-out"
          >
            <div className="overflow-y-auto h-full">
              <ScrollArea>
                {currentTweet && (
                  <MyTweet
                    tweet={currentTweet}
                    tweetAuthorName={currentTweet.user.name}
                    hideMedia
                  />
                )}
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </SheetContent>
    </Sheet>
  )
}
