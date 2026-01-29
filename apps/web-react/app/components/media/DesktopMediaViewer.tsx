import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { FlatMediaItem } from '~/routes/media'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, XIcon } from 'lucide-react'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/lib/utils'

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
  if (!open)
    return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <DialogPrimitive.Popup className="flex h-full w-full outline-none data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-all duration-200">
            {/* 左侧：图像区域 (Flex-1) */}
            <div className="relative flex-1 bg-black flex items-center justify-center select-none group/media">
              {/* 关闭按钮 */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-white/10 transition-colors"
                aria-label="Close preview"
              >
                <XIcon className="size-6" />
              </button>

              <img
                src={currentItem?.url}
                alt="preview"
                className="max-w-full max-h-full object-contain"
              />

              {/* 左右导航按钮 (悬浮在图片两侧) */}
              {tweetMediaItems.length > 1 && (
                <>
                  {/* 左箭头 */}
                  {currentMediaIndexInTweet > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateMedia('prev')
                      }}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="size-6" />
                    </Button>
                  )}

                  {/* 右箭头 */}
                  {currentMediaIndexInTweet < tweetMediaItems.length - 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateMedia('next')
                      }}
                      aria-label="Next image"
                    >
                      <ChevronRight className="size-6" />
                    </Button>
                  )}

                  {/* 底部指示器 */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                    {tweetMediaItems.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          idx === currentMediaIndexInTweet ? 'bg-white w-6' : 'bg-white/40 w-1.5',
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 右侧：推文详情栏 (固定宽度) */}
            <div className="w-[500px] flex-shrink-0 bg-background border-l border-border h-full flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {currentTweet && <MyTweet tweet={currentTweet} hideMedia />}
                </div>
              </ScrollArea>
              {/* 这里可以放一些额外操作栏 */}
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
