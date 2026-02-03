import type { ITweetFilter } from '@tweets-viewer/rettiwt-api'
import { apiClient, cursor, enrichmentService, writeCursor } from '../src/common'
import { writeJson } from '../src/utils'
import { userId } from './common'

const filter: ITweetFilter = {
  fromUsers: [userId],
  startDate: new Date('2022-05-01'),
  endDate: new Date('2023-07-14'),
}

const data = await apiClient.searchTweetsRaw(filter, cursor).catch((e) => {
  if (e.message.includes('429')) {
    console.error(`Rate limit exceeded`)
    process.exit(129)
  }

  return { tweets: [], cursor: '' }
})

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
