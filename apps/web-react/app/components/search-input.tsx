import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { FormEvent } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'
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

/** 原生风（rounded-full）搜索框：左侧放大镜 + 可清空，回车/点击提交。 */
export function SearchInput({ user, className, placeholder, defaultValue }: SearchInputProps) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(defaultValue || '')

  const handleSearch = (e?: FormEvent) => {
    e?.preventDefault()
    const trimmed = keyword.trim()
    if (trimmed) {
      const url = user
        ? `/search/${user.userName}?q=${encodeURIComponent(trimmed)}`
        : `/search?q=${encodeURIComponent(trimmed)}`
      navigate(url, { viewTransition: true })
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn('w-full', className)}
    >
      <InputGroup className="rounded-full">
        <InputGroupAddon align="inline-start">
          <SearchIcon className="size-4" aria-hidden="true" />
        </InputGroupAddon>

        <InputGroupInput
          aria-label="搜索归档推文"
          placeholder={placeholder || '搜索归档推文'}
          type="search"
          autoComplete="off"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />

        {keyword && (
          <InputGroupAddon
            align="inline-end"
            onClick={() => setKeyword('')}
            aria-label="清空搜索"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  )
}
