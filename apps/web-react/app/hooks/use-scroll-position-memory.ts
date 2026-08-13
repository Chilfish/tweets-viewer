import { useEffect } from 'react'
import { useLocation } from 'react-router'

const STORAGE_KEY = 'tweets-viewer:scroll-position'

interface ScrollPositionEntry {
  pathname: string
  scrollY: number
}

/**
 * 滚动位置记忆（5D-2，可选增强）。
 *
 * 背景：keyset 无限滚动不写 URL，分页定位靠 URL page；**刷新**页面时浏览器只按
 * pathname 恢复（ScrollRestoration），滚动续载的偏移会丢失。
 *
 * 做法：滚动节流写入 sessionStorage（key = pathname），**仅在整页刷新（reload）时**恢复
 * ——客户端导航（push/back）交给 ScrollRestoration 管理，避免与分页 URL 变化打架。
 *
 * 边界：
 * - 只记 sessionStorage（关标签即清），不做持久化，避免"过期锚点"误导
 * - 滚动到顶部（< 8px）视为"用户主动回顶"，删除记忆，避免反复弹回
 * - `prefers-reduced-motion` 不受影响（滚动本身是即时定位，非动画）
 */
export function useScrollPositionMemory() {
  const location = useLocation()

  useEffect(() => {
    const pathname = location.pathname
    let timer: ReturnType<typeof setTimeout> | undefined

    // 仅整页刷新才恢复（客户端导航由 ScrollRestoration 负责）
    const navType = performance.getEntriesByType('navigation')[0]?.toJSON().type as string | undefined
    const isReload = navType === 'reload'

    const readEntries = (): ScrollPositionEntry[] => {
      try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]') as ScrollPositionEntry[]
      }
      catch {
        return []
      }
    }

    const writeEntry = (scrollY: number) => {
      const entries = readEntries().filter(e => e.pathname !== pathname)
      if (scrollY >= 8) {
        entries.push({ pathname, scrollY })
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-20)))
    }

    const handleScroll = () => {
      if (timer)
        clearTimeout(timer)
      // 节流：滚动停止后 150ms 写入
      timer = setTimeout(writeEntry, 150, window.scrollY)
    }

    // 刷新后恢复：下一帧执行，确保 loader 内容已挂载
    if (isReload) {
      const saved = readEntries().find(e => e.pathname === pathname)
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, saved.scrollY)
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (timer)
        clearTimeout(timer)
      // 离开页面时兜底记录当前位置
      writeEntry(window.scrollY)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname])
}
