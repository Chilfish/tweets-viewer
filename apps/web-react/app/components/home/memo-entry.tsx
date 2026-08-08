import { CalendarDays, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useArchiveUsers } from './use-archive-users'

/** 首页「那年今日」仪式卡片：大字日期 + 直达 memo 的回忆入口。 */
export function HomeMemoEntry() {
  const { activeUser, recentUsers, users, hasHydrated } = useArchiveUsers()

  if (!hasHydrated)
    return null

  // 目标用户：活跃用户 → 最近浏览 → 首个归档（保证入口始终可直达）
  const memoUser = activeUser ?? recentUsers[0] ?? users[0]
  if (!memoUser)
    return null

  const today = new Date()
  const dateLabel = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })

  return (
    <Link
      to={`/memo/${memoUser.userName}`}
      className="group relative flex w-full max-w-3xl flex-col items-center gap-1 overflow-hidden rounded-2xl border bg-card/50 px-6 py-8 text-center transition-all hover:bg-card hover:shadow-lg active:scale-[0.98] animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150 fill-mode-both"
    >
      {/* 顶部柔光，营造"回忆滤镜" */}
      <div className="pointer-events-none absolute -top-12 left-1/2 size-44 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
        <CalendarDays className="size-3.5" />
        那年今日
      </div>

      <h2 className="mt-1 text-5xl font-bold tracking-tight text-foreground">
        {dateLabel}
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        @
        {memoUser.userName}
        {' '}
        往年今日留下的回忆
      </p>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
        翻开今天
        <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
