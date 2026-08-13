import { cn } from '~/lib/utils'

interface DateDividerProps {
  /** yyyy-MM-dd；空串时渲染兜底文案 */
  dateKey: string
  className?: string
}

/** 今天 / 昨天 / 具体日期（如「2024年3月5日」） */
function formatDateLabel(dateKey: string): string {
  if (!dateKey)
    return '日期未知'

  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d)
    return dateKey

  const today = new Date()
  const isToday = y === today.getFullYear() && m === today.getMonth() + 1 && d === today.getDate()
  if (isToday)
    return '今天'

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const isYesterday
    = y === yesterday.getFullYear() && m === yesterday.getMonth() + 1 && d === yesterday.getDate()
  if (isYesterday)
    return '昨天'

  return `${y}年${m}月${d}日`
}

/**
 * 跨天日期分隔线（5E-2，iOS 消息分组范式）。
 * 居中胶囊标签 + 两侧细分隔线，弱化视觉重量，不打断阅读流。
 */
export function DateDivider({ dateKey, className }: DateDividerProps) {
  return (
    <div
      role="separator"
      aria-label={formatDateLabel(dateKey)}
      className={cn(
        'flex items-center gap-3 px-1 py-2 select-none',
        className,
      )}
    >
      <div className="h-px flex-1 bg-border/60" />
      <span className="rounded-full bg-muted/60 px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
        {formatDateLabel(dateKey)}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}
