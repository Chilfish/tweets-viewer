import { Moon, Sun } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useAppStore } from '~/stores/app-store'
import { UserSelector } from './layout/user-selector'

interface TopNavProps {
  title?: string
  children?: React.ReactNode
}

export function TopNav({ title, children }: TopNavProps) {
  const { isDarkMode, toggleDarkMode } = useAppStore()
  return (
    <div className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200'>
      <div className='flex items-center py-1 px-4'>
        <UserSelector />

        {/* Dark mode toggle */}
        <Button
          variant='ghost'
          size='sm'
          onClick={toggleDarkMode}
          className='flex flex-col items-center gap-1 py-2 px-3 h-auto ml-auto'
        >
          {isDarkMode ? (
            <Sun className='size-5' />
          ) : (
            <Moon className='size-5' />
          )}
        </Button>
      </div>
    </div>
  )
}
