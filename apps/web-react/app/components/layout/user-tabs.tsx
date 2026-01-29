import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Tabs, TabsList, TabsTab } from '~/components/ui/tabs'

interface UserTabsProps {
  user: EnrichedUser
}

export function UserTabs({ user }: UserTabsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  const tabs = useMemo(() => [
    { name: '推文', value: 'tweets', href: `/tweets/${user.fullName}` },
    { name: '媒体', value: 'media', href: `/media/${user.fullName}` },
    { name: '那年今日', value: 'memo', href: `/memo/${user.fullName}` },
    { name: 'Instagram', value: 'ins', href: `/ins/${user.fullName}` },
  ], [user.fullName])

  // 根据当前路径自动计算激活的 Tab
  const activeTab = useMemo(() => {
    return tabs.find(tab => pathname.startsWith(tab.href))?.value || 'tweets'
  }, [pathname, tabs])

  return (
    <div className="px-4 mb-2">
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          const target = tabs.find(t => t.value === val)
          if (target)
            navigate(target.href)
        }}
      >
        <div className="border-b border-border/40">
          <TabsList variant="underline" className="gap-x-2">
            {tabs.map(tab => (
              <TabsTab
                key={tab.value}
                value={tab.value}
                className="px-4 py-3 h-auto data-active:text-primary hover:text-primary transition-colors font-semibold"
              >
                {tab.name}
              </TabsTab>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}
