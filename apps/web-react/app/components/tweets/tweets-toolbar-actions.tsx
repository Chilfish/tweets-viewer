import { format } from 'date-fns'
import { Calendar as CalendarIcon, FilterX, SortAsc, SortDesc } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'

export function TweetsToolbarActions({ className }: { className?: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)

  const isReverse = searchParams.get('reverse') === 'true'
  const startDateStr = searchParams.get('start')
  const endDateStr = searchParams.get('end')

  // UI state for the calendar selection
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start')
  // Draft state before applying
  const [draftStart, setDraftStart] = useState<Date | undefined>(
    startDateStr ? new Date(startDateStr) : undefined,
  )
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(
    endDateStr ? new Date(endDateStr) : undefined,
  )

  // 1. Sort Toggle
  const toggleSort = () => {
    setSearchParams((prev) => {
      if (isReverse)
        prev.delete('reverse')
      else prev.set('reverse', 'true')
      prev.delete('page')
      return prev
    })
  }

  // 2. Date Operations
  const handleOpenInfo = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      // Sync local state with URL when opening
      setDraftStart(startDateStr ? new Date(startDateStr) : undefined)
      setDraftEnd(endDateStr ? new Date(endDateStr) : undefined)
      setActiveTab('start')
    }
  }

  const applyFilters = () => {
    setSearchParams((prev) => {
      if (draftStart)
        prev.set('start', format(draftStart, 'yyyy-MM-dd'))
      else prev.delete('start')

      if (draftEnd)
        prev.set('end', format(draftEnd, 'yyyy-MM-dd'))
      else prev.delete('end')

      prev.delete('page')
      return prev
    })
    setOpen(false)
  }

  const clearDrafts = () => {
    setDraftStart(undefined)
    setDraftEnd(undefined)
  }

  const getLabel = () => {
    if (draftStart && draftEnd) {
      return `${format(draftStart, 'yyyy/MM/dd')} - ${format(draftEnd, 'yyyy/MM/dd')}`
    }
    if (draftStart)
      return `自 ${format(draftStart, 'yyyy/MM/dd')} 起`
    if (draftEnd)
      return `至 ${format(draftEnd, 'yyyy/MM/dd')} 止`
    return '日期范围'
  }

  const hasActiveFilters = !!(startDateStr || endDateStr)
  const hasDraftValues = !!(draftStart || draftEnd)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSort}
      >
        {isReverse ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
        <span className="hidden sm:inline text-xs font-medium">排序</span>
      </Button>

      <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />

      <Popover open={open} onOpenChange={handleOpenInfo}>
        <PopoverTrigger render={(

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 transition-all',
              hasActiveFilters
                ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
          />
        )}
        >
          <CalendarIcon className="size-4" />
          <span className={cn('text-xs', (hasActiveFilters || hasDraftValues) ? 'font-medium' : '')}>
            {hasActiveFilters ? getLabel() : '日期'}
          </span>
        </PopoverTrigger>

        <PopoverContent
          className="w-[320px] p-0 border-border/40 shadow-2xl backdrop-blur-3xl"
          align="end"
          sideOffset={8}
        >
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'start' | 'end')} className="w-full">
            <div className="flex items-center justify-between border-b border-border/40">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="start" className="text-xs">
                  起始
                  {draftStart ? ` ${format(draftStart, 'MM/dd')}` : ''}
                </TabsTrigger>
                <TabsTrigger value="end" className="text-xs">
                  截止
                  {draftEnd ? ` ${format(draftEnd, 'MM/dd')}` : ''}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-0">
              <TabsContent value="start" className="m-0 border-none">
                <Calendar
                  mode="single"
                  selected={draftStart}
                  onSelect={setDraftStart}
                  disabled={date => (draftEnd ? date > draftEnd : date > new Date())}
                  autoFocus
                  className="rounded-none border-none w-full flex justify-center p-3"
                />
              </TabsContent>
              <TabsContent value="end" className="m-0 border-none">
                <Calendar
                  mode="single"
                  selected={draftEnd}
                  onSelect={setDraftEnd}
                  disabled={date => (draftStart ? date < draftStart : date > new Date())}
                  autoFocus
                  className="rounded-none border-none w-full flex justify-center p-3"
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDrafts}
              disabled={!hasDraftValues}
            >
              <FilterX className="size-3.5 mr-1.5" />
              重置
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
              >
                确认筛选
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
