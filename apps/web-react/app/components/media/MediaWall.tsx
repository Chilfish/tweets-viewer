import type { FlatMediaItem } from '~/lib/media'
import { VideoIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Skeleton } from '~/components/ui/skeleton'
import { useMediaColumns } from '~/hooks/use-media-columns'
import { buildMediaHash, parseMediaHash } from '~/lib/media-hash'
import { MediaCard } from './MediaCard'
import { MediaPreviewModal } from './MediaPreviewModal'

interface MediaWallProps {
  items: FlatMediaItem[]
  isLoading: boolean
  isEmpty: boolean
}

/** 共享元素过渡名：灯箱大图与触发缩略图同名，实现"从哪里来回哪里去" */
const HERO_NAME = 'media-hero'

export function MediaWall({ items, isLoading, isEmpty }: MediaWallProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const columns = useMediaColumns()
  // 缩略图容器 ref：hero transition 时给被点击的缩略图临时打 view-transition-name
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // 运行环境是否支持 View Transitions 且用户未关闭动画
  const supportsHero = typeof document !== 'undefined'
    && 'startViewTransition' in document
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /**
   * 打开/关闭灯箱（可选 hero transition）。
   * 打开：先给缩略图打 name → startViewTransition → 新快照里灯箱图同名 → 浏览器 morph。
   * 关闭：灯箱图已有 name → startViewTransition 关灯箱 → 新快照里缩略图同名 → morph 回去。
   */
  const setLightboxOpen = useCallback((nextOpen: boolean, index: number | null) => {
    const applyState = () => {
      flushSync(() => {
        setSelectedIndex(index)
        setOpen(nextOpen)
      })
    }

    if (nextOpen && index != null && supportsHero) {
      const thumb = cardRefs.current.get(index)
      if (thumb) {
        thumb.style.viewTransitionName = HERO_NAME
        const vt = document.startViewTransition(() => {
          // 新快照捕获前移除缩略图 name，避免与灯箱图同名冲突
          thumb.style.viewTransitionName = ''
          applyState()
        })
        // 过渡结束兜底清理（防止残留）
        vt.finished.finally(() => {
          thumb.style.viewTransitionName = ''
        })
        return
      }
    }
    else if (!nextOpen && selectedIndex != null && supportsHero) {
      const thumb = cardRefs.current.get(selectedIndex)
      // 关闭：新快照里缩略图需重新获得 name，才能 morph 回去
      if (thumb) {
        const vt = document.startViewTransition(() => {
          thumb.style.viewTransitionName = HERO_NAME
          applyState()
        })
        vt.finished.finally(() => {
          thumb.style.viewTransitionName = ''
        })
        return
      }
    }

    // 不支持 hero 或找不到缩略图：直接切状态
    applyState()
  }, [supportsHero, selectedIndex])

  // ── hash URL 驱动：`#media=N` 打开对应索引，空则关闭 ──
  // 打开 pushState（浏览器后退 → hashchange → 关闭灯箱，天然支持"后退关闭"）；
  // 切换/关闭 replaceState（不堆积历史，关闭后 URL 干净）。

  // hashchange：浏览器前进/后退或手动改 hash → 同步灯箱状态
  useEffect(() => {
    const onHashChange = () => {
      const index = parseMediaHash(window.location.hash)
      if (index != null && index < items.length) {
        setSelectedIndex(index)
        setOpen(true)
      }
      else {
        setSelectedIndex(null)
        setOpen(false)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [items.length])

  // 初始挂载/items 变化时：从 hash 恢复灯箱
  useEffect(() => {
    const index = parseMediaHash(window.location.hash)
    if (index != null && index < items.length) {
      setSelectedIndex(index)
      setOpen(true)
    }
  }, [items.length])

  // 打开时锁定背景滚动（灯箱为全屏浮层）
  useEffect(() => {
    if (!open)
      return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const handleOpen = useCallback((originalIndex: number) => {
    setLightboxOpen(true, originalIndex)
    // pushState：产生历史条目，后退一次即关闭灯箱
    window.history.pushState(null, '', window.location.pathname + window.location.search + buildMediaHash(originalIndex))
  }, [setLightboxOpen])

  const handleClose = useCallback(() => {
    setLightboxOpen(false, null)
    // 清空 hash，恢复干净 URL（replaceState 不新增历史）
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [setLightboxOpen])

  const handleNavigate = useCallback((index: number) => {
    setSelectedIndex(index)
    // 灯箱内切换：replaceState，不堆积历史
    window.history.replaceState(null, '', window.location.pathname + window.location.search + buildMediaHash(index))
  }, [])

  // Distribute items into columns (Round-Robin) to ensure L-R then T-B ordering stability
  const buckets = useMemo(() => {
    const _buckets = Array.from({ length: columns }, () => [] as { item: FlatMediaItem, originalIndex: number }[])
    items.forEach((item, i) => {
      _buckets[i % columns].push({ item, originalIndex: i })
    })
    return _buckets
  }, [items, columns])

  if (isLoading && items.length === 0) {
    return <MediaWallSkeleton />
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="bg-accent/50 p-6 rounded-full mb-4">
          <VideoIcon className="size-8 opacity-50" />
        </div>
        <p className="text-sm">本页没有发现媒体内容</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-1 items-start">
        {buckets.map((bucket, colIndex) => (
          <div key={colIndex} className="flex-1 space-y-1">
            {bucket.map(({ item, originalIndex }) => (
              <div
                key={item.id}
                ref={(el) => {
                  if (el)
                    cardRefs.current.set(originalIndex, el)
                  else
                    cardRefs.current.delete(originalIndex)
                }}
              >
                <MediaCard
                  item={item}
                  onClick={() => handleOpen(originalIndex)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 预览模态框（hero transition：大图与缩略图同名 morph） */}
      {selectedIndex !== null && (
        <MediaPreviewModal
          items={items}
          currentIndex={selectedIndex}
          open={open}
          onOpenChange={(next) => {
            if (next)
              handleOpen(selectedIndex)
            else
              handleClose()
          }}
          onNavigate={handleNavigate}
          heroName={HERO_NAME}
        />
      )}
    </>
  )
}

function MediaWallSkeleton() {
  const columns = useMediaColumns()
  // Generate dummy skeletons distributed in columns
  const skeletonHeights = [
    220,
    380,
    280,
    200,
    320,
    240,
    180,
    300,
    260,
    340,
    210,
    290,
  ]

  const buckets = Array.from({ length: columns }, () => [] as number[])
  skeletonHeights.forEach((h, i) => {
    buckets[i % columns].push(h)
  })

  return (
    <div className="flex gap-2 items-start">
      {buckets.map((bucket, i) => (
        <div key={i} className="flex-1 space-y-2">
          {bucket.map((height, j) => (
            <Skeleton
              key={j}
              className="w-full rounded-lg"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
