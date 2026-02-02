import { useSearchParams } from 'react-router'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import { cn } from '~/lib/utils'

interface TweetPaginationProps {
  totalPages: number
  className?: string
}

export function TweetPagination({ totalPages, className }: TweetPaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  if (totalPages <= 1)
    return null

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

  // 计算显示的页码范围
  const getVisiblePages = () => {
    const pages = []
    const range = 1 // 当前页左右显示的页数

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1
        || i === totalPages
        || (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i)
      }
      else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis')
      }
    }
    return pages
  }

  return (
    <div className={cn(
      'sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 py-2 transition-all duration-200',
      className,
    )}
    >
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
        {/* 标准 Pagination 组件 */}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => navigateToPage(currentPage - 1)}
                className={cn(currentPage <= 1 && 'opacity-30 pointer-events-none')}
              />
            </PaginationItem>

            {getVisiblePages().map((p, idx) => (
              <PaginationItem key={idx}>
                {p === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    isActive={p === currentPage}
                    onClick={() => navigateToPage(p as number)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => navigateToPage(currentPage + 1)}
                className={cn(currentPage >= totalPages && 'opacity-30 pointer-events-none')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
