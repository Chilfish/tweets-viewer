import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { cn } from '~/lib/utils'
import { TweetNode } from './TweetNode'

interface MyTweetProps {
  tweet: EnrichedTweet
  containerClassName?: string
}

export function MyTweet({
  tweet,
  containerClassName,
}: MyTweetProps) {
  return (
    <TweetNode
      tweet={tweet}
      variant="main"
      hasParent={false}
      id={tweet.id}
      className={cn('tweet-loaded', containerClassName)}
    />
  )
}

MyTweet.displayName = 'MyTweet'
