import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { FlatMediaItem } from '~/lib/media'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useCallback, useEffect, useState } from 'react'
import { MyTweet } from '~/components/tweet/Tweet'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { ScrollArea } from '~/components/ui/scroll-area'
import { getMp4Video } from '../react-tweet/utils'
import { MediaViewerOverlay } from './MediaViewerOverlay'

interface DesktopMediaViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentItem: FlatMediaItem | undefined
  currentTweet: EnrichedTweet | undefined
  tweetMediaItems: FlatMediaItem[]
  currentMediaIndexInTweet: number
  currentIndex: number
  totalItems: number
  onNavigateMedia: (direction: 'next' | 'prev') => void
}

export function DesktopMediaViewer({
  open,
  onOpenChange,
  currentItem,
  currentTweet,
  tweetMediaItems,
  currentMediaIndexInTweet,
  onNavigateMedia,
}: DesktopMediaViewerProps) {
  const [showControls, setShowControls] = useState(true)

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev)
  }, [])

  useEffect(() => {
    if (open) {
      setShowControls(true)
      const timer = setTimeout(() => setShowControls(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [open, currentMediaIndexInTweet])

  if (!open)
    return null

  const isVideo = currentItem?.type === 'video' || currentItem?.type === 'animated_gif'
  const mp4Video = isVideo && currentItem?.videoInfo ? getMp4Video({ video_info: currentItem.videoInfo } as any) : null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <DialogPrimitive.Popup className="flex h-full w-full outline-none data-ending-style:scale-[0.98] data-starting-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:opacity-0 transition-all duration-300 ease-out pointer-events-auto">
            {/* 左侧：图像区域 (Flex-1) */}
            <div
              className="relative flex-1 bg-black flex items-center justify-center select-none cursor-pointer overflow-hidden"
              onClick={toggleControls}
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
                >
                  <source src={`https://proxy.chilfish.top/${mp4Video.url}`} type={mp4Video.content_type} />
                </MediaVideo>
              ) : (
                <MediaImage
                  src={currentItem?.url}
                  alt="preview"
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              )}

              <MediaViewerOverlay
                show={showControls}
                onClose={() => onOpenChange(false)}
                hasMultipleMedia={tweetMediaItems.length > 1}
                currentIndex={currentMediaIndexInTweet}
                totalMedia={tweetMediaItems.length}
                onNavigate={onNavigateMedia}
              />
            </div>

            {/* 右侧：推文详情栏 (固定宽度) */}
            <div className="w-[500px] flex-shrink-0 bg-background border-l border-border h-full flex flex-col">
              <ScrollArea className="flex-1 pt-1 pl-1">
                {currentTweet && (
                  <MyTweet
                    tweet={currentTweet}
                    tweetAuthorName={currentTweet.user.name}
                    hideMedia
                  />
                )}
              </ScrollArea>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
