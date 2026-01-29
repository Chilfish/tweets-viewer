import { Moon, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { getNavItems } from './nav'
import { UserSelector } from './user-selector'

interface SidebarProps {
  currentUser?: string
}

export function Sidebar({ currentUser }: SidebarProps) {
  const navItems = getNavItems(currentUser)

  return (
    <aside className="hidden md:flex sticky top-0 z-40 h-screen  flex-col justify-between p-3 xl:p-4 bg-background/80 backdrop-blur-xl border-r border-border/40 transition-all duration-200">
      {/* Logo & Title */}
      <header className="flex items-center justify-center xl:justify-start gap-3 pb-4 mb-2">
        <img
          alt="logo"
          src="/icon.jpg"
          width={32}
          height={32}
          className="rounded-lg flex-shrink-0"
        />
        <h2 className="text-lg font-semibold hidden xl:block">
          推文存档站
        </h2>
      </header>

      {/* Navigation */}
      <div className="flex-1">
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'group flex items-center justify-center xl:justify-start gap-4 px-4 py-3 rounded-full transition-all duration-200',
                item.disabled && 'pointer-events-none opacity-40',
                item.isActive
                  ? 'bg-accent/80 text-accent-foreground font-semibold'
                  : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <item.icon className={cn(
                'size-4 shrink-0 transition-transform group-hover:scale-110',
                item.isActive && 'fill-current',
              )}
              />
              <span className="text-md xl:block">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            className="justify-center xl:justify-start gap-4 px-4 py-3 h-auto rounded-full text-foreground/80 hover:bg-accent/50 hover:text-foreground transition-all duration-200"
          >
            <Sun className="size-4 shrink-0 dark:hidden" />
            <Moon className="size-4 shrink-0 hidden dark:block" />
            <span className="text-md hidden xl:block">
              <span className="dark:hidden">夜间模式</span>
              <span className="hidden dark:inline">日间模式</span>
            </span>
          </Button>
        </nav>
      </div>

      {/* User Selector */}
      <footer className="pt-4 border-t border-border/40">
        <UserSelector />
      </footer>
    </aside>
  )
}
