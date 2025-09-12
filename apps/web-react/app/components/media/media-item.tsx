/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import type { TweetMedia } from '@tweets-viewer/shared'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isVideo = item.type === 'video' || item.url.includes('.mp4')

  const handleClick = () => {
    onClick?.(item)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  return (
    <div
      className={`group relative overflow-hidden rounded bg-muted cursor-pointer ${className || ''}`}
      onClick={handleClick}
    >
      {!imageLoaded && (
        <Skeleton
          className='w-full rounded-md absolute top-0 left-0'
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
          }}
        />
      )}

      {imageError && (
        <div
          className='w-full bg-muted flex items-center justify-center text-muted-foreground text-sm'
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
          }}
        >
          媒体可能已被删除
        </div>
      )}

      <img
        src={item.url}
        alt=''
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          aspectRatio: `${item.width} / ${item.height}`,
        }}
        loading='lazy'
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {isVideo && (
        <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-200'>
          <div className='bg-black/60 rounded-full p-3'>
            <Play className='size-6 text-white fill-white' />
          </div>
        </div>
      )}
    </div>
  )
}
