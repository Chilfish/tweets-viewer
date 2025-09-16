import { Calendar, Home, ImageIcon, Instagram, Search } from 'lucide-react'
import { useLocation } from 'react-router'

export interface NavItem {
  label: string
  icon: typeof Home
  href: string
  isActive: boolean
  disabled?: boolean
}

export function getNavItems(currentUser?: string): NavItem[] {
  const location = useLocation()
  const curPath = location.pathname.split('/')[1]

  return [
    {
      label: '主页',
      icon: Home,
      href: currentUser ? `/tweets/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/tweets/${currentUser}`
        : location.pathname === '/',
    },
    {
      label: '媒体',
      icon: ImageIcon,
      href: currentUser ? `/media/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/media/${currentUser}`
        : false,
      disabled: !currentUser,
    },
    {
      label: 'Instagram',
      icon: Instagram,
      href: currentUser ? `/ins/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/ins/${currentUser}`
        : false,
      disabled: !currentUser,
    },
    {
      label: '那年今日',
      icon: Calendar,
      href: currentUser ? `/memo/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/memo/${currentUser}`
        : false,
      disabled: !currentUser,
    },
    {
      label: '搜索',
      icon: Search,
      href: currentUser ? `/search/${currentUser}` : '/search',
      isActive: currentUser
        ? location.pathname === `/search/${currentUser}`
        : location.pathname.startsWith('/search'),
    },
  ]
}
