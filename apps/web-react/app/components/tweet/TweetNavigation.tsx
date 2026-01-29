import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'

interface TweetNavigationProps {
  totalPages: number
  className?: string
}

/**
 * 紧凑型导航控制器
 * 仅包含：[上一页] [页码下拉] [下一页]
 * 适合嵌入统一的 Toolbar
 */
export function TweetNavigation({ totalPages, className }: TweetNavigationProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  // 即使总页数为 1，也应渲染组件以保持 Header 结构稳定
  // 只是在这种情况下，前后翻页按钮会被禁用
  const showDropdown = totalPages > 1

  const navigateToPage = (p: number) => {
    if (p === currentPage || p < 1 || p > totalPages)
      return
    setSearchParams(
      (prev) => {
        prev.set('page', p.toString())
        return prev
      },
      { replace: false },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        disabled={currentPage <= 1}
        onClick={() => navigateToPage(currentPage - 1)}
        title="上一页"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!showDropdown}
          render={(

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 gap-1.5 font-semibold rounded-full px-3 text-sm hover:bg-accent',
                !showDropdown && 'opacity-100 cursor-default hover:bg-transparent',
              )}
            />
          )}
        >
          <span>{currentPage}</span>
          <span className="text-muted-foreground font-normal">
            /
            {totalPages > 0 ? totalPages : 1}
          </span>
          {showDropdown && <ChevronDown className="size-3.5 opacity-50 ml-0.5" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-80 overflow-y-auto min-w-[100px]">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <DropdownMenuItem
              key={p}
              onClick={() => navigateToPage(p)}
              className={cn('justify-center', p === currentPage && 'bg-accent font-bold')}
            >
              第
              {' '}
              {p}
              {' '}
              页
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        disabled={currentPage >= totalPages}
        onClick={() => navigateToPage(currentPage + 1)}
        title="下一页"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
