import { Moon, Sun } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useAppStore } from '~/store/use-app-store'
import { useUserStore } from '~/store/use-user-store'
import { UserSelector } from './user-selector'

export function TopNav({ title }: { title?: string }) {
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const activeUser = useUserStore(s => s.activeUser)

  const toggleTheme = () => {
    // 简单的 light/dark 切换，如果当前是 system 则根据实际色板切换或直接切到对面
    // 这里简单处理：system -> dark -> light -> dark ...
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <div className="top-nav-chrome sticky top-0 z-50 bg-background/60 backdrop-blur-lg border-b border-border transition-colors duration-200">
      <div className="flex items-center gap-2 py-1 px-4">
        {/* 有活跃用户时，用户名上下文由 UserSelector 完整版承载（头像+用户名合并），
            不再显示独立 @user 标题，避免用户名重复；无用户时（首页）显示站点名 */}
        {!activeUser && title && (
          <span className="font-semibold text-sm truncate">{title}</span>
        )}
        <UserSelector />

        {/* Dark mode toggle */}
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="icon"
          className="ml-auto rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
        >
          <Sun className="size-5 dark:hidden" />
          <Moon className="size-5 hidden dark:block" />
        </Button>
      </div>
    </div>
  )
}
