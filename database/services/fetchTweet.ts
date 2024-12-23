import type {
  FetchArgs,
  FetcherService,
} from 'rettiwt-api'
import type {
  Root as IUserDetailsResponse,
} from 'rettiwt-core/dist/types/user/Details'
import type {
  ItemContent as ITeetsItemContent,
  Root as ITweetsAndRepliesResponse,
} from 'rettiwt-core/dist/types/user/TweetsAndReplies'
import type { Tweet, User } from '../../src/types'
import {
  CursoredData,
  EResourceType,
} from 'rettiwt-api'

import {
  filterTweet as _filterTweet,
  filterUser,
} from './filterTweet'

import 'dotenv/config'

async function fetchUser(
  tweetApi: FetcherService,
  username: string,
) {
  const { data } = await tweetApi.request<IUserDetailsResponse>(
    EResourceType.USER_DETAILS_BY_USERNAME,
    { id: username },
  )

  return data.user.result
}

async function _fetchTweet(
  tweetApi: FetcherService,
  fetchArgs: FetchArgs,
) {
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
    .map(({ content }: any) => {
      // Threads
      if ('items' in content) {
        return content.items.map(({ item }: any) => item?.itemContent)
      }
      // normal tweets
      return content.itemContent
    })
    .flat()
    .filter(Boolean)
    .filter((tweet: any) => tweet.itemType === 'TimelineTweet') as ITeetsItemContent[]

  return {
    tweets,
    cursor,
  }
}

async function fetchTweet(
  tweetApi: FetcherService,
  fetchArgs: FetchArgs & { endAt: Date },
) {
  const tweets: Tweet[] = []
  const user = {} as User
  let cursor: string | undefined
  let lastTweetId = ''

  while (true) {
    fetchArgs.cursor = cursor

    const {
      tweets: fetchedTweets,
      cursor: nextCursor,
    } = await _fetchTweet(tweetApi, fetchArgs)
      .catch((err) => {
        console.dir(err, { depth: 3 })
        return { tweets: [] as ITeetsItemContent[], cursor: '' }
      })

    const filteredTweets = fetchedTweets.map(filterTweet)

    if (!filteredTweets.length) {
      console.warn('No tweets found')
      break
    }

    if (filteredTweets.at(-1)?.id === lastTweetId) {
      console.warn('Duplicate tweet found')
      break
    }

    Object.assign(user, filterUser(fetchedTweets[0].tweet_results.result as any))

    tweets.push(
      ...filteredTweets
        .filter(tweet => tweet.createdAt.getTime() >= fetchArgs.endAt.getTime()),
    )

    const lastTweet = filteredTweets.at(-1)?.createdAt || new Date()

    // console.log({
    //   lastTweet,
    //   endAt: fetchArgs.endAt,
    //   fetchedTweets: fetchedTweets.length,
    //   cursor: nextCursor,
    // })

    // TODO: beacuse of rate-limt, maybe break at other condition
    if (lastTweet.getTime() <= fetchArgs.endAt.getTime()) {
      break
    }

    cursor = nextCursor
    lastTweetId = filteredTweets.at(-1)?.id || ''
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
  const tweet = data.tweet_results.result
  return _filterTweet(tweet as any)
}

export {
  fetchTweet,
  fetchUser,
}
