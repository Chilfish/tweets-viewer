import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { cn } from '~/lib/utils'
import { TweetContainer } from '../react-tweet'
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
    <TweetContainer
      id={tweet.id_str}
      className={cn('tweet-loaded', containerClassName)}
    >
      <TweetNode
        tweet={tweet}
        variant="main"
        hasParent={false}
      />
    </TweetContainer>
  )
}

MyTweet.displayName = 'MyTweet'
