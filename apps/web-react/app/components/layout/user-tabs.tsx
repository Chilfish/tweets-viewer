import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'
import type { User } from '~/types'

interface UserTabsProps {
  user: User
}

export function UserTabs({ user }: UserTabsProps) {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const tabs = [
    { name: '推文', href: `/tweets/${user.screenName}` },
    { name: '媒体', href: `/media/${user.screenName}` },
    { name: '那年今日', href: `/memo/${user.screenName}` },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      navigate(
        `/search/${user.screenName}?q=${encodeURIComponent(keyword.trim())}`,
      )
    }
  }

  return (
    <div className='border-b border-border px-4 flex justify-between items-center'>
      {/* Left side: Tabs */}
      <div className='flex'>
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            to={tab.href}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors duration-200',
              pathname.startsWith(tab.href)
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.name}
          </Link>
        ))}
      </div>

      {/* Right side: Search Form */}
      <form onSubmit={handleSearch} className='flex items-center gap-2 py-2'>
        <div className='relative'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='搜索推文...'
            className='pl-9 h-9 w-40 md:w-56' // Compact width
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </form>
    </div>
  )
}
