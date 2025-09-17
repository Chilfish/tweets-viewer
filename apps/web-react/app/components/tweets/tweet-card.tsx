import { formatDate } from '@tweets-viewer/shared'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2Icon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { useAppStore } from '~/stores/app-store'
import type { Tweet, TweetMedia, UserInfo } from '@tweets-viewer/shared'
import { MediaItemComponent } from '../media/media-item'
import { Link, TweetText } from './tweet-text'

interface TweetCardProps {
  tweet: Tweet
  user: UserInfo
  showMedia?: boolean
}

export function TweetCard({ tweet, user, showMedia = true }: TweetCardProps) {
  const { openMediaPreviewModal } = useAppStore()
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const handleMediaClick = (
    clickedMedia: TweetMedia,
    allMedia: TweetMedia[],
  ) => {
    const startIndex = allMedia.findIndex((m) => m.url === clickedMedia.url)
    openMediaPreviewModal({
      mediaItems: allMedia,
      startIndex: Math.max(0, startIndex),
    })
  }

  const renderMedia = (media: TweetMedia[]) => {
    if (!media.length || !showMedia) return null

    // 单张图片情况下，如果高比宽大于1，则限制最大宽度
    const ratio = media[0].height / media[0].width
    let maxWidthClass = ''
    if (media.length === 1 && ratio > 1) {
      maxWidthClass = 'max-h-120 max-w-100 max-h-140'
    }

    return (
      <div className='mt-3 rounded-md overflow-hidden w-fit'>
        {media.length === 1 ? (
          <MediaItemComponent
            item={media[0]}
            className={maxWidthClass}
            onClick={(item) => handleMediaClick(item as TweetMedia, media)}
          />
        ) : media.length === 2 ? (
          <div className='flex gap-0.5'>
            {media.map((item, index) => (
              <MediaItemComponent
                key={index}
                item={item}
                className='flex-1 w-36 h-36 sm:w-60 sm:h-60'
                onClick={(item) => handleMediaClick(item as TweetMedia, media)}
              />
            ))}
          </div>
        ) : media.length === 3 ? (
          <div className='flex gap-0.5 h-60 sm:h-90'>
            <MediaItemComponent
              item={media[0]}
              className='h-full flex-1 w-60'
              onClick={(item) => handleMediaClick(item as TweetMedia, media)}
            />
            <div className='flex flex-col gap-0.5 flex-1'>
              <MediaItemComponent
                item={media[1]}
                className='flex-1'
                onClick={(item) => handleMediaClick(item as TweetMedia, media)}
              />
              <MediaItemComponent
                item={media[2]}
                className='flex-1'
                onClick={(item) => handleMediaClick(item as TweetMedia, media)}
              />
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-0.5'>
            {media.slice(0, 4).map((item, index) => (
              <MediaItemComponent
                key={index}
                item={item}
                className='h-40 sm:h-60 w-full'
                onClick={(item) => handleMediaClick(item as TweetMedia, media)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderQuotedTweet = () => {
    if (!tweet.quotedStatus) return null
    const quotedUser = tweet.quotedStatus.user
    const quotedTweet = tweet.quotedStatus.tweet

    return (
      <Card
        id={quotedTweet.tweetId}
        className='mt-3 border border-border bg-card transition-colors duration-200 p-0'
      >
        <CardContent className='p-3'>
          <div className='flex items-center gap-2 relative'>
            <Avatar className='size-8 flex-shrink-0 '>
              <AvatarImage src={quotedUser.avatarUrl} />
              <AvatarFallback>{quotedUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className='flex justify-center min-w-0 gap-1'>
              <div className='font-semibold text-sm truncate text-card-foreground'>
                {quotedUser.name}
              </div>
              <div className='text-sm text-muted-foreground flex-shrink-0'>
                @{quotedUser.screenName}
              </div>
            </div>
          </div>

          <div className='text-sm text-muted-foreground flex-shrink-0 pl-10'>
            {formatDate(quotedTweet.createdAt)}
          </div>
          <TweetText text={quotedTweet.fullText} />
          {quotedTweet.media.length > 0 && renderMedia(quotedTweet.media)}
        </CardContent>
      </Card>
    )
  }

  const renderRetweetHeader = () => {
    if (!tweet.retweetedStatus) return null

    return (
      <div className='flex items-center gap-2 pl-2 mb-4 text-sm text-muted-foreground'>
        <Repeat2 className='size-4' />
        <Link
          url={`https://twitter.com/${user.screenName}/status/${tweet.tweetId}`}
          text={`@${user.name} 转推于 ${formatDate(tweet.createdAt)}`}
        />
      </div>
    )
  }

  const actualTweet = tweet.retweetedStatus?.tweet || tweet
  const actualUser = tweet.retweetedStatus?.user || user

  if (!actualTweet || !actualUser) return null

  return (
    <Card
      id={actualTweet.tweetId}
      className='border-border bg-card transition-colors duration-200 pb-2'
    >
      <CardContent className='px-3 sm:px-4'>
        {renderRetweetHeader()}

        <div className='flex gap-2'>
          <Avatar className='size-10 flex-shrink-0'>
            <AvatarImage src={actualUser.avatarUrl} />
            <AvatarFallback>{actualUser.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <div className='flex items-baseline min-w-0 gap-1'>
                <span className='font-semibold text-sm truncate text-card-foreground'>
                  {actualUser.name}
                </span>
                <span className='text-sm text-muted-foreground flex-shrink-0'>
                  @{actualUser.screenName}
                </span>
              </div>
            </div>

            <div className='text-sm text-muted-foreground flex-shrink-0'>
              {formatDate(actualTweet.createdAt)}
            </div>

            <TweetText text={actualTweet.fullText} />

            {actualTweet.media.length > 0 && renderMedia(actualTweet.media)}
            {renderQuotedTweet()}

            <div className='flex items-center justify-between mt-4 max-w-md text-muted-foreground'>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-1.5 hover:text-blue-500 p-1 transition-colors duration-200'
              >
                <MessageCircle className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.replyCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-1.5 hover:text-green-500 p-1 transition-colors duration-200'
              >
                <Repeat2 className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.retweetCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-1.5 hover:text-red-500 p-1 transition-colors duration-200'
              >
                <Heart className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.favoriteCount)}
                </span>
              </Button>

              <Button
                asChild
                variant='ghost'
                size='icon'
                className='h-auto p-1'
              >
                <Link
                  text={<Share2Icon className='size-4' />}
                  url={`https://twitter.com/${user.screenName}/status/${tweet.tweetId}`}
                  className='text-muted-foreground! hover:text-blue-500'
                />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
