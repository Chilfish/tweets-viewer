/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'
import { TweetCard } from '~/components/tweets/tweet-card'
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

export function TweetMediaModal() {
  const { tweetMediaModal, closeTweetMediaModal, setTweetMediaIndex } =
    useAppStore()

  const {
    isOpen,
    currentMediaItems,
    currentMediaIndex,
    currentTweet,
    currentUser,
  } = tweetMediaModal

  const currentMedia = currentMediaItems[currentMediaIndex]
  const hasMultipleMedia = currentMediaItems.length > 1
  const canGoPrev = hasMultipleMedia && currentMediaIndex > 0
  const canGoNext =
    hasMultipleMedia && currentMediaIndex < currentMediaItems.length - 1

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeTweetMediaModal()
          break
        case 'ArrowLeft':
          if (canGoPrev) {
            setTweetMediaIndex(currentMediaIndex - 1)
          }
          break
        case 'ArrowRight':
          if (canGoNext) {
            setTweetMediaIndex(currentMediaIndex + 1)
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
    closeTweetMediaModal,
    setTweetMediaIndex,
  ])

  const handlePrevious = () => {
    if (canGoPrev) {
      setTweetMediaIndex(currentMediaIndex - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setTweetMediaIndex(currentMediaIndex + 1)
    }
  }

  if (!currentMedia || !currentTweet || !currentUser) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeTweetMediaModal()
      }}
    >
      <DialogContent
        className='max-w-6xl max-h-[90vh] p-0 bg-background border'
        showCloseButton={false}
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Tweet Media Details</DialogTitle>
          <DialogDescription>View tweet with media details</DialogDescription>
        </DialogHeader>

        {/* 关闭按钮 */}
        <Button
          variant='ghost'
          size='icon'
          onClick={closeTweetMediaModal}
          className='absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full'
        >
          <X className='size-4' />
        </Button>

        <div className='flex h-full min-h-[500px] max-h-[85vh]'>
          {/* 左侧：媒体展示区 */}
          <div className='flex-1 relative bg-black flex items-center justify-center'>
            {/* 媒体计数器 */}
            {hasMultipleMedia && (
              <div className='absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
                {currentMediaIndex + 1} / {currentMediaItems.length}
              </div>
            )}

            {/* 左箭头 */}
            {hasMultipleMedia && canGoPrev && (
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
            {hasMultipleMedia && canGoNext && (
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
            <MediaItemComponent item={currentMedia} />

            {/* 底部媒体指示器 */}
            {hasMultipleMedia && (
              <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2'>
                {currentMediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setTweetMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 右侧：推文详情 */}
          <div className='w-80 lg:w-96 border-l border-border bg-background overflow-y-auto'>
            <div className='p-4'>
              <TweetCard tweet={currentTweet} user={currentUser} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
