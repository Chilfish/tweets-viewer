import { Outlet, useLocation, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export default function Layout() {
  const params = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const curUserName = params.name

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
