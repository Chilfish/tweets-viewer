import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { memo } from 'react'
import { cn } from '~/lib/utils'
import { TweetNode } from './TweetNode'

interface MyTweetProps {
  tweet: EnrichedTweet
  tweetAuthorName: string
  containerClassName?: string
  hideMedia?: boolean // 新增：用于媒体预览模态框中隐藏媒体部分
}

export const MyTweet = memo(({
  tweet,
  tweetAuthorName,
  containerClassName,
  hideMedia = false,
}: MyTweetProps) => {
  return (
    <TweetNode
      tweet={tweet}
      variant="main"
      hasParent={false}
      id={tweet.retweeted_original_id || tweet.id}
      className={cn(
        'tweet-loaded min-h-[150px]',
        '[content-visibility:auto] [contain-intrinsic-size:auto_150px]',
        containerClassName,
      )}
      hideMedia={hideMedia}
      tweetAuthorName={tweetAuthorName}
    />
  )
})

MyTweet.displayName = 'MyTweet'
