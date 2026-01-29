import { format } from 'date-fns'
import { Calendar as CalendarIcon, FilterX, SortAsc, SortDesc } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'

/**
 * 推文排序与过滤控制栏
 */
export function TweetsSortControls({ className }: { className?: string }) {
  const [searchParams, setSearchParams] = useSearchParams()

  // 状态派生自 URL
  const isReverse = searchParams.get('reverse') === 'true'
  const startDateStr = searchParams.get('start')
  const endDateStr = searchParams.get('end')

  const startDate = startDateStr ? new Date(startDateStr) : undefined
  const endDate = endDateStr ? new Date(endDateStr) : undefined

  // 1. 切换排序逻辑
  const toggleSort = () => {
    setSearchParams((prev) => {
      if (isReverse)
        prev.delete('reverse')
      else prev.set('reverse', 'true')
      // 切换排序通常需要重置页码以防定位错乱
      prev.delete('page')
      return prev
    })
  }

  // 2. 日期过滤逻辑
  const updateDateRange = (type: 'start' | 'end', date?: Date) => {
    setSearchParams((prev) => {
      if (!date) {
        prev.delete(type)
      }
      else {
        prev.set(type, format(date, 'yyyy-MM-dd'))
      }
      prev.delete('page')
      return prev
    })
  }

  const clearFilters = () => {
    setSearchParams((prev) => {
      prev.delete('start')
      prev.delete('end')
      prev.delete('page')
      return prev
    })
  }

  const hasActiveFilters = !!(startDate || endDate)

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm',
      className,
    )}
    >
      {/* 排序切换 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSort}
        className="h-9 gap-2 rounded-full hover:bg-accent/50 transition-all active:scale-95"
      >
        {isReverse ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
        <span className="text-sm font-medium">{isReverse ? '最早优先' : '最新优先'}</span>
      </Button>

      <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

      {/* 日期筛选 - 开始 */}
      <Popover>
        <PopoverTrigger render={(
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 gap-2 rounded-full hover:bg-accent/50 transition-all',
              startDate && 'text-primary bg-primary/10 hover:bg-primary/20',
            )}
          />
        )}
        >
          <CalendarIcon className="size-4" />
          <span className="text-sm font-medium">
            {startDate ? format(startDate, 'yyyy/MM/dd') : '起始日期'}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border/40 shadow-2xl" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={date => updateDateRange('start', date)}
            disabled={date => (endDate ? date > endDate : date > new Date())}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* 日期筛选 - 结束 */}
      <Popover>
        <PopoverTrigger render={(
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 gap-2 rounded-full hover:bg-accent/50 transition-all',
              endDate && 'text-primary bg-primary/10 hover:bg-primary/20',
            )}
          />
        )}
        >
          <CalendarIcon className="size-4" />
          <span className="text-sm font-medium">
            {endDate ? format(endDate, 'yyyy/MM/dd') : '截止日期'}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border/40 shadow-2xl" align="end">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={date => updateDateRange('end', date)}
            disabled={date => (startDate ? date < startDate : date > new Date())}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* 清除按钮 */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="清除所有筛选"
        >
          <FilterX className="size-4" />
        </Button>
      )}

    </div>
  )
}
