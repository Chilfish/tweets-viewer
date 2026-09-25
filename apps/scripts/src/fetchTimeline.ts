import { writeFile } from 'node:fs/promises'
import { attachSpaceDetails } from '@tweets-viewer/rettiwt-api'
import { apiClient, cursor, cursorPath, enrichmentService, user, userId } from './common'
import { writeJson } from './utils'

const rawTweets = await apiClient.fetchUserTimelineWithRepliesRaw(user.id, cursor)
if (!rawTweets.tweets.length) {
  console.error('No tweets found')
  process.exit(104)
}

const enrichedTweets = enrichmentService.enrichUserTimelineTweets(rawTweets.tweets, user.id)

// Space 推文的外壳 card 拿不到标题/主播/人数，需再打一次 AudioSpaceById 挂到 space 字段
await attachSpaceDetails(enrichedTweets, rawTweets.tweets, id => apiClient.fetchSpaceDetails(id))

await writeJson({
  tweets: enrichedTweets,
  cursor: rawTweets.cursor,
}, `data/${userId}/timeline-${user.userName}-${Date.now()}.json`)

if (rawTweets.cursor) {
  await writeFile(cursorPath, rawTweets.cursor, 'utf8')
  console.log(`Cursor saved: ${rawTweets.cursor}`)
}
