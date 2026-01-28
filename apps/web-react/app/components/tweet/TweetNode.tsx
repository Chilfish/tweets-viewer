import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { Repeat2Icon } from 'lucide-react'
import { forwardRef, useMemo } from 'react'
import { cn, pubTime } from '~/lib/utils'
import { formatDate, TweetBody, TweetHeader, TweetMedia } from '../react-tweet'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'

export type TweetVariant = 'quoted' | 'main'

interface TweetNodeProps {
  tweet: EnrichedTweet
  variant: TweetVariant
  hasParent?: boolean
}

function TweetMediaSection({ tweet }: { tweet: EnrichedTweet }) {
  if (!(tweet.mediaDetails || []).length)
    return null

  return (
    <TweetMedia
      tweet={tweet}
    />
  )
}

export const TweetNode = forwardRef<HTMLDivElement, TweetNodeProps>(({
  tweet,
  variant,
}, ref) => {
  const isQuoted = variant === 'quoted'
  const avatarSize = isQuoted ? 'small' : 'medium'

  // 样式映射表，替代混乱的 cn
  const styles = useMemo(() => ({
    container: cn('relative', {
      'p-3 border-2 rounded-2xl mt-2': isQuoted,
    }),
  }), [isQuoted, variant])

  const retweetedId = tweet.retweetedOrignalId

  return (
    <div ref={ref} className={styles.container}>
      {
        retweetedId && (
          <a
            className="pl-1 pb-2 flex items-center text-muted-foreground font-semibold hover:text-primary/80"
            href={`https://x.com/${tweet.user.screen_name}/status/${retweetedId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Repeat2Icon className="size-4 mr-1" />
            转推于
            {' '}
            {formatDate(pubTime(retweetedId))}
          </a>
        )
      }

      <TweetHeader
        tweet={tweet}
        createdAtInline
        avatarSize={avatarSize}
      />

      <div>
        <TweetBody tweet={tweet} />

        <TweetMediaSection tweet={tweet} />

        <TweetMediaAlt tweet={tweet} />
        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {tweet.quotedTweet && (
          <TweetNode
            tweet={tweet.quotedTweet}
            variant="quoted"
            hasParent={false}
          />
        )}
      </div>
    </div>
  )
})

TweetNode.displayName = 'TweetNode'
