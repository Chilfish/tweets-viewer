import type { User } from '@tweets-viewer/shared'
import { createRef, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { cn } from '~/lib/utils'

interface UserTabsProps {
  user: User
}

export function UserTabs({ user }: UserTabsProps) {
  const location = useLocation()
  const pathname = location.pathname

  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const tabs = useMemo(
    () => [
      {
        name: '推文',
        href: `/tweets/${user.screenName}`,
        ref: createRef<HTMLAnchorElement>(),
      },
      {
        name: '媒体',
        href: `/media/${user.screenName}`,
        ref: createRef<HTMLAnchorElement>(),
      },
      {
        name: '那年今日',
        href: `/memo/${user.screenName}`,
        ref: createRef<HTMLAnchorElement>(),
      },
      {
        name: 'Instagram',
        href: `/ins/${user.screenName}`,
        ref: createRef<HTMLAnchorElement>(),
      },
    ],
    [user.screenName],
  )

  useEffect(() => {
    const activeTab = tabs.find(tab => pathname.startsWith(tab.href))
    const activeTabNode = activeTab?.ref.current
    const containerNode = tabsContainerRef.current

    if (activeTabNode && containerNode) {
      const containerRect = containerNode.getBoundingClientRect()
      const tabRect = activeTabNode.getBoundingClientRect()

      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }
  }, [pathname, tabs])

  return (
    <div className="border-b border-border px-4 mb-2 flex justify-between items-center">
      <div className="relative flex" ref={tabsContainerRef}>
        {tabs.map(tab => (
          <Link
            key={tab.name}
            to={tab.href}
            ref={tab.ref}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors duration-200 z-10',
              pathname.startsWith(tab.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.name}
          </Link>
        ))}
        <div
          className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-in-out"
          style={indicatorStyle}
        />
      </div>
    </div>
  )
}
