/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import type { TweetMedia } from '@tweets-viewer/shared'
import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { useIntersectionObserver } from '~/hooks/use-intersection-observer'
import { cn } from '~/lib/utils'
import type { MediaItem } from '~/stores/media-store'

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

  // 计算预期的高度比例
  const aspectRatio =
    item.width > 0 && item.height > 0 ? item.height / item.width : 1

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
      <div className='w-full bg-muted flex items-center justify-center text-center text-muted-foreground text-xs py-4'>
        媒体可能已被删除或无法加载
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded bg-muted cursor-pointer ${
        className || ''
      }`}
      onClick={handleClick}
      style={{
        minHeight: '120px', // 确保最小高度
      }}
    >
      {/* Skeleton placeholder - 使用相对定位确保占据正确空间 */}
      {!isLoaded && (
        <div
          className='w-full bg-muted-foreground/10 animate-pulse rounded-md'
          style={{
            height: '100%',
            aspectRatio,
          }}
        />
      )}

      {/* Media content */}
      {shouldLoad &&
        !isError &&
        (isVideo ? (
          <div className='relative w-full h-full'>
            <video
              src={item.url}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoadedData={handleLoad}
              onError={handleError}
              playsInline
              muted
              autoPlay={false}
            />
            <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-200'>
              <div className='bg-black/60 rounded-full p-3'>
                <Play className='size-6 text-white fill-white' />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={item.url}
            alt=''
            className={cn(
              `w-full h-full object-cover transition-opacity duration-300`,
              isLoaded ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        ))}
    </div>
  )
}
