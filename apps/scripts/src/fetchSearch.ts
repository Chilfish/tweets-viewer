import type { ITweetFilter } from '@tweets-viewer/rettiwt-api'
import { attachSpaceDetails } from '@chilfish/tweet'
import { formatDate } from '@tweets-viewer/shared'
import { apiClient, cursor, enrichmentService, userId, writeCursor } from './common'
import { toArchivedTweets } from './lib/tweet'
import { writeJson } from './utils'

const filter: ITweetFilter = {
  fromUsers: [userId],
  // startDate: new Date('2020-01-01'),
  endDate: new Date('2023-11-21'),
}

const data = await apiClient.searchTweetsRaw(filter, cursor).catch((e) => {
  if (e.message.includes('429')) {
    console.error(`Rate limit exceeded`)
    process.exit(129)
  }
  if (e.message.includes('status code 404')) {
    console.error('No tweets found')
    process.exit(104)
  }
  console.error({
    action: 'search-tweet',
    error: e.message,
  })

  return { tweets: [], cursor: '' }
})

if (!data.tweets.length) {
  console.error('No tweets found')
  process.exit(104)
}

const enrichedTweets = enrichmentService.enrichTweets(data.tweets)

await attachSpaceDetails(enrichedTweets, data.tweets, id => apiClient.fetchSpaceDetails(id))

await writeJson({
  tweets: toArchivedTweets(enrichedTweets),
  cursor: data.cursor,
}, `data/${userId}/search-${Date.now()}.json`)

await writeCursor(data)

console.log({
  action: 'search-tweet',
  lastTweetDate: formatDate(enrichedTweets.at(-1)?.created_at ?? ''),
})
