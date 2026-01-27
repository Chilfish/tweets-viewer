import type { TweetMedia } from '@tweets-viewer/shared'
import type { MediaItem } from '~/stores/media-store'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/lib/utils'
import { Button } from '../ui/button'

interface MediaViewerProps {
  isOpen: boolean
  onClose: () => void
  mediaItems: MediaItem[] | TweetMedia[]
  startIndex?: number
  additionalToolbarContent?: React.ReactNode
}

export function MediaViewer({
  isOpen,
  onClose,
  mediaItems,
  startIndex = 0,
  additionalToolbarContent,
}: MediaViewerProps) {
  const [open, setOpen] = React.useState(isOpen)

  React.useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose()
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
            <div className="relative flex-1 bg-black min-w-0 flex items-center justify-center overflow-hidden">
              <MediaCarousel
                mediaItems={mediaItems}
                startIndex={startIndex}
                onClose={() => handleOpenChange(false)}
                additionalToolbarContent={additionalToolbarContent}
              />
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface MediaCarouselProps {
  mediaItems: MediaItem[] | TweetMedia[]
  startIndex: number
  onClose: () => void
  additionalToolbarContent?: React.ReactNode
}

function MediaCarousel({
  mediaItems,
  startIndex,
  onClose,
  additionalToolbarContent,
}: MediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: true })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(startIndex)

  const onSelect = React.useCallback(() => {
    if (!emblaApi) {
      return
    }
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    setCurrentIndex(emblaApi.selectedScrollSnap())
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
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [scrollPrev, scrollNext, onClose],
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

      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus-within:opacity-100">
        {/* Counter */}
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentIndex + 1}
          {' / '}
          {mediaItems.length}
        </div>

        <div className="flex items-center gap-2">
          {additionalToolbarContent}
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
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
