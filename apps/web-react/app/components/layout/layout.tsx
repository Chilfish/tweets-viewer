import { ArrowUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router'
import { TopNav } from '~/components/top-nav'
import { Button } from '~/components/ui/button'
import { useIsMobile } from '~/hooks/use-mobile'
import { useAppStore } from '~/stores/app-store'
import { useUserStore } from '~/stores/user-store'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'

export default function Layout() {
  const params = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { setCurrentLayout } = useAppStore()

  const curUserName = params.name

  const { getUser, fetchUsers } = useUserStore()

  const [showFab, setShowFab] = useState(false)
  const lastScrollY = useRef(0)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    // Show FAB only when scrolling up and past a certain threshold
    if (currentScrollY < lastScrollY.current && currentScrollY > 400) {
      setShowFab(true)
    } else {
      setShowFab(false)
    }
    lastScrollY.current = currentScrollY
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

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

  const outletWrapper = (
    <div key={location.pathname} className='animate-in fade-in-0 duration-300'>
      <Outlet />
    </div>
  )

  const fab = showFab ? (
    <Button
      onClick={scrollToTop}
      variant='default'
      size='icon'
      className='fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 h-12 w-12 rounded-full shadow-lg animate-in fade-in-0 zoom-in-95 duration-300'
    >
      <ArrowUp className='h-6 w-6' />
    </Button>
  ) : null

  if (isMobile) {
    return (
      <div className='min-h-screen bg-background transition-colors duration-200'>
        <TopNav
          title={curUserName ? `@${curUserName}` : 'Tweets Viewer'}
        ></TopNav>

        <main className='min-h-full'>{outletWrapper}</main>

        <BottomNav currentUser={curUserName} />
        {fab}
      </div>
    )
  }

  return (
    <div className='min-h-screen flex bg-muted transition-colors duration-200'>
      <Sidebar currentUser={curUserName} />

      <main className='flex-1 bg-background transition-colors duration-200'>
        <div className='max-w-2xl mx-auto h-full'>{outletWrapper}</div>
      </main>
      {fab}
    </div>
  )
}
