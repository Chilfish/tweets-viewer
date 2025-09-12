import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { useAppStore } from '~/stores/app-store'
import { useUserStore } from '~/stores/user-store'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export default function Layout() {
  const params = useParams()
  const isMobile = useIsMobile()
  const { setCurrentLayout } = useAppStore()

  const curUserName = params.name

  const { getUser, fetchUsers } = useUserStore()

  useEffect(() => {
    fetchUsers().then(() => {
      if (curUserName) {
        getUser(curUserName)
      }
    })
  }, [curUserName, fetchUsers, getUser])

  // Update layout based on screen size
  useEffect(() => {
    setCurrentLayout(isMobile ? 'mobile' : 'desktop')
  }, [isMobile, setCurrentLayout])

  if (isMobile) {
    return (
      <div className='min-h-screen bg-background transition-colors duration-200'>
        <TopNav
          title={curUserName ? `@${curUserName}` : 'Tweets Viewer'}
        ></TopNav>

        <main className='min-h-full'>
          <Outlet />
        </main>

        <BottomNav currentUser={curUserName} />
      </div>
    )
  }

  return (
    <div className='min-h-screen flex bg-muted transition-colors duration-200'>
      <Sidebar currentUser={curUserName} />

      <main className='flex-1 bg-background transition-colors duration-200'>
        <div className='max-w-2xl mx-auto h-full'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
