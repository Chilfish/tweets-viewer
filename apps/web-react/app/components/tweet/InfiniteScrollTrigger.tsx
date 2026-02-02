import { useEffect, useRef } from 'react'

interface InfiniteScrollTriggerProps {
  onIntersect: () => void
  disabled?: boolean
  rootMargin?: string
}

/**
 * 苹果式的“平滑触底侦测”
 * 专门负责监听滚动位置并触发加载逻辑，与 UI 状态解耦
 */
export function InfiniteScrollTrigger({
  onIntersect,
  disabled = false,
  rootMargin = '800px', // 提前加载，确保滚动流畅（约 2 屏高度）
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect()
        }
      },
      {
        threshold: 0.1,
        rootMargin,
      },
    )

    if (triggerRef.current) {
      observer.observe(triggerRef.current)
    }

    return () => observer.disconnect()
  }, [onIntersect, disabled, rootMargin])

  return (
    <div
      ref={triggerRef}
      className="h-20 w-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
