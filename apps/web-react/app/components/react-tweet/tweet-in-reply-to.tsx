import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { cn } from '~/lib/utils'

interface TweetInReplyToProps {
  tweet: EnrichedTweet
  className?: string
}

export function TweetInReplyTo({ tweet, className }: TweetInReplyToProps) {
  const { in_reply_to_screen_name: screenName } = tweet

  if (!screenName)
    return null

  return (
    <div className={cn('text-[#536471] dark:text-[#71767b] text-[0.93rem] mb-1 leading-5', className)}>
      回复
      {' '}
      <a
        href={`https://x.com/${screenName}`}
        className="text-primary no-underline hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        @
        {screenName}
      </a>
    </div>
  )
}
