import type { FetchArgs } from 'rettiwt-api'
import type {
  Root as IUserDetailsResponse,
} from 'rettiwt-core/dist/types/user/Details'
import type {
  ItemContent as ITeetsItemContent,
  Root as ITweetsAndRepliesResponse,
} from 'rettiwt-core/dist/types/user/TweetsAndReplies'
import type { Tweet, User } from '../src/types'
import {
  CursoredData,
  EResourceType,
  FetcherService,
} from 'rettiwt-api'
import {
  filterTweet as _filterTweet,
  filterUser,
} from './filter'
import {
  baseDir,
  cachedData,
  writeJson,
} from './utils'
import 'dotenv/config'

const { TWEET_KEY } = process.env
if (!TWEET_KEY) {
  throw new Error('TWEET_KEY is not set in .env')
}

const tweetApi = new FetcherService({ apiKey: TWEET_KEY })

async function fetchUser(username: string) {
  const { data } = await tweetApi.request<IUserDetailsResponse>(
    EResourceType.USER_DETAILS_BY_USERNAME,
    { id: username },
  )

  return data.user.result
}

async function _fetchTweet(fetchArgs: FetchArgs) {
  const res = await tweetApi.request<ITweetsAndRepliesResponse>(
    EResourceType.USER_TIMELINE_AND_REPLIES,
    fetchArgs,
  )

  const cursor = new CursoredData(res, 'Tweet' as any).next.value

  const tweets = (res.data.user.result as any)
    .timeline
    .timeline
    .instructions
    .filter((res: any) => res.type === 'TimelineAddEntries')
    .at(0)
    .entries
    .map((entry: any) => entry.content.itemContent) as ITeetsItemContent[]

  return {
    tweets,
    cursor,
  }
}

async function fetchTweet(fetchArgs: FetchArgs & { endAt: Date }) {
  const tweets: Tweet[] = []
  const user = {} as User
  let cursor: string | undefined

  while (true) {
    fetchArgs.cursor = cursor
    const { tweets: fetchedTweets, cursor: nextCursor } = await _fetchTweet(fetchArgs)
      .catch((err) => {
        console.error('[fetch-tweets]', err.message, err.stack)
        return { tweets: [] as ITeetsItemContent[], cursor: '' }
      })

    if (!fetchedTweets.length) {
      break
    }

    Object.assign(user, filterUser(fetchedTweets[0].tweet_results.result as any))

    tweets.push(
      ...fetchedTweets
        .map(filterTweet)
        .filter((tweet): tweet is Tweet => !!tweet),
    )

    const lastTweet = tweets.at(-1)?.createdAt || new Date()

    console.log({
      lastTweet,
      endAt: fetchArgs.endAt,
      fetchedTweets: fetchedTweets.length,
      cursor: nextCursor,
    })

    if (lastTweet.getTime() < fetchArgs.endAt.getTime()) {
      break
    }

    cursor = nextCursor
  }

  user.tweetStart = tweets.at(-1)?.createdAt || new Date()
  user.tweetEnd = tweets.at(0)?.createdAt || new Date()

  return {
    tweets,
    user,
    cursor: cursor || '',
  }
}

function filterTweet(data: ITeetsItemContent) {
  if (!data?.tweet_results) {
    return null
  }

  const tweet = data.tweet_results.result
  return _filterTweet(tweet as any)
}

async function _localTest() {
  const username = process.argv[2] || 'elonmusk'
  const isForce = process.argv.includes('--force')
  const tmpDir = baseDir('tmp')

  const userData = await cachedData(
    tmpDir(`fetch/user-${username}.json`),
    () => fetchUser(username),
    isForce,
  )

  const { tweets, user } = await cachedData(
    tmpDir(`fetch/tweets-${username}.json`),
    () => fetchTweet({
      id: userData.rest_id,
      endAt: new Date('2024-11-21'),
    }),
    isForce,
  )

  await writeJson(tmpDir(`user-${username}.json`), user)

  console.log('Fetched', tweets.length, 'tweets')
  await writeJson(tmpDir(`tweets-${username}.json`), tweets)
}

// _localTest().catch(err => console.error(err.message, err.stack))

export {
  fetchTweet,
}
