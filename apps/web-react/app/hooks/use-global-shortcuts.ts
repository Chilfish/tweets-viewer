import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

/**
 * 全局键盘快捷键（5C-4 / 5D-3）。
 *
 * - `/`：聚焦搜索框；若不在搜索页则跳转 `/search`（5C-4 键盘体验）
 * - `⌘K` / `Ctrl+K`：同 `/`，桌面端全局搜索（5D-3）
 *
 * 输入框/文本域/可编辑元素内不拦截（避免输入 `/` 时误触发）。
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const focusSearch = () => {
      const input = document.getElementById('global-search-input') as HTMLInputElement | null
      if (input) {
        input.focus()
        input.select()
        return true
      }
      return false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 输入场景不拦截
      const target = e.target as HTMLElement | null
      if (
        target
        && (target instanceof HTMLInputElement
          || target instanceof HTMLTextAreaElement
          || target instanceof HTMLSelectElement
          || target.isContentEditable)
      ) {
        return
      }

      const isSearchShortcut = e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')
      if (!isSearchShortcut)
        return

      e.preventDefault()

      // 已在搜索页：直接聚焦；否则跳转后聚焦（跳转后由 SearchInput 的 autoFocus 接管）
      if (location.pathname.startsWith('/search')) {
        focusSearch()
      }
      else {
        // 保留用户上下文：从用户页跳转到该用户的搜索页；首页/其他则全局搜索
        const userPath = location.pathname.match(/^\/(?:tweets|media|memo|ins)\/([^/]+)/)
        const targetPath = userPath
          ? `/search/${userPath[1]}?focus=search`
          : '/search?focus=search'
        navigate(targetPath, { viewTransition: true })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, location.pathname])
}
