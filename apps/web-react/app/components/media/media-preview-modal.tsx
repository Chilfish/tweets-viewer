/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import type { MediaItem } from '~/stores/media-store'
import { MediaItemComponent } from './media-item'

interface MediaPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mediaItems: MediaItem[]
  currentIndex: number
  onIndexChange?: (index: number) => void
}

export function MediaPreviewModal({
  open,
  onOpenChange,
  mediaItems,
  currentIndex,
  onIndexChange,
}: MediaPreviewModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const currentMedia = mediaItems[currentIndex]
  const hasMultiple = mediaItems.length > 1
  const canGoPrev = hasMultiple && currentIndex > 0
  const canGoNext = hasMultiple && currentIndex < mediaItems.length - 1

  const isVideo =
    currentMedia?.type === 'video' || currentMedia?.url.includes('.mp4')

  // 重置加载状态当媒体变化时
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [currentMedia?.url])

  // 键盘快捷键
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onOpenChange(false)
          break
        case 'ArrowLeft':
          if (canGoPrev) {
            onIndexChange?.(currentIndex - 1)
          }
          break
        case 'ArrowRight':
          if (canGoNext) {
            onIndexChange?.(currentIndex + 1)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, currentIndex, canGoPrev, canGoNext, onOpenChange, onIndexChange])

  const handlePrevious = () => {
    if (canGoPrev) {
      onIndexChange?.(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      onIndexChange?.(currentIndex + 1)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  if (!currentMedia) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0'
        showCloseButton={false}
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Media Preview</DialogTitle>
          <DialogDescription>Preview media content</DialogDescription>
        </DialogHeader>

        {/* 关闭按钮 */}
        <Button
          variant='ghost'
          size='icon'
          onClick={() => onOpenChange(false)}
          className='absolute top-4 right-4 z-10 text-white hover:bg-white/10 rounded-full'
        >
          <X className='size-4' />
        </Button>

        {/* 媒体计数器 */}
        {hasMultiple && (
          <div className='absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
            {currentIndex + 1} / {mediaItems.length}
          </div>
        )}

        {/* 主要内容区 */}
        <div className='relative flex items-center justify-center min-h-[400px] max-h-[80vh]'>
          {/* 左箭头 */}
          {hasMultiple && canGoPrev && (
            <Button
              variant='ghost'
              size='icon'
              onClick={handlePrevious}
              className='absolute left-4 z-10 text-white hover:bg-white/10 rounded-full size-10'
            >
              <ChevronLeft className='size-6' />
            </Button>
          )}

          {/* 右箭头 */}
          {hasMultiple && canGoNext && (
            <Button
              variant='ghost'
              size='icon'
              onClick={handleNext}
              className='absolute right-4 z-10 text-white hover:bg-white/10 rounded-full size-10'
            >
              <ChevronRight className='size-6' />
            </Button>
          )}

          {/* 媒体内容 */}
          <div className='flex items-center justify-center w-full h-full p-6'>
            {!imageLoaded && !imageError && (
              <div className='flex items-center justify-center w-full h-96'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
              </div>
            )}
            <MediaItemComponent item={currentMedia} />
          </div>
        </div>

        {/* 底部指示器 */}
        {hasMultiple && (
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2'>
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => onIndexChange?.(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
