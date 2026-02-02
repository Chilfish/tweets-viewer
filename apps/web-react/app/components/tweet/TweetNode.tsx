import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { Repeat2Icon } from 'lucide-react'
import { forwardRef, useMemo } from 'react'
import { cn, pubTime } from '~/lib/utils'
import { useMediaViewer } from '~/store/use-media-viewer'
import {
  formatDate,
  TweetAction,
  TweetBody,
  TweetContainer,
  TweetHeader,
  TweetInReplyTo,
  TweetMedia,
} from '../react-tweet'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'

export type TweetVariant = 'quoted' | 'main'

interface TweetNodeProps {
  id: string
  tweet: EnrichedTweet
  variant: TweetVariant
  tweetAuthorName: string
  hasParent?: boolean
  className?: string
  hideMedia?: boolean
}

function TweetMediaSection({ tweet, hideMedia }: { tweet: EnrichedTweet, hideMedia?: boolean }) {
  const openViewer = useMediaViewer(s => s.open)

  if (hideMedia || !(tweet.media_details || []).length)
    return null

  return (
    <TweetMedia
      tweet={tweet}
      onMediaClick={index => openViewer(tweet, index)}
    />
  )
}

export const TweetNode = forwardRef<HTMLDivElement, TweetNodeProps>(({
  id,
  tweet,
  variant,
  className,
  tweetAuthorName,
  hideMedia = false,
}, ref) => {
  const isQuoted = variant === 'quoted'
  const avatarSize = isQuoted ? 'small' : 'medium'

  // 样式映射表，替代混乱的 cn
  const styles = useMemo(() => ({
    container: cn('relative', {
      'p-3 rounded-2xl mt-2': isQuoted,
    }),
  }), [isQuoted, variant])

  const retweetedId = tweet.retweeted_original_id

  return (
    <TweetContainer
      ref={ref}
      id={id}
      className={cn(styles.container, className)}
    >
      {
        retweetedId && (
          <a
            className="pl-1 pb-2 flex text-sm items-center text-muted-foreground font-semibold hover:text-primary/80"
            href={`https://x.com/${tweet.user.screen_name}/status/${retweetedId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Repeat2Icon className="size-4 mr-1" />
            @
            {tweetAuthorName}
            {' '}
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
        <TweetInReplyTo tweet={tweet} />
        <TweetBody tweet={tweet} />

        <TweetMediaSection tweet={tweet} hideMedia={hideMedia} />

        <TweetMediaAlt tweet={tweet} />
        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {tweet.quoted_tweet && (
          <TweetNode
            tweet={tweet.quoted_tweet}
            variant="quoted"
            hasParent={false}
            id={tweet.quoted_tweet.id}
            tweetAuthorName={tweetAuthorName}
          />
        )}

        {!isQuoted && <TweetAction tweet={tweet} />}
      </div>
    </TweetContainer>
  )
})

TweetNode.displayName = 'TweetNode'
