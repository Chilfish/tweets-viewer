import type { ITweetFilter } from '@tweets-viewer/rettiwt-api'
import { userId } from '../config'
import { apiClient, cursor, enrichmentService, writeCursor } from '../src/common'
import { writeJson } from '../src/utils'

const filter: ITweetFilter = {
  fromUsers: [userId],
  startDate: new Date('2023-01-01'),
  endDate: new Date('2023-01-15'),
}

const data = await apiClient.searchTweetsRaw(filter, cursor)
if (!data.tweets.length) {
  console.error('No tweets found')
  process.exit(104)
}

const enrichedTweets = enrichmentService.enrichTweets(data.tweets)

await writeJson({
  tweets: enrichedTweets,
  cursor: data.cursor,
}, `data/${userId}/search-${Date.now()}.json`)

await writeCursor(data)
