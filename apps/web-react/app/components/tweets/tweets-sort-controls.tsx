import { Calendar, ChevronDown, SortAsc, SortDesc, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Calendar as CalendarComponent } from '~/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import type { DateRange, SortOrder } from '~/stores'

interface TweetsSortControlsProps {
  className?: string
  showDateFilter?: boolean
  showSortControls?: boolean
  sortFilterActions?: {
    setSortOrder: (order: SortOrder) => Promise<void>
    setDateRange: (range: DateRange) => Promise<void>
    filters: {
      sortOrder: SortOrder
      dateRange: DateRange
    }
  }
}

export function TweetsSortControls({
  className,
  showDateFilter = true,
  showSortControls = true,
  sortFilterActions,
}: TweetsSortControlsProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [tempDateRange, setTempDateRange] = useState<DateRange>(
    sortFilterActions?.filters.dateRange || { startDate: null, endDate: null },
  )

  const handleSortOrderChange = async (order: SortOrder) => {
    await sortFilterActions?.setSortOrder(order)
  }

  const handleDateRangeApply = async () => {
    await sortFilterActions?.setDateRange(tempDateRange)
    setDatePickerOpen(false)
  }

  const handleDateRangeClear = async () => {
    const emptyRange = { startDate: null, endDate: null }
    setTempDateRange(emptyRange)
    await sortFilterActions?.setDateRange(emptyRange)
    setDatePickerOpen(false)
  }

  const formatDateRange = (range: DateRange) => {
    if (!range.startDate && !range.endDate) {
      return 'All dates'
    }

    const format = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    if (range.startDate && range.endDate) {
      return `${format(range.startDate)} - ${format(range.endDate)}`
    }

    if (range.startDate) {
      return `From ${format(range.startDate)}`
    }

    if (range.endDate) {
      return `Until ${format(range.endDate)}`
    }

    return 'All dates'
  }

  const filters = sortFilterActions?.filters || {
    sortOrder: 'desc' as SortOrder,
    dateRange: { startDate: null, endDate: null },
  }

  const hasActiveFilters =
    filters.dateRange.startDate || filters.dateRange.endDate

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Sort Order Control */}
      {showSortControls && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 border-border bg-background hover:bg-accent'
            >
              {filters.sortOrder === 'desc' ? (
                <SortDesc className='h-3 w-3' />
              ) : (
                <SortAsc className='h-3 w-3' />
              )}
              <span className='ml-1 hidden sm:inline'>
                {filters.sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
              </span>
              <ChevronDown className='h-3 w-3 ml-1' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-[140px]'>
            <DropdownMenuItem
              onClick={() => handleSortOrderChange('desc')}
              className={cn(
                'cursor-pointer',
                filters.sortOrder === 'desc' && 'bg-accent',
              )}
            >
              <SortDesc className='h-3 w-3 mr-2' />
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSortOrderChange('asc')}
              className={cn(
                'cursor-pointer',
                filters.sortOrder === 'asc' && 'bg-accent',
              )}
            >
              <SortAsc className='h-3 w-3 mr-2' />
              Oldest first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Date Range Filter */}
      {showDateFilter && (
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size='sm'
              className={cn(
                'h-8 justify-start text-left font-normal',
                hasActiveFilters
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border bg-background hover:bg-accent',
              )}
            >
              <Calendar className='h-3 w-3 mr-1' />
              <span className='hidden sm:inline'>
                {formatDateRange(filters.dateRange)}
              </span>
              <span className='sm:hidden'>Date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <div className='p-3 space-y-3'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Start Date</Label>
                <CalendarComponent
                  mode='single'
                  selected={tempDateRange.startDate || undefined}
                  onSelect={(date) =>
                    setTempDateRange((prev) => ({
                      ...prev,
                      startDate: date || null,
                    }))
                  }
                  initialFocus
                  className='rounded-md border border-border'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>End Date</Label>
                <CalendarComponent
                  mode='single'
                  selected={tempDateRange.endDate || undefined}
                  onSelect={(date) =>
                    setTempDateRange((prev) => ({
                      ...prev,
                      endDate: date || null,
                    }))
                  }
                  disabled={(date) =>
                    tempDateRange.startDate
                      ? date < tempDateRange.startDate
                      : false
                  }
                  className='rounded-md border border-border'
                />
              </div>

              <div className='flex justify-between pt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDateRangeClear}
                  className='h-8'
                >
                  <X className='h-3 w-3 mr-1' />
                  Clear
                </Button>
                <Button
                  size='sm'
                  onClick={handleDateRangeApply}
                  className='h-8'
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <Button
          variant='ghost'
          size='sm'
          onClick={handleDateRangeClear}
          className='h-8 px-2 text-muted-foreground hover:text-foreground'
        >
          <X className='h-3 w-3' />
        </Button>
      )}
    </div>
  )
}
