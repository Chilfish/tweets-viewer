import type { EnrichedTweet } from '@tweets-viewer/tweet-types'
import { ImageIcon } from 'lucide-react'
import { useMemo } from 'react'
import { MediaImage } from '~/components/ui/media'
import { cn } from '~/lib/utils'
import { CarouselCardView } from './CarouselCard'
import { TrendingCardView } from './TrendingCard'

/**
 * Safely extracts the hostname from a URL string.
 * @param url The URL string.
 * @returns The hostname or null if the URL is invalid.
 */
function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname
  }
  catch {
    return null
  }
}

interface CardImageProps {
  imageUrl: string
  altText: string
  isLarge?: boolean
}

/**
 * 统一媒体三态（加载/错误/成功）已由 MediaImage 承担（app/components/ui/media.tsx）。
 */
function CardImage({ imageUrl, altText, isLarge = false }: CardImageProps) {
  return (
    <div
      className={cn(
        // 圆角/裁剪由外层 <a> 的 rounded-md + overflow-hidden 负责，
        // 此处若自带 rounded 会与外框半径不一致而露出直角。
        'relative overflow-hidden bg-muted/50',
        // 缩略图必须随卡片高度拉伸（self-stretch + 仅最小高度），否则固定的 h-20
        // 会在文本比 80px 高时于图片下方留出空白、与卡片底边错位。
        isLarge ? 'aspect-[1.91/1]' : 'w-20 min-h-20 flex-shrink-0 self-stretch',
      )}
    >
      <MediaImage
        src={imageUrl}
        alt={altText}
        className={cn(
          'h-full w-full object-cover',
          isLarge ? 'transition-transform duration-300 hover:scale-[1.02]' : '',
        )}
        loading="lazy"
      />
      {isLarge && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      )}
    </div>
  )
}

interface CardContentProps {
  domain: string | null
  title: string | null
  description: string | null
  compact?: boolean
}

/**
 * 截断交给 CSS line-clamp，完整文本由 title 属性承载（hover/读屏可获取全文）。
 */
function CardContent({ domain, title, description, compact = false }: CardContentProps) {
  return (
    <div className="space-y-2 p-3">
      {domain && (
        <div className="flex items-center gap-1.5 truncate font-medium text-muted-foreground/80 text-xs">
          {domain}
        </div>
      )}

      {title && (
        <h3
          title={title}
          className="line-clamp-2 font-semibold text-[1rem] text-foreground/90 leading-tight"
        >
          {title}
        </h3>
      )}

      {description && (
        <p
          className={cn(
            'text-muted-foreground/70 text-xs leading-relaxed',
            compact ? 'line-clamp-2' : 'line-clamp-3',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}

/**
 * 无图卡的占位媒体块（官方同款）。
 *
 * X 对声明了大图位却没有图片 binding 的卡片（如 youtu.be 的 App 卡）会在左侧渲染
 * 图标占位块，而不是塌成纯文字卡。
 */
function CardImagePlaceholder() {
  return (
    <div
      className="relative flex w-1/3 min-w-20 shrink-0 items-center justify-center self-stretch border-border/60 border-r bg-muted/50"
      aria-hidden
    >
      <ImageIcon className="size-5 text-muted-foreground/50" />
    </div>
  )
}

interface TweetLinkCardProps {
  tweet: EnrichedTweet
  className?: string
}

export function TweetLinkCard({ tweet, className }: TweetLinkCardProps) {
  const { card } = tweet

  const cardData = useMemo(() => {
    if (!card || (!card.title && !card.description && !card.imageUrl)) {
      return null
    }

    const hasImage = !!card.imageUrl
    const isLargeImageCard = hasImage && (
      card.type === 'unified_card'
      || card.type === 'summary_large_image'
    )

    const displayDomain = card.domain || (card.url
      ? getDomainFromUrl(card.url)
      : null)

    // 大图卡声明了媒体位却没有图片 → 官方渲染占位 icon 块（而非纯文字卡）
    const showsImagePlaceholder = !hasImage && card.type === 'summary_large_image'

    return {
      url: card.url,
      imageUrl: card.imageUrl,
      hasImage,
      showsImagePlaceholder,
      isLargeImageCard,
      domain: displayDomain,
      title: card.title ?? null,
      description: card.description ?? null,
    }
  }, [card])

  // 官方 Trending 卡片变体优先（有 jetfuel 结构化数据时渲染；解析失败/缺数据自然落普通卡路径）。
  if (card?.trending) {
    return <TrendingCardView trending={card.trending} className={className} />
  }

  // 官方媒体卡（image_website 单图 / image_carousel_* 多图 / video_website 视频）。
  if (
    (card?.layout === 'image_card'
      || card?.layout === 'image_carousel'
      || card?.layout === 'video_card')
    && card.images?.length
  ) {
    return <CarouselCardView card={card} className={className} />
  }

  // 无有效卡片数据：不渲染
  if (!cardData) {
    return null
  }

  const { url, imageUrl, hasImage, showsImagePlaceholder, isLargeImageCard, domain, title, description } = cardData

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        // overflow-hidden：把子元素裁剪到 rounded-md 圆角内，避免图片直角溢出边框。
        'mt-2 block overflow-hidden rounded-md border border-border/60',
        className,
      )}
    >
      {isLargeImageCard
        ? (
            <>
              <CardImage imageUrl={imageUrl!} altText={title || 'Link preview'} isLarge />
              <CardContent domain={domain} title={title} description={description} />
            </>
          )
        : hasImage
          ? (
              <div className="flex">
                <CardImage imageUrl={imageUrl!} altText={title || 'Link preview'} />
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <CardContent domain={domain} title={title} description={description} compact />
                </div>
              </div>
            )
          : showsImagePlaceholder
            ? (
                <div className="flex">
                  <CardImagePlaceholder />
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <CardContent domain={domain} title={title} description={description} compact />
                  </div>
                </div>
              )
            : (
                <CardContent domain={domain} title={title} description={description} />
              )}
    </a>
  )
}
