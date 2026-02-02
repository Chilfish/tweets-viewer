import { writeFile } from 'node:fs/promises'
import { apiClient, cursor, cursorPath, enrichmentService, user, userId } from './common'
import { writeJson } from './utils'

const rawTweets = await apiClient.fetchUserTimelineWithRepliesRaw(user.id, cursor)
if (!rawTweets.tweets.length) {
  console.error('No tweets found')
  process.exit(104)
}

const enrichedTweets = enrichmentService.enrichUserTimelineTweets(rawTweets.tweets, user.id)

await writeJson({
  tweets: enrichedTweets,
  cursor: rawTweets.cursor,
}, `data/${userId}/timeline-${user.userName}-${Date.now()}.json`)

if (rawTweets.cursor) {
  await writeFile(cursorPath, rawTweets.cursor, 'utf8')
  console.log(`Cursor saved: ${rawTweets.cursor}`)
}
