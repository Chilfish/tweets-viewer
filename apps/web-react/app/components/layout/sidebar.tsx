import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  Moon,
  Search,
  Sun,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useAppStore } from '~/stores/app-store'
import { UserSelector } from './user-selector'

interface SidebarProps {
  currentUser?: string
}

export function Sidebar({ currentUser }: SidebarProps) {
  const location = useLocation()
  const { isDarkMode, toggleDarkMode } = useAppStore()

  const navItems = [
    {
      label: 'Tweets',
      icon: Home,
      href: currentUser ? `/tweets/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/tweets/${currentUser}`
        : location.pathname === '/',
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
      href: currentUser ? `/search/${currentUser}` : '/',
      isActive: currentUser
        ? location.pathname === `/search/${currentUser}`
        : false,
      disabled: !currentUser,
    },
  ]

  return (
    <aside
      className={cn(
        'hidden md:flex sticky top-0 z-50 h-screen flex-col bg-white border-r border-gray-200 justify-between p-4',
      )}
    >
      <header className='flex items-center justify-between border-b border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-900'>Tweets Viewer</h2>
      </header>

      <div className=''>
        <nav className='space-y-2'>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                item.disabled && 'pointer-events-none opacity-50',
                item.isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <item.icon className='size-5 flex-shrink-0' />
              <span className='font-medium'>{item.label}</span>
            </Link>
          ))}

          <Button
            variant='ghost'
            onClick={toggleDarkMode}
            className={cn('w-full justify-start gap-3')}
          >
            {isDarkMode ? (
              <Sun className='size-5 flex-shrink-0' />
            ) : (
              <Moon className='size-5 flex-shrink-0' />
            )}
            <span className='font-medium'>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </Button>
        </nav>
      </div>

      <footer className='border-t border-gray-200 flex flex-col gap-4'>
        <UserSelector />
      </footer>
    </aside>
  )
}
