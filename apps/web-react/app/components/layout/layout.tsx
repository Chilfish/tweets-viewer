import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { useEffect } from 'react'
import { Outlet, useLocation, useParams } from 'react-router'
import useSWR from 'swr'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { useUserStore } from '~/store/use-user-store'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

async function getAllUsers() {
  const { data } = await axios.get<EnrichedUser[]>(`${apiUrl}/users/all`)
  return data
}

export default function Layout() {
  const params = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const curUserName = params.name

  const setUsers = useUserStore(state => state.setUsers)

  // Fetch all archived users globally
  const { data: users } = useSWR('all-users', getAllUsers, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  })

  useEffect(() => {
    if (users) {
      setUsers(users)
    }
  }, [users, setUsers])

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
