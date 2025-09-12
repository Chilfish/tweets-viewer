import { Calendar, LinkIcon, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import type { User } from '~/types'
import { UserTabs } from './layout/user-tabs'
import { TweetText } from './tweets/tweet-text'

interface UserHeaderProps {
  user: User
}

export function UserHeader({ user }: UserHeaderProps) {
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
    })
  }

  return (
    <>
      {/* Banner */}
      <div className='h-48 bg-muted relative'>
        {user.profileBannerUrl && (
          <img
            src={user.profileBannerUrl}
            alt=''
            className='w-full h-full object-cover'
          />
        )}
      </div>

      {/* Profile Content */}
      <div className='p-4 pb-0 flex flex-col gap-2 justify-between'>
        <div className='flex justify-between items-end -mt-16 mb-4'>
          <Avatar className='size-26 border-4 border-background bg-background'>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className='text-2xl'>
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className=''>
          <h1 className='text-2xl font-bold text-foreground'>{user.name}</h1>
          <p className='text-muted-foreground'>@{user.screenName}</p>
        </div>

        {user.bio && <TweetText text={user.bio} />}

        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-muted-foreground'>
          {user.location && (
            <div className='flex items-center gap-1.5'>
              <MapPin className='size-4' />
              <span>{user.location}</span>
            </div>
          )}

          {user.website && (
            <div className='flex items-center gap-1.5'>
              <LinkIcon className='size-4' />
              <a
                href={user.website}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary wrap-anywhere hover:underline'
              >
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <div className='flex items-center gap-1.5'>
            <Calendar className='size-4' />
            <span>加入于 {formatDate(user.createdAt)}</span>
          </div>
        </div>

        <div className='flex gap-6 text-sm'>
          <div>
            <span className='font-bold text-foreground'>
              {formatCount(user.followingCount)}
            </span>
            <span className='text-muted-foreground ml-1'>关注</span>
          </div>
          <div>
            <span className='font-bold text-foreground'>
              {formatCount(user.followersCount)}
            </span>
            <span className='text-muted-foreground ml-1'>粉丝</span>
          </div>
        </div>
      </div>

      {/* INTEGRATED TABS */}
      <UserTabs user={user} />
    </>
  )
}
