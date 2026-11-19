import type { TrendingCardInfo } from '@tweets-viewer/tweet-types'
import { Avatar, AvatarImage } from '~/components/ui/avatar'
import { MediaImage } from '~/components/ui/media'
import { cn } from '~/lib/utils'

/**
 * Trending 卡片变体 —— 还原官方 X Trending 卡片渲染结构。
 *
 * aspect 18:10 大图 + 底部覆盖层：meta 行 → 标题(line-clamp-3) → 头像组+posts →
 * 描述(line-clamp-2)。主图 alt=""（装饰图，标题 h3 已承载可访问名称）。
 */
export function TrendingCardView({
  trending,
  className,
}: {
  trending: TrendingCardInfo
  className?: string
}) {
  return (
    <a
      href={trending.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mt-2 block overflow-hidden rounded-md border border-border/60',
        className,
      )}
    >
      <div className="relative aspect-[18/10] bg-muted/50">
        <MediaImage
          src={trending.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
        {/* 底部渐变遮罩，保证文字可读 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3 text-white">
          {/* meta 行：分类，官方以 • 分隔 */}
          {(trending.categories.length > 0 || trending.postsCount) && (
            <div className="flex items-center gap-1 font-medium text-white/80 text-xs">
              {trending.categories.map((cat, i) => (
                <span key={`${i}-${cat}`} className="inline-flex items-center gap-1">
                  {i > 0 && <span>•</span>}
                  <span>{cat}</span>
                </span>
              ))}
            </div>
          )}

          <h3 className="line-clamp-3 font-semibold text-sm text-white leading-tight drop-shadow-sm">
            {trending.title}
          </h3>

          {(trending.avatars.length > 0 || trending.postsCount) && (
            <div className="flex items-center gap-1.5 text-white/85 text-xs">
              {trending.avatars.length > 0 && (
                <span className="flex -space-x-1.5">
                  {trending.avatars.slice(0, 3).map(avatar => (
                    <Avatar key={avatar} className="size-5 border border-white/50">
                      <AvatarImage src={avatar} alt="" />
                    </Avatar>
                  ))}
                </span>
              )}
              {trending.postsCount && (
                <span>
                  {' '}
                  •
                  {' '}
                  {trending.postsCount}
                </span>
              )}
            </div>
          )}

          {trending.description && (
            <p className="line-clamp-2 text-white/90 text-xs leading-relaxed">
              {trending.description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}
