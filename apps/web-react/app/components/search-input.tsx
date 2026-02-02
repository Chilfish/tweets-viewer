import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/components/ui/input-group'
import { cn } from '~/lib/utils'

interface SearchInputProps {
  user?: EnrichedUser
  className?: string
  placeholder?: string
  defaultValue?: string
}

export function SearchInput({ user, className, placeholder, defaultValue }: SearchInputProps) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(defaultValue || '')

  const handleSearch = (e: any) => {
    e.preventDefault()
    if (keyword.trim()) {
      const url = user
        ? `/search/${user.userName}?q=${encodeURIComponent(keyword.trim())}`
        : `/search?q=${encodeURIComponent(keyword.trim())}`
      navigate(url)
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn(className)}
    >

      <InputGroup>
        <InputGroupInput
          aria-label="Search"
          placeholder={placeholder || 'Search'}
          type="search"
          autoComplete="off"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <InputGroupAddon
          onClick={handleSearch}
        >
          <SearchIcon aria-hidden="true" className="size-4" />
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
