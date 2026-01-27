import { Link } from 'react-router'
import { cn } from '~/lib/utils'
import { getNavItems } from './nav'

interface BottomNavProps {
  currentUser?: string
}

export function BottomNav({ currentUser }: BottomNavProps) {
  const navItems = getNavItems(currentUser)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-lg border-t border-border transition-colors duration-200 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map(item => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-4 rounded-lg transition-colors duration-200',
              item.disabled && 'pointer-events-none opacity-50',
              item.isActive
                ? 'text-primary bg-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            <item.icon className="size-5" />
            {/* <span className="text-xs font-medium">{item.label}</span> */}
          </Link>
        ))}
      </div>
    </div>
  )
}
