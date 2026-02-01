import { ChevronLeft, ChevronRight, Menu, XIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface MediaViewerOverlayProps {
  show: boolean
  onClose: () => void
  onShowDetails?: () => void
  hasMultipleMedia: boolean
  currentIndex: number
  totalMedia: number
  onNavigate: (dir: 'next' | 'prev') => void
  className?: string
}

export function MediaViewerOverlay({
  show,
  onClose,
  onShowDetails,
  hasMultipleMedia,
  currentIndex,
  totalMedia,
  onNavigate,
  className,
}: MediaViewerOverlayProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none z-20', className)}>
      {/* 顶部控制栏 */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 p-5 flex justify-end gap-2 transition-all duration-300 ease-out',
          show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none',
        )}
      >
        {onShowDetails && (
          <Button
            size="icon"
            variant="ghost"
            className="size-10 text-white bg-black/40 hover:bg-black/60 rounded-full pointer-events-auto"
            onClick={onShowDetails}
          >
            <Menu className="size-5 stroke-[1.5]" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="size-10 text-white bg-black/40 hover:bg-black/60 rounded-full pointer-events-auto"
          onClick={onClose}
        >
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>

      {/* 左右导航 */}
      {hasMultipleMedia && (
        <div
          className={cn(
            'absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none transition-all duration-300',
            show ? 'opacity-100' : 'opacity-0',
          )}
        >
          {currentIndex > 0 ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-10 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate('prev')
              }}
            >
              <ChevronLeft className="size-6 stroke-[1.5]" />
            </Button>
          ) : <div />}

          {currentIndex < totalMedia - 1 ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-10 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate('next')
              }}
            >
              <ChevronRight className="size-6 stroke-[1.5]" />
            </Button>
          ) : <div />}
        </div>
      )}

      {/* 指示器 */}
      {hasMultipleMedia && (
        <div
          className={cn(
            'absolute bottom-18 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-3 py-2 rounded-full transition-all duration-300',
            show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          )}
        >
          {Array.from({ length: totalMedia }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
