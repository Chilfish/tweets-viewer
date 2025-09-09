/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
// [新增] 引入 useState 和 useRef
import { useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { cn } from '~/lib/utils' // 假设你有 cn 工具函数，用于合并 class
import { useAppStore } from '~/stores/app-store'
import { MediaItemComponent } from './media-item'

// [新增] 定义两种显示模式
type DisplayMode = 'fit' | 'scroll'

export function MediaPreviewModal() {
  const { mediaPreviewModal, closeMediaPreviewModal, setMediaPreviewIndex } =
    useAppStore()
  const { isOpen, currentMediaItems, currentMediaIndex } = mediaPreviewModal
  const currentMedia = currentMediaItems[currentMediaIndex]

  // [新增] 状态来管理显示模式和加载状态
  const [displayMode, setDisplayMode] = useState<DisplayMode>('fit')
  const [isLoading, setIsLoading] = useState(true)

  // ... (其他变量 canGoPrev, canGoNext 等保持不变) ...
  const hasMultiple = currentMediaItems.length > 1
  const canGoPrev = hasMultiple && currentMediaIndex > 0
  const canGoNext =
    hasMultiple && currentMediaIndex < currentMediaItems.length - 1

  // [修改] 核心逻辑：检测图片尺寸并设置模式
  useEffect(() => {
    if (!currentMedia || !isOpen) return

    // 每次切换图片时，重置为加载状态和默认fit模式
    setIsLoading(true)
    setDisplayMode('fit')

    // 我们只对图片类型做这个特殊处理
    if (currentMedia.type !== 'image') {
      setIsLoading(false)
      return
    }

    const img = new Image()
    img.src = currentMedia.url

    img.onload = () => {
      const imgHeight = img.naturalHeight
      const windowHeight = window.innerHeight

      // 决策逻辑：如果图片高度大于窗口高度的120%，则判定为长图
      // 这个 1.2 的系数可以根据你的喜好调整
      if (imgHeight > windowHeight * 1.2) {
        setDisplayMode('scroll')
      } else {
        setDisplayMode('fit')
      }
      setIsLoading(false)
    }

    img.onerror = () => {
      // 图片加载失败处理
      setIsLoading(false)
    }

    // 组件卸载或图片切换时，清理 image 对象
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [currentMedia, isOpen]) // 依赖当前媒体项和弹窗状态

  // ... (键盘快捷键的 useEffect 保持不变) ...
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
      onOpenChange={(open) => !open && closeMediaPreviewModal()}
    >
      <DialogContent
        className='w-screen h-screen max-w-none max-h-none p-0 bg-transparent border-0 flex items-center justify-center'
        showCloseButton={false}
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Media Preview</DialogTitle>
          <DialogDescription>Preview media content</DialogDescription>
        </DialogHeader>

        {/* ... (关闭按钮, 计数器, 左右箭头, 底部指示器等 UI 控件保持不变，它们的 absolute 定位是相对于全屏的 DialogContent，所以不受内部滚动影响) ... */}
        {/* 关闭按钮 */}
        <Button
          variant='ghost'
          size='icon'
          onClick={closeMediaPreviewModal}
          className='absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full'
        >
          <X className='size-6' />
        </Button>

        {/* 媒体计数器 */}
        {hasMultiple && (
          <div className='absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
            {currentMediaIndex + 1} / {currentMediaItems.length}
          </div>
        )}

        {/* 左箭头 */}
        {hasMultiple && canGoPrev && (
          <Button
            variant='ghost'
            size='icon'
            onClick={handlePrevious}
            className='absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full size-12'
          >
            <ChevronLeft className='size-8' />
          </Button>
        )}

        {/* 右箭头 */}
        {hasMultiple && canGoNext && (
          <Button
            variant='ghost'
            size='icon'
            onClick={handleNext}
            className='absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full size-12'
          >
            <ChevronRight className='size-8' />
          </Button>
        )}

        {/* [修改] 主要内容区：容器现在会根据 displayMode 决定是否可滚动 */}
        <div
          className={cn(
            'relative flex justify-center max-w-[95vw] max-h-[95vh] transition-opacity duration-200',
            // [核心] 如果是滚动模式, 允许Y轴滚动, 并且 flex 布局从顶部开始 (items-start)
            displayMode === 'scroll'
              ? 'overflow-y-auto items-start'
              : 'overflow-hidden items-center',
            isLoading ? 'opacity-0' : 'opacity-100',
          )}
        >
          {/* [修改] 将 displayMode 传递给子组件 */}
          <MediaItemComponent
            item={currentMedia}
            isInPreview
            displayMode={displayMode}
          />
        </div>

        {/* [新增] 加载指示器 */}
        {isLoading && (
          <div className='absolute text-white'>Loading...</div>
          // 或者用一个更炫酷的 Spinner 组件
        )}

        {/* 底部指示器 */}
        {hasMultiple && (
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2'>
            {currentMediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setMediaPreviewIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentMediaIndex
                    ? 'bg-white scale-110'
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
