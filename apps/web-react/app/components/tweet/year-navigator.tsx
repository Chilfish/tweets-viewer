import { CalendarRange } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { apiClient, cn } from '~/lib/utils'

interface YearStats {
  year: number
  count: number
}

interface YearNavigatorProps {
  /** 归档用户 */
  name: string
  className?: string
}

/**
 * 时间维度导航（4C-1）+ 档案完整性指示（4C-3）。
 *
 * - 从 `/v3/tweets/stats/:name` 读取按年统计（年份降序）。
 * - 下拉列出每年「YYYY · N 条」；中间缺失的年份以「暂无数据」灰显（档案缺口提示）。
 * - 点击年份 → URL 写入 `start=YYYY-01-01&end=YYYY-12-31`（URL 驱动，loader 自动重跑）。
 * - 已选整年时 trigger 显示年份；自定义日期范围时显示「自定义范围」。
 */
export function YearNavigator({ name, className }: YearNavigatorProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [stats, setStats] = useState<YearStats[] | null>(null)
  const [open, setOpen] = useState(false)

  const start = searchParams.get('start')
  const end = searchParams.get('end')
  // 当前激活的整年（start/end 恰好围住一年时）
  const activeYear = start && end && start.endsWith('-01-01') && end.endsWith('-12-31')
    ? Number(start.slice(0, 4))
    : undefined

  useEffect(() => {
    let cancelled = false
    apiClient.get<YearStats[]>(`/tweets/stats/${name}`)
      .then(({ data }) => {
        if (!cancelled)
          setStats(data)
      })
      .catch(() => { /* 静默失败：导航降级为不可用 */ })
    return () => {
      cancelled = true
    }
  }, [name])

  if (!stats || stats.length === 0)
    return null

  // 完整性：min..max 覆盖区间内的缺口年份（用于灰显）
  const minYear = stats[stats.length - 1]?.year ?? 0
  const maxYear = stats[0]?.year ?? 0
  const allYears: { year: number, count: number | null }[] = []
  for (let y = maxYear; y >= minYear; y--) {
    const stat = stats.find(s => s.year === y)
    allYears.push({ year: y, count: stat?.count ?? null })
  }

  const jumpToYear = (year: number) => {
    setSearchParams((prev) => {
      prev.set('start', `${year}-01-01`)
      prev.set('end', `${year}-12-31`)
      prev.delete('page')
      return prev
    })
    setOpen(false)
  }

  const clearRange = () => {
    setSearchParams((prev) => {
      prev.delete('start')
      prev.delete('end')
      prev.delete('page')
      return prev
    })
    setOpen(false)
  }

  const triggerLabel = activeYear
    ? String(activeYear)
    : start && end
      ? '自定义范围'
      : '按年浏览'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={(
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-1.5', activeYear && 'text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary', className)}
          />
        )}
      >
        <CalendarRange className="size-4" />
        <span className="hidden sm:inline text-xs font-medium">{triggerLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto min-w-[160px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            {minYear}
            {' '}
            -
            {' '}
            {maxYear}
            {' '}
            · 按年浏览归档
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {allYears.map(({ year, count }) => (
          <DropdownMenuItem
            key={year}
            disabled={count === null}
            onClick={() => count !== null && jumpToYear(year)}
            className={cn(
              'justify-between',
              year === activeYear && 'bg-accent font-bold',
              count === null && 'opacity-40 cursor-not-allowed',
            )}
          >
            <span>{year}</span>
            <span className="text-xs text-muted-foreground">
              {count === null ? '暂无数据' : `${count} 条`}
            </span>
          </DropdownMenuItem>
        ))}
        {start && end && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearRange} className="justify-center text-muted-foreground">
              清除日期范围
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
