import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { useEffect } from 'react'
import { Outlet, useLoaderData, useLocation, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { apiClient } from '~/lib/utils'
import { useUserStore } from '~/store/use-user-store'
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

  const { setUsers, setActiveUser } = useUserStore()

  useEffect(() => {
    setUsers(allUsers)
  }, [allUsers, setUsers])

  useEffect(() => {
    setActiveUser(activeUser)
  }, [activeUser, setActiveUser])

  const outletWrapper = (
    <div key={location.pathname} className="animate-in fade-in-0 duration-300">
      <Outlet />
    </div>
  )

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <TopNav title={curUserName ? `@${curUserName}` : 'Tweets Viewer'} />

        <main className="min-h-full pb-20">{outletWrapper}</main>

        <BottomNav currentUser={curUserName} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar currentUser={curUserName} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 border-r border-border/40">
        <div className="mx-auto h-full">{outletWrapper}</div>
      </main>
    </div>
  )
}
