import type { DateRange } from '@daypicker/react'
import { zhCN as dayPickerLocale } from '@daypicker/react/locale'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon, FilterX, MoveRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import {
  Sheet,
  SheetFooter,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { useIsMobile } from '~/hooks/use-mobile'
import { cn } from '~/lib/utils'

// 推文归档的合理下限（Twitter 上线初期）
const EARLIEST_MONTH = new Date(2007, 0)

interface DateRangeFilterProps {
  start?: Date
  end?: Date
  onApply: (range: DateRange | undefined) => void
}

function formatLabel(start?: Date, end?: Date) {
  if (start && end)
    return `${format(start, 'yyyy/MM/dd')} - ${format(end, 'yyyy/MM/dd')}`
  if (start)
    return `自 ${format(start, 'yyyy/MM/dd')} 起`
  if (end)
    return `至 ${format(end, 'yyyy/MM/dd')} 止`
  return '日期'
}

/** 手机端紧凑标签：同年省略重复年份，跨年用短年份 */
function formatCompactLabel(start?: Date, end?: Date) {
  if (start && end) {
    return start.getFullYear() === end.getFullYear()
      ? `${format(start, 'yyyy/MM/dd')} - ${format(end, 'MM/dd')}`
      : `${format(start, 'yy/MM/dd')} - ${format(end, 'yy/MM/dd')}`
  }
  if (start)
    return `自 ${format(start, 'yy/MM/dd')} 起`
  if (end)
    return `至 ${format(end, 'yy/MM/dd')} 止`
  return '日期'
}

/** 预览条上的单个日期，可点击跳转到对应月份 */
function PreviewDate({
  date,
  placeholder,
  picking,
  onJump,
}: {
  date?: Date
  placeholder: string
  /** 是否正在等待用户点选这个日期 */
  picking: boolean
  onJump: (date: Date) => void
}) {
  if (!date) {
    return (
      <span className={cn(
        'flex h-7 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-dashed px-2 text-xs transition-colors',
        picking
          ? 'border-primary/50 text-foreground'
          : 'border-border text-muted-foreground',
      )}
      >
        {placeholder}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onJump(date)}
      className="flex h-7 min-w-0 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-accent px-2 text-xs font-medium transition-all duration-150 ease-out hover:bg-accent/70 active:scale-95"
    >
      {format(date, 'yyyy/M/d EEE', { locale: zhCN })}
    </button>
  )
}

export function DateRangeFilter({ start, end, onApply }: DateRangeFilterProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()
  const [month, setMonth] = useState<Date>(new Date())

  const hasActiveFilter = !!(start || end)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      // 打开时以已生效的筛选作为草稿
      setDraft(start || end ? { from: start, to: end } : undefined)
      setMonth(start ?? end ?? new Date())
    }
  }

  const apply = (range: DateRange | undefined) => {
    onApply(range)
    setOpen(false)
  }

  const triggerButton = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'min-w-0 gap-2 transition-all',
        hasActiveFilter
          ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground',
      )}
    />
  )

  const triggerChildren = (
    <>
      <CalendarIcon className="size-4 shrink-0" />
      <span className={cn('truncate text-xs', hasActiveFilter && 'font-medium')}>
        {isMobile ? formatCompactLabel(start, end) : formatLabel(start, end)}
      </span>
    </>
  )

  /** 预览头 + 日历 + 预设，两种容器共用 */
  const pickerBody = (
    <>
      {/* 范围预览：实时反馈当前草稿，点击日期可跳转月份 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <PreviewDate
            date={draft?.from}
            placeholder="起始日期"
            picking={!draft?.from}
            onJump={setMonth}
          />
          <MoveRight className="size-3.5 shrink-0 text-muted-foreground" />
          <PreviewDate
            date={draft?.to}
            placeholder="截止日期"
            picking={!!draft?.from && !draft?.to}
            onJump={setMonth}
          />
        </div>
      </div>

      <Separator />

      <div className="flex justify-center px-3 py-3">
        <Calendar
          mode="range"
          locale={dayPickerLocale}
          formatters={{
            formatMonthDropdown: date =>
              date.toLocaleString('zh-CN', { month: 'short' }),
          }}
          selected={draft}
          onSelect={setDraft}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={EARLIEST_MONTH}
          endMonth={new Date()}
          disabled={date => date > new Date()}
          autoFocus
          className={cn(isMobile && '[--cell-size:--spacing(11)]!')}
        />
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger render={triggerButton}>
          {triggerChildren}
        </SheetTrigger>
        <SheetPopup side="bottom" showCloseButton={false} className="rounded-t-2xl">
          <SheetTitle className="sr-only">选择日期范围</SheetTitle>
          {pickerBody}
          <SheetFooter variant="bare" className="px-4">
            <Button
              className="h-11"
              onClick={() => apply(draft)}
              disabled={!draft?.from && !draft?.to}
            >
              确认筛选
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => apply(undefined)}
              disabled={!hasActiveFilter && !draft}
            >
              <FilterX className="size-3.5 mr-1.5" />
              重置
            </Button>
          </SheetFooter>
        </SheetPopup>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={triggerButton}>
        {triggerChildren}
      </PopoverTrigger>

      <PopoverContent
        className="w-[320px] max-w-[calc(100vw-2rem)] p-0 border-border/40 shadow-2xl backdrop-blur-3xl"
        align="end"
        sideOffset={8}
      >
        {pickerBody}

        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => apply(undefined)}
            disabled={!hasActiveFilter && !draft}
          >
            <FilterX className="size-3.5 mr-1.5" />
            重置
          </Button>
          <Button
            size="sm"
            onClick={() => apply(draft)}
            disabled={!draft?.from && !draft?.to}
          >
            确认筛选
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
