/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import type { TweetMedia } from '@tweets-viewer/shared'
import type { MediaItem } from '~/stores/media-store'
import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useIntersectionObserver } from '~/hooks/use-intersection-observer'
import { cn } from '~/lib/utils'

interface MediaItemProps {
  item: MediaItem | TweetMedia
  onClick?: (item: MediaItem | TweetMedia) => void
  className?: string
}

export function MediaItemComponent({
  item,
  onClick,
  className,
}: MediaItemProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '400px', // Preload images 400px before they enter the viewport
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)

  const isVideo = item.type === 'video' || item.url.includes('.mp4')

  useEffect(() => {
    if (isIntersecting) {
      setShouldLoad(true)
    }
  }, [isIntersecting])

  const handleClick = () => {
    onClick?.(item)
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setIsError(true)
    setIsLoaded(true) // Treat error as "loaded" to remove skeleton
  }

  if (isError) {
    return (
      <div
        className={cn(
          'w-full bg-muted flex items-center justify-center text-center text-muted-foreground text-xs py-4 rounded',
          className,
        )}
      >
        媒体可能已被删除或无法加载
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-hidden bg-muted cursor-pointer',
        'w-full h-full flex items-center justify-center',
        className,
      )}
      onClick={handleClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded" />
      )}

      {shouldLoad && !isError && (
        <>
          {isVideo ? (
            <>
              <video
                src={item.url}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  isLoaded ? 'opacity-100' : 'opacity-0',
                )}
                onLoadedData={handleLoad}
                onError={handleError}
                playsInline
                muted
                autoPlay={false}
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div className="bg-black/60 rounded-full p-3">
                  <Play className="size-6 text-white fill-white" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={item.url}
              alt=""
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </>
      )}
    </div>
  )
}
