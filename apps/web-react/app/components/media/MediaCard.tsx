import type { FlatMediaItem } from '~/routes/media'
import { VideoIcon } from 'lucide-react'
import { memo, useState } from 'react'
import { cn } from '~/lib/utils'

interface MediaCardProps {
  item: FlatMediaItem
  onClick: () => void
}

export const MediaCard = memo(({ item, onClick }: MediaCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const isVideo = item.type === 'video' || item.type === 'animated_gif'

  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-muted/30 border border-border/30 transition-all hover:shadow-lg hover:border-primary/30 hover:scale-[1.02]"
    >
      {/* 图片/封面 */}
      <img
        src={item.url}
        alt="media"
        className={cn(
          'w-full h-auto object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
        )}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        // Key prop isn't needed here, but decoding="async" helps with main thread
        decoding="async"
      />

      {/* 视频指示器 */}
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-1 rounded-md text-white">
          <VideoIcon className="size-3.5" />
        </div>
      )}

      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
    </div>
  )
})
MediaCard.displayName = 'MediaCard'
