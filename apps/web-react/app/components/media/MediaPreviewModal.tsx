import type { FlatMediaItem } from '~/lib/media'
import { useCallback, useEffect } from 'react'
import { useIsMobile } from '~/hooks/use-mobile'
import { DesktopMediaViewer } from './DesktopMediaViewer'
import { MobileMediaViewer } from './MobileMediaViewer'

interface MediaPreviewModalProps {
  items: FlatMediaItem[]
  currentIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (index: number) => void
}

export function MediaPreviewModal({
  items,
  currentIndex,
  open,
  onOpenChange,
  onNavigate,
}: MediaPreviewModalProps) {
  const isMobile = useIsMobile()
  const currentItem = items[currentIndex]
  const currentTweet = currentItem?.tweet
  // 同一推文下的媒体集合
  const tweetMediaItems = items.filter(item => item.tweetId === currentItem?.tweetId)
  const currentMediaIndexInTweet = tweetMediaItems.findIndex(item => item.id === currentItem?.id)

  const navigateTweet = useCallback((direction: 'next' | 'prev') => {
    if (!currentItem)
      return
    let targetIndex = -1
    if (direction === 'next') {
      for (let i = currentIndex + 1; i < items.length; i++) {
        if (items[i].tweetId !== currentItem.tweetId) {
          targetIndex = i
          break
        }
      }
    }
    else {
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (items[i].tweetId !== currentItem.tweetId) {
          const prevTweetId = items[i].tweetId
          let firstIndexOfPrevTweet = i
          while (firstIndexOfPrevTweet > 0 && items[firstIndexOfPrevTweet - 1].tweetId === prevTweetId) {
            firstIndexOfPrevTweet--
          }
          targetIndex = firstIndexOfPrevTweet
          break
        }
      }
    }

    if (targetIndex !== -1) {
      onNavigate(targetIndex)
    }
  }, [currentIndex, items, currentItem, onNavigate])

  const navigateMedia = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next' && currentMediaIndexInTweet < tweetMediaItems.length - 1) {
      const nextMediaId = tweetMediaItems[currentMediaIndexInTweet + 1].id
      const globalIndex = items.findIndex(item => item.id === nextMediaId)
      onNavigate(globalIndex)
    }
    else if (direction === 'prev' && currentMediaIndexInTweet > 0) {
      const prevMediaId = tweetMediaItems[currentMediaIndexInTweet - 1].id
      const globalIndex = items.findIndex(item => item.id === prevMediaId)
      onNavigate(globalIndex)
    }
  }, [currentMediaIndexInTweet, tweetMediaItems, items, onNavigate])

  useEffect(() => {
    if (!open)
      return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          navigateMedia('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          navigateMedia('next')
          break
        case 'ArrowUp':
          e.preventDefault()
          navigateTweet('prev')
          break
        case 'ArrowDown':
          e.preventDefault()
          navigateTweet('next')
          break
        case 'Escape':
          onOpenChange(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // 使用捕获阶段确保优先处理
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, navigateMedia, navigateTweet, onOpenChange])

  // 根据设备类型条件渲染，避免重复挂载
  return isMobile
    ? (
        <MobileMediaViewer
          open={open}
          onOpenChange={onOpenChange}
          currentItem={currentItem}
          currentTweet={currentTweet}
          tweetMediaItems={tweetMediaItems}
          currentMediaIndexInTweet={currentMediaIndexInTweet}
          onNavigateMedia={navigateMedia}
        />
      )
    : (
        <DesktopMediaViewer
          open={open}
          onOpenChange={onOpenChange}
          currentItem={currentItem}
          currentTweet={currentTweet}
          tweetMediaItems={tweetMediaItems}
          currentMediaIndexInTweet={currentMediaIndexInTweet}
          currentIndex={currentIndex}
          totalItems={items.length}
          onNavigateMedia={navigateMedia}
        />
      )
}
