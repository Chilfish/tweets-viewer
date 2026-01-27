import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { writeJson } from '../src/utils'

const KEYS = (typeof process === 'undefined' ? '' : process.env.TWEET_KEYS || '')
  .split(',')
  .filter(Boolean)
export const twitterPool = new RettiwtPool(KEYS)

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

const id = '2016140320707334202'
const rawTweet = await apiClient.fetchTweetRaw(id)
const enrichedTweets = enrichmentService.enrichSingleTweet(rawTweet)

await writeJson(enrichedTweets, `tweet-${id}.json`)
