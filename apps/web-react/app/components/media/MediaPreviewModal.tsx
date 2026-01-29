import type { FlatMediaItem } from '~/routes/media'
import { useEffect } from 'react'
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

  const navigateTweet = (direction: 'next' | 'prev') => {
    let targetIndex = -1
    if (direction === 'next') {
      // 寻找下一个不同 tweetId 的项
      for (let i = currentIndex + 1; i < items.length; i++) {
        if (items[i].tweetId !== currentItem.tweetId) {
          targetIndex = i
          break
        }
      }
    }
    else {
      // 寻找上一个不同 tweetId 的项 (且最好是该组的第一个)
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (items[i].tweetId !== currentItem.tweetId) {
          // 找到上一组的最后一个，我们需要找上一组的第一个
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
  }

  const navigateMedia = (direction: 'next' | 'prev') => {
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
  }

  useEffect(() => {
    if (!open)
      return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateMedia('prev')
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateMedia('next')
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        navigateTweet('prev')
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        navigateTweet('next')
      }
      if (e.key === 'Escape')
        onOpenChange(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentIndex, currentMediaIndexInTweet, tweetMediaItems.length]) // 依赖项更新

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
