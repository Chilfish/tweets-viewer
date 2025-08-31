import { formatDistanceToNow } from 'date-fns'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { useAppStore } from '~/stores/app-store'
import type { Tweet, TweetMedia, UserInfo } from '~/types'
import { MediaItemComponent } from '../media/media-item'

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
          <div className='flex gap-0.5 h-90'>
            {media.map((item, index) => (
              <MediaItemComponent
                key={index}
                item={item}
                className='flex-1'
                onClick={(item) => handleMediaClick(item as TweetMedia, media)}
              />
            ))}
          </div>
        ) : media.length === 3 ? (
          <div className='flex gap-0.5 h-90'>
            <MediaItemComponent
              item={media[0]}
              className='h-full flex-1'
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
                className='h-60'
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

    return (
      <Card
        id={tweet.quotedStatus.tweet.tweetId}
        className='mt-3 border border-border bg-card transition-colors duration-200'
      >
        <CardContent className='p-3'>
          <div className='flex items-center gap-2 mb-2'>
            <Avatar className='size-5'>
              <AvatarImage src={tweet.quotedStatus.user.avatarUrl} />
              <AvatarFallback>
                {tweet.quotedStatus.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className='text-sm font-semibold text-card-foreground'>
              {tweet.quotedStatus.user.name}
            </span>
            <span className='text-sm text-muted-foreground'>
              @{tweet.quotedStatus.user.screenName}
            </span>
          </div>
          <p className='text-sm text-card-foreground'>
            {tweet.quotedStatus.tweet.fullText}
          </p>
          {tweet.quotedStatus.tweet.media.length > 0 &&
            renderMedia(tweet.quotedStatus.tweet.media)}
        </CardContent>
      </Card>
    )
  }

  const renderRetweetHeader = () => {
    if (!tweet.retweetedStatus) return null

    return (
      <div className='flex items-center gap-2 mb-2 text-sm text-muted-foreground'>
        <Repeat2 className='size-4' />
        <span>@{user.screenName} retweeted</span>
      </div>
    )
  }

  const actualTweet = tweet.retweetedStatus?.tweet || tweet
  const actualUser = tweet.retweetedStatus?.user || user

  if (!actualTweet || !actualUser) return null

  return (
    <Card
      id={actualTweet.tweetId}
      className='border-0 border-b border-border rounded-none p-4 bg-card transition-colors duration-200'
    >
      <CardContent className='p-0'>
        {renderRetweetHeader()}

        <div className='flex gap-3'>
          <Avatar className='size-10 flex-shrink-0'>
            <AvatarImage src={actualUser.avatarUrl} />
            <AvatarFallback>{actualUser.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-1 mb-1'>
              <span className='font-semibold text-sm truncate text-card-foreground'>
                {actualUser.name}
              </span>
              <span className='text-sm text-muted-foreground'>
                @{actualUser.screenName}
              </span>
              <span className='text-sm text-muted-foreground'>·</span>
              <span className='text-sm text-muted-foreground'>
                {formatDistanceToNow(new Date(actualTweet.createdAt), {
                  addSuffix: false,
                })}
              </span>
              <Button
                variant='ghost'
                size='icon'
                className='size-5 ml-auto text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200'
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </div>

            <div className='text-sm leading-relaxed mb-3 text-card-foreground'>
              {actualTweet.fullText}
            </div>

            {actualTweet.media.length > 0 && renderMedia(actualTweet.media)}
            {renderQuotedTweet()}

            <div className='flex items-center justify-between mt-3 max-w-md'>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-muted-foreground hover:text-blue-500 p-0 transition-colors duration-200'
              >
                <MessageCircle className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.replyCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-muted-foreground hover:text-green-500 p-0 transition-colors duration-200'
              >
                <Repeat2 className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.retweetCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-muted-foreground hover:text-red-500 p-0 transition-colors duration-200'
              >
                <Heart className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.favoriteCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-muted-foreground hover:text-blue-500 p-0 transition-colors duration-200'
              >
                <Share className='size-4' />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
