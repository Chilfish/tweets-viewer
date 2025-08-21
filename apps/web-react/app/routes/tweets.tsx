/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect } from 'react'
import { TopNav } from '~/components/top-nav'
import { TweetsList } from '~/components/tweets-list'
import { UserHeader } from '~/components/user-header'
import { useTweetsStore } from '~/stores/tweets-store'
import { useUserStore } from '~/stores/user-store'
import type { User } from '~/types'
import type { Route } from './+types/tweets'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Tweets` },
    { name: 'description', content: `See all tweets from @${name}` },
  ]
}

export default function TweetsPage({ params }: Route.ComponentProps) {
  const { getUser, users, isLoading: userLoading } = useUserStore()
  const { reset: resetTweets } = useTweetsStore()

  const user = users[params.name]

  useEffect(() => {
    // 重置推文状态当切换用户时
    resetTweets()

    // 获取用户数据
    getUser(params.name)
  }, [params.name, getUser, resetTweets])

  if (userLoading || !user) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-gray-500'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='min-h-svh bg-white'>
      <TopNav title={`@${user.screenName}`} showBack={true} />

      <div className='max-w-2xl mx-auto'>
        <UserHeader user={user} />

        {/* Tabs */}
        <div className='border-b border-gray-200 px-4'>
          <div className='flex'>
            <button className='px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600'>
              Tweets
            </button>
            <button className='px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700'>
              Replies
            </button>
            <button className='px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700'>
              Media
            </button>
            <button className='px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700'>
              Likes
            </button>
          </div>
        </div>

        <TweetsList user={user} />
      </div>
    </div>
  )
}
