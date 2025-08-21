import { ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface TopNavProps {
  title: string
  onBack?: () => void
  showBack?: boolean
}

export function TopNav({ title, onBack, showBack = true }: TopNavProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      window.history.back()
    }
  }

  return (
    <div className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200'>
      <div className='flex items-center h-14 px-4'>
        {showBack && (
          <Button
            variant='ghost'
            size='icon'
            onClick={handleBack}
            className='mr-3 size-8'
          >
            <ArrowLeft className='size-5' />
          </Button>
        )}

        <div className='flex-1'>
          <h1 className='text-lg font-semibold truncate'>{title}</h1>
        </div>
      </div>
    </div>
  )
}
