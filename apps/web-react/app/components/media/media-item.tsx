/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import type { TweetMedia } from '@tweets-viewer/shared'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'
import type { MediaItem } from '~/stores/media-store'

interface MediaItemProps {
  item: MediaItem | TweetMedia
  onClick?: (item: MediaItem | TweetMedia) => void
  className?: string
  isInPreview?: boolean
  displayMode?: 'fit' | 'scroll'
}

export function MediaItemComponent({
  item,
  onClick,
  className,
  isInPreview,
  displayMode = 'fit',
}: MediaItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [playVideo, setPlayVideo] = useState(false)

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
      {/* 骨架图 - 在图片加载时显示 */}
      {!imageLoaded && (
        <Skeleton
          className='w-full rounded-md absolute top-0 left-0'
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
          }}
        />
      )}

      {/* 错误状态 */}
      {imageError && (
        <div
          className='w-full bg-muted flex items-center justify-center text-muted-foreground text-sm'
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
          }}
        >
          媒体可能是被删除了
        </div>
      )}

      {isVideo ? (
        <div className='relative h-full w-full'>
          <video
            src={item.url}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              aspectRatio: `${item.width} / ${item.height}`,
            }}
            preload='metadata'
            playsInline
            controls={playVideo && isInPreview}
            autoPlay={playVideo && isInPreview}
            loop
            onLoadedData={handleImageLoad}
            onError={handleImageError}
          />

          {/* 视频播放按钮 overlay */}
          {!playVideo && (
            <div
              onClick={() => setPlayVideo(true)}
              className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-200'
            >
              <div className='bg-black/60 rounded-full p-3'>
                <Play className='size-6 text-white fill-white' />
              </div>
            </div>
          )}
        </div>
      ) : (
        <img
          src={item.url}
          alt=''
          className={cn(
            `w-full h-full object-cover transition-opacity duration-200`,
            {
              'opacity-100': imageLoaded,
              'opacity-0': !imageLoaded,
            },
            isInPreview && {
              'max-w-full max-h-full object-contain': displayMode === 'fit',
              'w-full h-auto': displayMode === 'scroll',
            },
          )}
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
          }}
          loading='lazy'
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  )
}
