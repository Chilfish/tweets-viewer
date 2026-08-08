import type { DateRange } from '@daypicker/react'
import { format } from 'date-fns'
import { MessageSquareOff, SortAsc, SortDesc } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { DateRangeFilter } from '~/components/tweet/date-range-filter'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface Props {
  hideComments?: boolean
  /** 隐藏日期范围筛选（如「那年今日」等按日聚合的页面，API 不支持 start/end） */
  hideDateRange?: boolean
  className?: string
}

export function TweetsToolbarActions({ className, hideComments = false, hideDateRange = false }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()

  const isReverse = searchParams.get('reverse') === 'true'
  const noReplies = searchParams.get('no_replies') === 'true'
  const startDateStr = searchParams.get('start')
  const endDateStr = searchParams.get('end')

  const toggleSort = () => {
    setSearchParams((prev) => {
      if (isReverse)
        prev.delete('reverse')
      else prev.set('reverse', 'true')
      prev.delete('page')
      return prev
    })
  }

  const toggleNoReplies = () => {
    setSearchParams((prev) => {
      if (noReplies)
        prev.delete('no_replies')
      else prev.set('no_replies', 'true')
      prev.delete('page')
      return prev
    })
  }

  const applyDateRange = (range: DateRange | undefined) => {
    setSearchParams((prev) => {
      if (range?.from)
        prev.set('start', format(range.from, 'yyyy-MM-dd'))
      else prev.delete('start')

      if (range?.to)
        prev.set('end', format(range.to, 'yyyy-MM-dd'))
      else prev.delete('end')

      prev.delete('page')
      return prev
    })
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2 py-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSort}
      >
        {isReverse ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
        <span className="hidden sm:inline text-xs font-medium">排序</span>
      </Button>

      {
        !hideComments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleNoReplies}
            className={cn(noReplies && 'text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary')}
          >
            <MessageSquareOff className="size-4" />
            <span className="hidden sm:inline text-xs font-medium">不看评论</span>
          </Button>
        )
      }

      {
        !hideDateRange && (
          <DateRangeFilter
            start={startDateStr ? new Date(startDateStr) : undefined}
            end={endDateStr ? new Date(endDateStr) : undefined}
            onApply={applyDateRange}
          />
        )
      }
    </div>
  )
}
