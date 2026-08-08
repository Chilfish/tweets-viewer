import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { Archive, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useArchiveUsers } from './use-archive-users'

function UserCard({ user }: { user: EnrichedUser }) {
  return (
    <Link
      to={`/tweets/${user.userName}`}
      className="group flex items-center gap-3 rounded-2xl border bg-card/50 p-3 transition-all hover:bg-card hover:shadow-lg active:scale-[0.98]"
    >
      <Avatar className="size-11 shrink-0">
        <AvatarImage src={user.profileImage} />
        <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.fullName}</p>
        <p className="truncate text-xs text-muted-foreground">
          @
          {user.userName}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
    </Link>
  )
}

export function HomeUserEntry() {
  const { users, activeUser, recentUsers, hasHydrated } = useArchiveUsers()

  // 等待持久化水合完成，避免闪空（与 UserSelector 一致）
  if (!hasHydrated)
    return <div className="h-32 w-full" />

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 fill-mode-both">
      {/* 继续浏览：上次访问的用户直达入口 */}
      {activeUser && (
        <Link
          to={`/tweets/${activeUser.userName}`}
          className="group relative flex items-center gap-4 rounded-2xl border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-lg active:scale-[0.98]"
        >
          <Avatar className="size-12 shrink-0">
            <AvatarImage src={activeUser.profileImage} />
            <AvatarFallback>{activeUser.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              继续浏览
            </p>
            <p className="truncate font-semibold">{activeUser.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              @
              {activeUser.userName}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      )}

      {/* 最近浏览 */}
      {recentUsers.length > 0 && (
        <section className="w-full">
          <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            最近浏览
          </div>
          <div className="flex flex-wrap gap-2">
            {recentUsers.map(user => (
              <UserCard key={user.userName} user={user} />
            ))}
          </div>
        </section>
      )}

      {/* 归档用户 */}
      {users.length > 0 && (
        <section className="w-full">
          <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            归档用户
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {users.map(user => (
              <UserCard key={user.userName} user={user} />
            ))}
          </div>
        </section>
      )}

      {/* 空态：无任何归档 */}
      {users.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <Archive className="size-10 opacity-20" />
          <p className="text-sm">归档为空，先去抓取数据再回来吧</p>
        </div>
      )}
    </div>
  )
}
