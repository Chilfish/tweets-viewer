import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { useUserStore } from '~/store/use-user-store'

/** 首页共用的归档用户解析：继续浏览/最近浏览/那年今日入口都依赖同一份派生数据。 */
export function useArchiveUsers() {
  const users = useUserStore(s => s.users)
  const activeUser = useUserStore(s => s.activeUser)
  const recentUserNames = useUserStore(s => s.recentUserNames)
  const hasHydrated = useUserStore(s => s._hasHydrated)

  // 用当前用户列表解析最近浏览（用户名是唯一键，避免持久化陈旧快照）
  const recentUsers = recentUserNames
    .map(name => users.find(user => user.userName === name))
    .filter((user): user is EnrichedUser => Boolean(user))

  return { users, activeUser, recentUsers, hasHydrated }
}
