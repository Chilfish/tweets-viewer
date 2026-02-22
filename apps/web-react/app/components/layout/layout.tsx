import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { ClientLoaderFunctionArgs, ShouldRevalidateFunctionArgs } from 'react-router'
import { Outlet, useLoaderData, useLocation, useMatches, useParams } from 'react-router'
import { TopNav } from '~/components/layout/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { apiClient, cn } from '~/lib/utils'
import { useUserStore } from '~/store/use-user-store'
import { ProfileHeader } from '../profile/ProfileHeader'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { name } = params
  const { users, isInitialized, setUsers, setInitialized, setActiveUser } = useUserStore.getState()

  // 仅在当前会话未初始化或 store 为空时获取用户列表
  let allUsers = users
  if (!isInitialized || allUsers.length === 0) {
    const usersRes = await apiClient.get<EnrichedUser[]>(`/users/all`)
    allUsers = usersRes.data.sort((a, b) => a.userName.localeCompare(b.userName))
    setUsers(allUsers)
    setInitialized(true)
  }

  const activeUser = allUsers.find(user => user.userName === name) || null
  setActiveUser(activeUser)

  return {
    allUsers,
    activeUser,
  }
}

export function shouldRevalidate({
  currentParams,
  nextParams,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // 只有当用户名路由参数变化时才重新触发 loader
  if (currentParams.name !== nextParams.name) {
    return true
  }
  return defaultShouldRevalidate
}

export default function Layout() {
  const params = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const curUserName = params.name

  const matches = useMatches()
  const isWide = matches.some((m: any) => m.handle?.isWide)
  const isHome = matches.some((m: any) => m.handle?.isHome)

  const { activeUser: storeActiveUser } = useUserStore()
  const { activeUser: loaderActiveUser } = useLoaderData<typeof clientLoader>()

  // 渲染时优先使用 store 中的最新数据，loader 数据作为降级
  const displayActiveUser = storeActiveUser || loaderActiveUser

  const outletWrapper = (
    <div
      key={location.pathname}
      className="animate-in fade-in-0 duration-300 w-full"
    >
      <Outlet />
    </div>
  )

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <TopNav title={curUserName ? `@${curUserName}` : 'Tweets Viewer'} />

        <main className="flex-1 flex flex-col items-center justify-start gap-4 pt-2 mx-auto min-w-0 border-r border-border/40">

          {!isHome && <ProfileHeader user={displayActiveUser} isWide={isWide} />}
          {outletWrapper}
        </main>

        <BottomNav currentUser={curUserName} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar currentUser={curUserName} />

      {/* Main Content */}
      <main className={cn(
        'flex-1 flex flex-col items-center justify-start gap-4 pt-2 mx-auto min-w-0 border-r border-border/40 transition-all duration-300',
        isWide ? 'sm:max-w-6xl' : 'sm:max-w-[600px]',
      )}
      >
        {!isHome && <ProfileHeader user={displayActiveUser} isWide={isWide} />}
        {outletWrapper}
      </main>
    </div>
  )
}
