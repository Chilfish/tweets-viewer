import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { IGUserInfo } from '@tweets-viewer/shared'
import type { ClientLoaderFunctionArgs, ShouldRevalidateFunctionArgs } from 'react-router'
import type { Route } from './+types/layout'
import { isAxiosError } from 'axios'
import { Outlet, useLocation, useMatches, useParams, useViewTransitionState } from 'react-router'
import { TopNav } from '~/components/layout/top-nav'
import { InsProfileHeader } from '~/components/profile/InsProfileHeader'
import { InsProfileHeaderSkeleton } from '~/components/skeletons/ins-profile'
import { useIsMobile } from '~/hooks/use-mobile'
import { useGlobalShortcuts } from '~/hooks/use-global-shortcuts'
import { useScrollPositionMemory } from '~/hooks/use-scroll-position-memory'
import { apiClient, cn } from '~/lib/utils'
import { useUserStore } from '~/store/use-user-store'
import { ProfileHeader } from '../profile/ProfileHeader'
import { ProfileHeaderSkeleton } from '../skeletons/profile'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export async function clientLoader({ params, request }: ClientLoaderFunctionArgs) {
  const { name } = params
  const isInsRoute = new URL(request.url).pathname.startsWith('/ins/')

  // Instagram 路线：获取 IG 用户信息
  if (isInsRoute) {
    const { data } = await apiClient.get<{ user: IGUserInfo }>(`/ins/${name}`).catch((err) => {
      if (isAxiosError(err) && err.response) {
        if (err.response.status !== 404) {
          console.error(`IG load failed (${err.response.status}):`, err.message)
        }
      }
      else {
        console.error('IG load failed:', err)
      }
      return {
        data: {
          user: null,
          activeUser: null,
          allUsers: [],
        },
      }
    })
    return { igUser: data.user, activeUser: null, allUsers: [] }
  }

  // Tweet 路线：获取 Twitter 用户列表
  const {
    users,
    isInitialized,
    setUsers,
    setInitialized,
    setActiveUser,
    pushRecentUser,
  } = useUserStore.getState()
  let allUsers = users
  if (!isInitialized || allUsers.length === 0) {
    const usersRes = await apiClient.get<EnrichedUser[]>(`/users/all`)
    allUsers = usersRes.data.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''))
    setUsers(allUsers)
    setInitialized(true)
  }

  const activeUser = allUsers.find(user => user.userName === name) || null
  setActiveUser(activeUser)
  // 记录最近浏览（首页「最近浏览/继续浏览」入口依赖此数据）
  if (activeUser)
    pushRecentUser(activeUser.userName ?? '')

  return { activeUser, allUsers, igUser: null }
}

export function HydrateFallback() {
  const matches = useMatches()
  const location = useLocation()
  const isMobile = useIsMobile()
  const isInsRoute = location.pathname.startsWith('/ins/')
  const currentHandle = matches[matches.length - 1]?.handle as {
    skeleton?: React.ReactNode
    isWide?: boolean
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <TopNav />

        <main className="flex-1 flex flex-col items-center justify-start gap-4 pt-2 mx-auto min-w-0 border-r border-border/40">

          {isInsRoute ? <InsProfileHeaderSkeleton /> : <ProfileHeader user={null} />}
          <div className="w-full">
            {currentHandle?.skeleton || <Outlet />}
          </div>
        </main>

        <BottomNav currentUser={undefined} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-200">
      <Sidebar currentUser={undefined} />

      <main className={cn(
        'flex-1 flex flex-col items-center justify-start gap-4 pt-2 mx-auto min-w-0 border-r border-border/40 transition-all duration-300',
        currentHandle.isWide ? 'sm:max-w-6xl' : 'sm:max-w-[600px]',
      )}
      >
        {isInsRoute ? <InsProfileHeaderSkeleton /> : <ProfileHeaderSkeleton />}

        <div className="w-full">
          {currentHandle?.skeleton || <Outlet />}
        </div>
      </main>
    </div>
  )
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

export default function Layout({ loaderData }: Route.ComponentProps) {
  const params = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const curUserName = params.name
  useGlobalShortcuts()
  useScrollPositionMemory()

  const matches = useMatches()
  const isWide = matches.some((m: any) => m.handle?.isWide)
  const isHome = matches.some((m: any) => m.handle?.isHome)
  const isInsRoute = location.pathname.startsWith('/ins/')

  const { activeUser: storeActiveUser } = useUserStore()
  const { activeUser: loaderActiveUser, igUser: loaderIgUser } = loaderData

  // 渲染时优先使用 store 中的最新数据，loader 数据作为降级
  const displayActiveUser = storeActiveUser || loaderActiveUser

  // 5B-2：页面进入动画与 ViewTransition 协调。
  // - 有活跃 ViewTransition 时（route handle 定义 transition 类型的导航），交给文档级过渡，
  //   不再叠加 CSS 进入动画（避免双重动画）；
  // - 无 VT（不支持/降级/浏览器前进后退）时，按 route handle 的 pageTransition 类型播放进入动画。
  const isViewTransitioning = useViewTransitionState(location.pathname)
  const currentHandle = matches[matches.length - 1]?.handle as
    | { pageTransition?: 'default' | 'fade' | 'slide' }
    | undefined
  const pageTransition = currentHandle?.pageTransition ?? 'default'

  const enterAnimation = {
    default: 'animate-in fade-in-0 duration-300',
    fade: 'animate-in fade-in-0 duration-500',
    slide: 'animate-in fade-in-0 slide-in-from-right-4 duration-300',
  }[pageTransition]

  const outletWrapper = (
    <div
      key={location.pathname}
      className={cn('w-full', !isViewTransitioning && enterAnimation)}
    >
      <Outlet />
    </div>
  )

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <TopNav title={curUserName ? `@${curUserName}` : 'Tweets Viewer'} />

        <main className="flex-1 flex flex-col items-center justify-start gap-4 pt-2 mx-auto min-w-0 border-r border-border/40">

          {!isHome && (
            isInsRoute
              ? <InsProfileHeader user={loaderIgUser} />
              : <ProfileHeader user={displayActiveUser} isWide={isWide} />
          )}
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
        {!isHome && (
          isInsRoute
            ? <InsProfileHeader user={loaderIgUser} />
            : <ProfileHeader user={displayActiveUser} isWide={isWide} />
        )}
        {outletWrapper}
      </main>
    </div>
  )
}
