import type { ITweetFilter } from '@tweets-viewer/rettiwt-api'
import { formatDate } from '@tweets-viewer/shared'
import { apiClient, enrichmentService } from '../src/common'
import { writeJson } from '../src/utils'

const filter: ITweetFilter = {
  fromUsers: ['BDP_yumemita'],
  includeWords: ['福岡公演'],
}

const allTweets: any[] = []
let currentCursor = ''
let page = 0

while (true) {
  page++
  console.log(`Fetching page ${page}${currentCursor ? ` (cursor: ${currentCursor.slice(0, 20)}...)` : ''}`)

  const data = await apiClient.searchTweetsRaw(filter, currentCursor).catch((e) => {
    if (e.message.includes('429')) {
      console.error(`Rate limit exceeded at page ${page}`)
      process.exit(129)
    }
    if (e.message.includes('status code 404')) {
      console.error(`No tweets found at page ${page}`)
      return { tweets: [], cursor: '' }
    }
    console.error({
      action: 'search-tweet',
      page,
      error: e.message,
    })

    return { tweets: [], cursor: '' }
  })

  if (!data.tweets.length) {
    console.log(`No more tweets at page ${page}, stopping.`)
    break
  }

  const enriched = enrichmentService.enrichTweets(data.tweets)
  allTweets.push(...enriched)

  console.log({
    action: 'search-tweet',
    page,
    tweetsThisPage: data.tweets.length,
    totalSoFar: allTweets.length,
    lastTweetDate: enriched.at(-1)?.created_at ? formatDate(enriched.at(-1)!.created_at) : 'N/A',
  })

  if (!data.cursor || !data.cursor.trim()) {
    console.log('No cursor returned, reached the end.')
    break
  }

  currentCursor = data.cursor
}

console.log(`\nDone! Total tweets: ${allTweets.length}`)

if (allTweets.length > 0) {
  await writeJson(
    { tweets: allTweets, total: allTweets.length },
    `data/BDP_yumemita/search-fukuoka-${Date.now()}.json`,
  )

  console.log({
    action: 'search-tweet-merged',
    total: allTweets.length,
    firstTweetDate: formatDate(allTweets[0]?.created_at ?? ''),
    lastTweetDate: formatDate(allTweets.at(-1)?.created_at ?? ''),
  })
}
else {
  console.log('No tweets to save.')
}
