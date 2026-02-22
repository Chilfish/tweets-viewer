import { Moon, Sun } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useAppStore } from '~/store/use-app-store'
import { UserSelector } from './user-selector'

interface TopNavProps {
  title?: string
  children?: React.ReactNode
}

export function TopNav({ title, children }: TopNavProps) {
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)

  const toggleTheme = () => {
    // 简单的 light/dark 切换，如果当前是 system 则根据实际色板切换或直接切到对面
    // 这里简单处理：system -> dark -> light -> dark ...
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <div className="sticky top-0 z-50 bg-background/60 backdrop-blur-lg border-b border-border transition-colors duration-200">
      <div className="flex items-center py-1 px-4">
        <UserSelector />

        {/* Dark mode toggle */}
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 py-2 px-3 h-auto ml-auto text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
        >
          <Sun className="size-5 dark:hidden" />
          <Moon className="size-5 hidden dark:block" />
        </Button>
      </div>
    </div>
  )
}
