import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { cn } from '~/lib/utils'
import { TweetNode } from './TweetNode'

interface MyTweetProps {
  tweet: EnrichedTweet
  containerClassName?: string
  hideMedia?: boolean // 新增：用于媒体预览模态框中隐藏媒体部分
}

export function MyTweet({
  tweet,
  containerClassName,
  hideMedia = false,
}: MyTweetProps) {
  return (
    <TweetNode
      tweet={tweet}
      variant="main"
      hasParent={false}
      id={tweet.id}
      className={cn('tweet-loaded', containerClassName)}
      hideMedia={hideMedia}
    />
  )
}

MyTweet.displayName = 'MyTweet'
