import { Moon, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useAppStore } from '~/stores/app-store'
import { getNavItems } from './nav'
import { UserSelector } from './user-selector'

interface SidebarProps {
  currentUser?: string
}

export function Sidebar({ currentUser }: SidebarProps) {
  const { toggleDarkMode } = useAppStore()
  const navItems = getNavItems(currentUser)

  return (
    <aside className='hidden md:flex sticky top-0 z-50 h-screen flex-col justify-between p-4 bg-sidebar border-r border-sidebar-border transition-colors duration-200'>
      <header className='flex items-center justify-between border-b border-sidebar-border pb-4 mb-4'>
        <h2 className='text-lg font-semibold text-sidebar-foreground'>
          Tweets Viewer
        </h2>
      </header>

      <div className='flex-1'>
        <nav className='space-y-2'>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200',
                item.disabled && 'pointer-events-none opacity-50',
                item.isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className='size-5 flex-shrink-0' />
              <span className='font-medium'>{item.label}</span>
            </Link>
          ))}

          <Button
            variant='ghost'
            onClick={toggleDarkMode}
            className='w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200'
          >
            <Sun className='size-5 flex-shrink-0 dark:hidden' />
            <Moon className='size-5 flex-shrink-0 hidden dark:block' />
            <span className='font-medium'>
              <span className='dark:hidden'>Dark Mode</span>
              <span className='hidden dark:inline'>Light Mode</span>
            </span>
          </Button>
        </nav>
      </div>

      <footer className='border-t border-sidebar-border pt-4 flex flex-col gap-4'>
        <UserSelector />
      </footer>
    </aside>
  )
}
