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
import type { Tweet, TweetMedia, UserInfo } from '~/types'

interface TweetCardProps {
  tweet: Tweet
  user: UserInfo
}

export function TweetCard({ tweet, user }: TweetCardProps) {
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const renderMedia = (media: TweetMedia[]) => {
    if (!media.length) return null

    return (
      <div className='mt-3 rounded-2xl overflow-hidden'>
        {media.length === 1 ? (
          <img
            src={media[0].url}
            alt=''
            className='w-full max-h-96 object-cover'
            loading='lazy'
          />
        ) : (
          <div className='grid grid-cols-2 gap-0.5'>
            {media.slice(0, 4).map((item, index) => (
              <img
                key={index}
                src={item.url}
                alt=''
                className='w-full aspect-square object-cover'
                loading='lazy'
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
      <Card className='mt-3 border border-gray-200'>
        <CardContent className='p-3'>
          <div className='flex items-center gap-2 mb-2'>
            <Avatar className='size-5'>
              <AvatarImage src={tweet.quotedStatus.user.avatarUrl} />
              <AvatarFallback>
                {tweet.quotedStatus.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className='text-sm font-semibold'>
              {tweet.quotedStatus.user.name}
            </span>
            <span className='text-sm text-gray-500'>
              @{tweet.quotedStatus.user.screenName}
            </span>
          </div>
          <p className='text-sm'>{tweet.quotedStatus.tweet.fullText}</p>
          {tweet.quotedStatus.tweet.media.length > 0 &&
            renderMedia(tweet.quotedStatus.tweet.media)}
        </CardContent>
      </Card>
    )
  }

  const renderRetweetHeader = () => {
    if (!tweet.retweetedStatus) return null

    return (
      <div className='flex items-center gap-2 mb-2 text-gray-500 text-sm'>
        <Repeat2 className='size-4' />
        <span>{user.name} retweeted</span>
      </div>
    )
  }

  const actualTweet = tweet.retweetedStatus?.tweet || tweet
  const actualUser = tweet.retweetedStatus?.user || user

  return (
    <Card className='border-0 border-b border-gray-200 rounded-none p-4'>
      <CardContent className='p-0'>
        {renderRetweetHeader()}

        <div className='flex gap-3'>
          <Avatar className='size-10 flex-shrink-0'>
            <AvatarImage src={actualUser.avatarUrl} />
            <AvatarFallback>{actualUser.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-1 mb-1'>
              <span className='font-semibold text-sm truncate'>
                {actualUser.name}
              </span>
              <span className='text-gray-500 text-sm'>
                @{actualUser.screenName}
              </span>
              <span className='text-gray-500 text-sm'>·</span>
              <span className='text-gray-500 text-sm'>
                {formatDistanceToNow(new Date(actualTweet.createdAt), {
                  addSuffix: false,
                })}
              </span>
              <Button variant='ghost' size='icon' className='size-5 ml-auto'>
                <MoreHorizontal className='size-4' />
              </Button>
            </div>

            <div className='text-sm leading-relaxed mb-3'>
              {actualTweet.fullText}
            </div>

            {actualTweet.media.length > 0 && renderMedia(actualTweet.media)}
            {renderQuotedTweet()}

            <div className='flex items-center justify-between mt-3 max-w-md'>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-500 hover:text-blue-500 p-0'
              >
                <MessageCircle className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.replyCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-500 hover:text-green-500 p-0'
              >
                <Repeat2 className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.retweetCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-500 hover:text-red-500 p-0'
              >
                <Heart className='size-4' />
                <span className='text-xs'>
                  {formatCount(actualTweet.favoriteCount)}
                </span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-500 hover:text-blue-500 p-0'
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
