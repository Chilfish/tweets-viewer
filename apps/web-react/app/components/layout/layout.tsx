import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { useEffect } from 'react'
import { Outlet, useLoaderData, useLocation, useMatches, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { apiClient, cn } from '~/lib/utils'
import { useUserStore } from '~/store/use-user-store'
import { ProfileHeader } from '../profile/ProfileHeader'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export async function loader({ params }: { params: { name?: string } }) {
  const { name } = params

  const usersRes = await apiClient.get<EnrichedUser[]>(`/users/all`)
  const activeUser = usersRes.data.find(user => user.userName === name) || null

  return {
    allUsers: usersRes.data,
    activeUser,
  }
}

export default function Layout() {
  const { allUsers, activeUser } = useLoaderData<typeof loader>()
  const params = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const curUserName = params.name

  const matches = useMatches()
  const isWide = matches.some((m: any) => m.handle?.isWide)
  const isHome = matches.some((m: any) => m.handle?.isHome)

  const { setUsers, setActiveUser } = useUserStore()

  useEffect(() => {
    setUsers(allUsers)
  }, [allUsers, setUsers])

  useEffect(() => {
    setActiveUser(activeUser)
  }, [activeUser, setActiveUser])

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

          {!isHome && <ProfileHeader user={activeUser} isWide={isWide} />}
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
        {!isHome && <ProfileHeader user={activeUser} isWide={isWide} />}
        {outletWrapper}
      </main>
    </div>
  )
}
