import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { FlatMediaItem } from '~/routes/media'
import { ChevronLeft, ChevronRight, XIcon } from 'lucide-react'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { cn } from '~/lib/utils'
import { MediaImage } from '../ui/media'

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
  if (!open)
    return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 gap-0" showCloseButton={false}>
        {/* 顶部大图区域 */}
        <div className="max-h-[55vh] bg-black flex items-center justify-center relative">
          <MediaImage
            src={currentItem?.url}
            alt="preview"
            className="max-w-full max-h-full object-contain"
          />
          {/* 关闭按钮 */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 text-white bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full"
            onClick={() => onOpenChange(false)}
            aria-label="Close preview"
          >
            <XIcon className="size-5" />
          </Button>

          {/* 媒体切换按钮 */}
          {tweetMediaItems.length > 1 && (
            <>
              {currentMediaIndexInTweet > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 backdrop-blur-sm text-white"
                  onClick={() => onNavigateMedia('prev')}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              )}

              {currentMediaIndexInTweet < tweetMediaItems.length - 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 backdrop-blur-sm text-white"
                  onClick={() => onNavigateMedia('next')}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </Button>
              )}

              {/* 指示器 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full">
                {tweetMediaItems.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      idx === currentMediaIndexInTweet ? 'bg-white w-5' : 'bg-white/40 w-1.5',
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 底部推文详情 */}
        <div className="overflow-y-auto bg-background border-t border-border">
          <ScrollArea className="h-full pt-4">
            {currentTweet && <MyTweet tweet={currentTweet} hideMedia />}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
