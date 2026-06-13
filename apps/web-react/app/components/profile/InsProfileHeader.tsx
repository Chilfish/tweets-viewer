import type { IGUserInfo } from '@tweets-viewer/shared'
import { ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { RichText } from '../RichText'
import { InsProfileHeaderSkeleton } from '../skeletons/ins-profile'

interface InsProfileHeaderProps {
  user: IGUserInfo | null
  children?: React.ReactNode
}

export function InsProfileHeader({ user, children }: InsProfileHeaderProps) {
  if (!user) {
    return <InsProfileHeaderSkeleton />
  }

  return (
    <div className="tweet-container p-0 rounded w-full bg-card border-2 border-border/50 overflow-hidden min-h-fit">
      <div className="px-4 sm:px-5 py-5 sm:py-6">
        {/* Top row: Avatar + Stats */}
        <div className="flex items-start gap-4 sm:gap-6 mb-4">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-border/40 shrink-0">
            <AvatarImage
              src={user.avatar_url}
              alt={user.fullname}
              className="object-cover"
            />
            <AvatarFallback className="text-xl font-bold bg-muted">
              {(user.fullname ?? '').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-1">
            {/* Identity */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-7 truncate">
                {user.fullname}
              </h2>
              {user.verified && (
                <svg
                  viewBox="0 0 24 24"
                  aria-label="认证账号"
                  className="w-[18px] h-[18px] fill-sky-500 shrink-0"
                >
                  <g>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </g>
                </svg>
              )}
            </div>
            <p className="text-[15px] text-muted-foreground truncate mt-0.5">
              @
              {user.username}
            </p>

            {/* Stats */}
            <div className="flex gap-5 sm:gap-6 mt-3 text-sm">
              <div className="flex gap-1">
                <span className="font-bold text-foreground">
                  {(user.posts_count ?? 0).toLocaleString()}
                </span>
                <span className="text-muted-foreground">帖子</span>
              </div>
              <div className="flex gap-1">
                <span className="font-bold text-foreground">
                  {(user.followers_count ?? 0).toLocaleString()}
                </span>
                <span className="text-muted-foreground">粉丝</span>
              </div>
              <div className="flex gap-1">
                <span className="font-bold text-foreground">
                  {(user.following_count ?? 0).toLocaleString()}
                </span>
                <span className="text-muted-foreground">关注</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <RichText
            text={user.bio}
            className="text-[15px] leading-relaxed"
          />
        )}

        {/* External URL */}
        {user.external_url && (
          <div className="flex items-center gap-1 mt-2">
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={user.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-primary hover:text-primary/80 truncate"
            >
              {user.external_url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
