import type { Tweet, UserInfo } from '@tweets-viewer/shared'
import type { InsMediaItem } from '~/stores/ins-store'
import {
  Dialog as DialogPrimitive,
  Dialog as SheetPrimitive,
} from '@base-ui/react/dialog'
import { formatDate } from '@tweets-viewer/shared'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react'
import * as React from 'react'
import { useIsMobile } from '~/hooks/use-mobile'
import { cn } from '~/lib/utils'
import { TweetText } from '../tweets/tweet-text'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Sheet, SheetHeader, SheetTitle } from '../ui/sheet'

interface MediaViewerWithTextProps {
  isOpen: boolean
  onClose: () => void
  mediaItems: InsMediaItem[]
  startIndex?: number
  post: Tweet
  user: UserInfo
}

export function MediaViewerWithText({
  isOpen,
  onClose,
  mediaItems,
  startIndex = 0,
  post,
  user,
}: MediaViewerWithTextProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(isOpen)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose()
      setIsSheetOpen(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-100 bg-black/95 backdrop-blur-sm transition-all duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-101 flex h-full w-full flex-col outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="flex h-full w-full overflow-hidden">
            {/* Media Area */}
            <div className="relative flex-1 bg-black min-w-0 flex items-center justify-center overflow-hidden">
              <MediaCarousel
                mediaItems={mediaItems}
                startIndex={startIndex}
                onClose={() => handleOpenChange(false)}
                onShowInfo={() => setIsSheetOpen(true)}
                showInfoButton={isMobile}
              />
            </div>

            {/* Desktop Context Sidebar */}
            {!isMobile && (
              <div className="w-87.5 lg:w-100 border-l border-border bg-background flex flex-col h-full z-102 shadow-xl">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Post Details</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenChange(false)}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <TweetContext post={post} user={user} />
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>

      {/* Mobile Context Sheet */}
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <HighZSheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Post Details</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <TweetContext post={post} user={user} />
            </div>
          </HighZSheetContent>
        </Sheet>
      )}
    </DialogPrimitive.Root>
  )
}

interface MediaCarouselProps {
  mediaItems: InsMediaItem[]
  startIndex: number
  onClose: () => void
  onShowInfo: () => void
  showInfoButton: boolean
}

function MediaCarousel({
  mediaItems,
  startIndex,
  onClose,
  onShowInfo,
  showInfoButton,
}: MediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: true })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback(() => {
    if (!emblaApi) {
      return
    }
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) {
      return
    }
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = React.useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  )
  const scrollNext = React.useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        scrollPrev()
      }
      if (event.key === 'ArrowRight') {
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="relative w-full h-full group" ref={emblaRef}>
      <div className="flex h-full touch-pan-y">
        {mediaItems.map((item, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static content
            key={index}
            className="flex-[0_0_100%] min-w-0 relative h-full flex items-center justify-center p-4"
          >
            {item.type === 'video' ? (
              // biome-ignore lint/a11y/useMediaCaption: <explanation>
              <video
                src={item.url}
                controls
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <img
                src={item.url}
                alt={`Slide ${index + 1}`}
                className="max-h-full max-w-full object-contain select-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus-within:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 rounded-full"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {showInfoButton && (
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-full"
            onClick={onShowInfo}
          >
            <Info className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Navigation Arrows */}
      {mediaItems.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-4 flex items-center z-10 pointer-events-none">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'rounded-full bg-black/20 text-white hover:bg-black/40 pointer-events-auto transition-opacity',
                !canScrollPrev && 'opacity-0 pointer-events-none',
              )}
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center z-10 pointer-events-none">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'rounded-full bg-black/20 text-white hover:bg-black/40 pointer-events-auto transition-opacity',
                !canScrollNext && 'opacity-0 pointer-events-none',
              )}
              onClick={scrollNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function TweetContext({ post, user }: { post: Tweet, user: UserInfo }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate text-foreground">
                {user.name}
              </span>
              <span className="text-sm text-muted-foreground shrink-0">
                @
                {user.screenName}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {formatDate(post.createdAt)}
          </div>

          <TweetText text={post.fullText} />
        </div>
      </div>
    </div>
  )
}

const SheetPortal = SheetPrimitive.Portal

function HighZSheetContent({
  className,
  children,
  side: _side = 'bottom',
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'right' | 'left' | 'top' | 'bottom'
}) {
  return (
    <SheetPortal>
      <SheetPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-105 bg-black/32 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0',
        )}
      />
      <SheetPrimitive.Viewport
        className={cn(
          'fixed inset-0 z-105 grid grid-rows-[1fr_auto] pt-12 justify-items-center',
        )}
      >
        <SheetPrimitive.Popup
          className={cn(
            'relative flex max-h-full min-h-0 w-full min-w-0 flex-col bg-popover bg-clip-padding text-popover-foreground shadow-lg transition-[opacity,translate] duration-200 ease-in-out will-change-transform',
            'row-start-2 border-t data-ending-style:translate-y-8 data-starting-style:translate-y-8',
            className,
          )}
          {...props}
        >
          {children}
          <SheetPrimitive.Close
            aria-label="Close"
            className="absolute end-2 top-2"
            render={<Button size="icon" variant="ghost" />}
          >
            <X className="w-4 h-4" />
          </SheetPrimitive.Close>
        </SheetPrimitive.Popup>
      </SheetPrimitive.Viewport>
    </SheetPortal>
  )
}
