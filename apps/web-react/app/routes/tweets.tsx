import { useEffect } from 'react'
import { TweetsList } from '~/components/tweets/tweets-list'
import { UserHeader } from '~/components/user-header'
import { useTweetsStore } from '~/stores/tweets-store'
import { useUserStore } from '~/stores/user-store'
import type { Route } from './+types/tweets'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Tweets` },
    { name: 'description', content: `See all tweets from @${name}` },
  ]
}

export default function TweetsPage({ params }: Route.ComponentProps) {
  const { isLoading: userLoading, curUser } = useUserStore()
  const { data, loadTweets } = useTweetsStore()

  useEffect(() => {
    if (curUser?.screenName) loadTweets(curUser.screenName)
  }, [curUser, loadTweets])

  if (userLoading || !curUser) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='min-h-svh bg-background transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        <UserHeader user={curUser} />

        {/* Tabs */}
        <div className='border-b border-border px-4 transition-colors duration-200'>
          <div className='flex'>
            <div className='px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary'>
              Tweets
            </div>
            <div className='px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200'>
              Media
            </div>
          </div>
        </div>

        <TweetsList user={curUser} tweets={data} />
      </div>
    </div>
  )
}
