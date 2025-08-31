/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useAppStore } from '~/stores/app-store'
import { MediaItemComponent } from './media-item'

export function MediaPreviewModal() {
  const { mediaPreviewModal, closeMediaPreviewModal, setMediaPreviewIndex } =
    useAppStore()

  const { isOpen, currentMediaItems, currentMediaIndex } = mediaPreviewModal

  const currentMedia = currentMediaItems[currentMediaIndex]
  const hasMultiple = currentMediaItems.length > 1
  const canGoPrev = hasMultiple && currentMediaIndex > 0
  const canGoNext =
    hasMultiple && currentMediaIndex < currentMediaItems.length - 1

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeMediaPreviewModal()
          break
        case 'ArrowLeft':
          if (canGoPrev) {
            setMediaPreviewIndex(currentMediaIndex - 1)
          }
          break
        case 'ArrowRight':
          if (canGoNext) {
            setMediaPreviewIndex(currentMediaIndex + 1)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    isOpen,
    currentMediaIndex,
    canGoPrev,
    canGoNext,
    closeMediaPreviewModal,
    setMediaPreviewIndex,
  ])

  const handlePrevious = () => {
    if (canGoPrev) {
      setMediaPreviewIndex(currentMediaIndex - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setMediaPreviewIndex(currentMediaIndex + 1)
    }
  }

  if (!currentMedia) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeMediaPreviewModal()
      }}
    >
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
          onClick={closeMediaPreviewModal}
          className='absolute top-4 right-4 z-10 text-white hover:bg-white/10 rounded-full'
        >
          <X className='size-4' />
        </Button>

        {/* 媒体计数器 */}
        {hasMultiple && (
          <div className='absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
            {currentMediaIndex + 1} / {currentMediaItems.length}
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
            <MediaItemComponent item={currentMedia} isInPreview />
          </div>
        </div>

        {/* 底部指示器 */}
        {hasMultiple && (
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2'>
            {currentMediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setMediaPreviewIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
