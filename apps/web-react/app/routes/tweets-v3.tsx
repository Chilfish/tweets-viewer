import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/tweets-v3'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import useSWR from 'swr/immutable'
import { MyTweet } from '~/components/tweet/Tweet'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Tweets` },
    { name: 'description', content: `See all tweets from @${name}` },
  ]
}

async function getTweets() {
  const { data } = await axios.get<EnrichedTweet[]>(`${apiUrl}/tweets/get/ttisrn_0710`)
  return data
}

export default function TweetsPage({ params }: Route.ComponentProps) {
  const { data: tweets, isLoading } = useSWR(
    [params.name, 'tweets'],
    () => getTweets(),
  )

  if (!tweets || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-svh py-2 bg-background transition-colors duration-200">
      <main
        className="flex flex-col items-center justify-center gap-2"
      >

        {tweets.map(tweet => (
          <MyTweet tweet={tweet} key={tweet.id_str} />
        ))}
      </main>
    </div>
  )
}
