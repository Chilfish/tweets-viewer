import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { getLocalCache } from '../src/localCache'
import { writeJson } from '../src/utils'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean)

const twitterPool = new RettiwtPool(KEYS)

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

apiClient.onFetchedresponse = async (key: string, data: any) => {
  console.log(`Fetched ${key} data`)
  // await writeJson(data, `${key}.json`)
}

const tweetId = '2016140320707334202'
const userId = '240y_k'

const user = await getLocalCache({
  type: 'user',
  id: userId,
  getter: () => apiClient.fetchUserDetailsRaw(userId),
})

if (!user?.id) {
  console.error('User not found')
  process.exit(1)
}

const rawTweets = await getLocalCache({
  type: 'timeline',
  id: user.id,
  getter: () => apiClient.fetchUserTimelineWithRepliesRaw(user.id),
})

const enrichedTweets = enrichmentService.enrichUserTimelineTweets(rawTweets, user.id)

await writeJson(enrichedTweets, `timeline-${user.userName}.json`)
