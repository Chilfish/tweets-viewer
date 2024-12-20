import type {
  Root as IUserDetailsResponse,
} from 'rettiwt-core/dist/types/user/Details'
import type {
  ItemContent as ITeetsItemContent,
  Root as ITweetsAndRepliesResponse,
} from 'rettiwt-core/dist/types/user/TweetsAndReplies'

import { EResourceType, FetcherService } from 'rettiwt-api'
import { filterTweet, filterUser } from './filter'
import { baseDir, cachedData, writeJson } from './utils'
import 'dotenv/config'

const { TWEET_KEY } = process.env
if (!TWEET_KEY) {
  throw new Error('TWEET_KEY is not set in .env')
}

const tweetApi = new FetcherService({ apiKey: TWEET_KEY })
const tmpDir = baseDir('tmp')

const username = process.argv[2] || 'elonmusk'
const isForce = process.argv.includes('--force')

async function fetchUser(username: string) {
  const { data } = await tweetApi.request<IUserDetailsResponse>(
    EResourceType.USER_DETAILS_BY_USERNAME,
    { id: username },
  )

  return data.user.result
}

async function fetchTweet(userId: string) {
  const { data } = await tweetApi.request<ITweetsAndRepliesResponse>(
    EResourceType.USER_TIMELINE_AND_REPLIES,
    { id: userId },
  )

  return (data.user.result as any)
    .timeline
    .timeline
    .instructions
    .filter((res: any) => res.type === 'TimelineAddEntries')
    .at(0)
    .entries
    .map((entry: any) => entry.content.itemContent) as ITeetsItemContent[]
}

function _filterTweet(data: ITeetsItemContent) {
  if (!data?.tweet_results) {
    return null
  }

  const tweet = data.tweet_results.result
  return filterTweet(tweet as any)
}

const userData = await cachedData(
  tmpDir(`fetch/user-${username}.json`),
  () => fetchUser(username),
  isForce,
)

const tweetsData = await cachedData(
  tmpDir(`fetch/tweets-${username}.json`),
  () => fetchTweet(userData.rest_id),
  isForce,
)

const user = filterUser(tweetsData[0].tweet_results.result as any)
await writeJson(tmpDir(`user-${username}.json`), user)

const tweets = tweetsData.map(_filterTweet).filter(Boolean)
await writeJson(tmpDir(`tweets-${username}.json`), tweets)
