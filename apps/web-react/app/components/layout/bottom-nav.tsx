import { Link } from 'react-router'
import { cn } from '~/lib/utils'
import { useNavItems } from './nav'

interface BottomNavProps {
  currentUser?: string
}

export function BottomNav({ currentUser }: BottomNavProps) {
  const navItems = useNavItems(currentUser)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border/40 transition-colors duration-200 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around h-12 px-2">
        {navItems.map(item => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 active:scale-95',
              item.disabled && 'pointer-events-none opacity-30',
              item.isActive
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            <item.icon className={cn(
              'size-4 transition-all',
              item.isActive && 'fill-current scale-110',
            )}
            />
            {/* <span className="text-[10px] font-medium">{item.label}</span> */}
          </Link>
        ))}
      </div>
    </div>
  )
}
