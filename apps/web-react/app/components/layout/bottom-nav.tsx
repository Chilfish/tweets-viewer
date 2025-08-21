import { Calendar, Home, Moon, Search, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useAppStore } from '~/stores/app-store'

interface BottomNavProps {
  currentUser?: string
}

export function BottomNav({ currentUser }: BottomNavProps) {
  const location = useLocation()

  const navItems = [
    {
      label: 'Home',
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
  ]

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-200 md:hidden'>
      <div className='flex items-center justify-around py-2 px-4'>
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-4 rounded-lg transition-colors',
              item.disabled && 'pointer-events-none opacity-50',
              item.isActive
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
            )}
          >
            <item.icon className='size-5' />
            {/* <span className="text-xs font-medium">{item.label}</span> */}
          </Link>
        ))}
      </div>
    </div>
  )
}
