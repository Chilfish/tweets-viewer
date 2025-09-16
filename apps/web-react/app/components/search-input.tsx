import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Input } from '~/components/ui/input'
import type { User } from '~/types'

interface UserTabsProps {
  user: User
}

export function SearchInput({ user }: UserTabsProps) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      navigate(
        `/search/${user.screenName}?q=${encodeURIComponent(keyword.trim())}`,
      )
    }
  }

  return (
    <form onSubmit={handleSearch} className='flex items-center gap-2 ml-auto'>
      <div className='relative'>
        <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          type='search'
          placeholder='搜索推文...'
          className='pl-9 h-9 w-32 md:w-56'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
    </form>
  )
}
