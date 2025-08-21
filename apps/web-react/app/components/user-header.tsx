import { Calendar, LinkIcon, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import type { User } from '~/types'

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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className='relative'>
      {/* Banner */}
      <div className='h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative'>
        {user.profileBannerUrl && (
          <img
            src={user.profileBannerUrl}
            alt=''
            className='w-full h-full object-cover'
          />
        )}
      </div>

      {/* Profile Content */}
      <div className='px-4 pb-4'>
        {/* Avatar */}
        <div className='relative -mt-16 mb-4'>
          <Avatar className='size-32 border-4 border-white bg-white'>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className='text-2xl'>
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name and Username */}
        <div className='mb-3'>
          <h1 className='text-xl font-bold'>{user.name}</h1>
          <p className='text-gray-500'>@{user.screenName}</p>
        </div>

        {/* Bio */}
        {user.bio && <p className='text-sm leading-relaxed mb-3'>{user.bio}</p>}

        {/* Location, Website, Join Date */}
        <div className='flex flex-wrap gap-4 mb-3 text-sm text-gray-500'>
          {user.location && (
            <div className='flex items-center gap-1'>
              <MapPin className='size-4' />
              <span>{user.location}</span>
            </div>
          )}

          {user.website && (
            <div className='flex items-center gap-1'>
              <LinkIcon className='size-4' />
              <a
                href={user.website}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-500 hover:underline'
              >
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <div className='flex items-center gap-1'>
            <Calendar className='size-4' />
            <span>Joined {formatDate(user.createdAt)}</span>
          </div>
        </div>

        {/* Following and Followers */}
        <div className='flex gap-4 text-sm'>
          <div>
            <span className='font-semibold'>
              {formatCount(user.followingCount)}
            </span>
            <span className='text-gray-500 ml-1'>Following</span>
          </div>
          <div>
            <span className='font-semibold'>
              {formatCount(user.followersCount)}
            </span>
            <span className='text-gray-500 ml-1'>Followers</span>
          </div>
        </div>
      </div>
    </div>
  )
}
