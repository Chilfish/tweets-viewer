import { Calendar, Home, ImageIcon, Search } from 'lucide-react'
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

  return [
    {
      label: 'Home',
      icon: Home,
      href: currentUser ? `/tweets/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/tweets/${currentUser}`
        : location.pathname === '/',
    },
    {
      label: 'Media',
      icon: ImageIcon,
      href: currentUser ? `/media/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/media/${currentUser}`
        : false,
      disabled: !currentUser,
    },
    {
      label: 'Memory',
      icon: Calendar,
      href: currentUser ? `/memo/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/memo/${currentUser}`
        : false,
      disabled: !currentUser,
    },
    {
      label: 'Search',
      icon: Search,
      href: currentUser ? `/search/${currentUser}` : '/search',
      isActive: currentUser
        ? location.pathname === `/search/${currentUser}`
        : location.pathname.startsWith('/search'),
    },
  ]
}
