import { Link, useLocation } from 'react-router'
import { cn } from '~/lib/utils'
import type { User } from '~/types'

interface UserTabsProps {
  user: User
}

export function UserTabs({ user }: UserTabsProps) {
  const location = useLocation()
  const pathname = location.pathname

  const tabs = [
    { name: '推文', href: `/tweets/${user.screenName}` },
    { name: '媒体', href: `/media/${user.screenName}` },
    { name: '那年今日', href: `/memo/${user.screenName}` },
  ]

  return (
    <div className='border-b border-border px-4'>
      <div className='flex'>
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            to={tab.href}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors duration-200',
              pathname === tab.href
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
