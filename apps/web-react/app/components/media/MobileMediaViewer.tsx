import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { FlatMediaItem } from '~/lib/media'
import { useCallback, useEffect, useState } from 'react'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { getMp4Video } from '../react-tweet/utils'
import { MediaImage, MediaVideo } from '../ui/media'
import { MediaViewerOverlay } from './MediaViewerOverlay'
import { TweetDetailDrawer } from './TweetDetailDrawer'

interface MobileMediaViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentItem: FlatMediaItem | undefined
  currentTweet: EnrichedTweet | undefined
  tweetMediaItems: FlatMediaItem[]
  currentMediaIndexInTweet: number
  onNavigateMedia: (direction: 'next' | 'prev') => void
}

export function MobileMediaViewer({
  open,
  onOpenChange,
  currentItem,
  currentTweet,
  tweetMediaItems,
  currentMediaIndexInTweet,
  onNavigateMedia,
}: MobileMediaViewerProps) {
  const [showTweetDetails, setShowTweetDetails] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev)
  }, [])

  useEffect(() => {
    if (!open)
      return
    const timer = setTimeout(() => setShowControls(false), 3500)
    return () => {
      clearTimeout(timer)
      setShowControls(true)
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
              className="max-w-full max-h-full object-contain"
              draggable={false}
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

        <TweetDetailDrawer
          open={showTweetDetails}
          onOpenChange={setShowTweetDetails}
          currentTweet={currentTweet}
        />
      </SheetContent>
    </Sheet>
  )
}
