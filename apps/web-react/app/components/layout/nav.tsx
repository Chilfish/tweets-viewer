import { Calendar, Home, ImageIcon, Info, Search } from 'lucide-react'
import { useLocation } from 'react-router'
import { InsIcon } from '../ins/InsLogo'

export interface NavItem {
  label: string
  icon: any
  href: string
  isActive: boolean
  disabled?: boolean
  /** 只在桌面侧边栏显示（移动底栏保持 5 tab 上限） */
  hideOnMobile?: boolean
}

export function useNavItems(currentUser?: string): NavItem[] {
  const location = useLocation()

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
      icon: InsIcon,
      href: currentUser ? `/ins/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/ins/${currentUser}`
        : false,
      // disabled: true,
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
    {
      label: '关于',
      icon: Info,
      href: '/about',
      isActive: location.pathname === '/about',
      hideOnMobile: true,
    },
  ]
}
