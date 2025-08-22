import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { useIsMobile } from '~/hooks/use-mobile'
import { useAppStore } from '~/stores/app-store'
import { useTweetsStore } from '~/stores/tweets-store'
import { useUserStore } from '~/stores/user-store'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export default function Layout() {
  const params = useParams()
  const isMobile = useIsMobile()
  const { setCurrentLayout } = useAppStore()

  const curUserName = params.name

  const { getUser, setCurUser } = useUserStore()

  useEffect(() => {
    if (!curUserName) return
    getUser(curUserName).then(() => {
      setCurUser(curUserName)
    })
  }, [])

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

        <main className='pb-20'>
          <Outlet />
        </main>

        <BottomNav currentUser={curUserName} />
      </div>
    )
  }

  return (
    <div className='min-h-screen flex bg-muted transition-colors duration-200'>
      <Sidebar currentUser={curUserName} />

      <div className='flex-1 flex flex-col'>
        <div className='sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200'>
          <div className='h-12'></div>
        </div>

        <main className='flex-1 bg-background transition-colors duration-200'>
          <div className='max-w-2xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
