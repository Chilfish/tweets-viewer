import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { cn } from '~/lib/utils'
import { useAppStore } from '~/stores/app-store'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export function Layout() {
  const params = useParams()
  const isMobile = useIsMobile()
  const { setCurrentLayout, sidebarCollapsed } = useAppStore()

  const currentUser = params.name

  // Update layout based on screen size
  useEffect(() => {
    setCurrentLayout(isMobile ? 'mobile' : 'desktop')
  }, [isMobile, setCurrentLayout])

  if (isMobile) {
    return (
      <div className='min-h-screen bg-white'>
        <TopNav
          title={currentUser ? `@${currentUser}` : 'Tweets Viewer'}
        ></TopNav>

        <main className='pb-20'>
          <Outlet />
        </main>

        <BottomNav currentUser={currentUser} />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar currentUser={currentUser} />

      <div className='flex-1 flex flex-col'>
        <div className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200'>
          <div className='h-12'></div>
        </div>

        <main className='flex-1 bg-white'>
          <div className='max-w-2xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
