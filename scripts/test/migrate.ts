import path from 'node:path'
import type { Tweet } from '@/types'
import glob from 'fast-glob'
import { dataFolder } from '../'
import { readJson, writeJson } from '../utils'

function toTweet(data: any, uid: string): Tweet | null {
  if (data.retweeted_status) {
    return null
  }

  return {
    id: data.id,
    tweetId: data.id,
    userId: uid,
    fullText: data.full_text,
    createdAt: new Date(data.created_at),
    media: data.media.map((url: string) => ({
      url,
      type: url.includes('video') ? 'video' : 'photo',
      width: 0,
      height: 0,
    })),
    quoteCount: data.quote_count,
    replyCount: data.reply_count,
    viewsCount: data.views_count,
    retweetCount: data.retweet_count,
    favoriteCount: data.favorite_count,

    retweetedStatus: null,
    quotedStatus: null,
  }
}

const files = await glob('D:/Codes/static/tweet/data-*.json')

for (const file of files) {
  const filename = path.basename(file)
  const screenName = filename.replace('data-', '').replace('.json', '')
  const data = await readJson(file, [])
  const tweets = data
    .map((tweet) => toTweet(tweet, screenName))
    .filter(Boolean) as Tweet[]

  await writeJson(
    `${dataFolder}/${screenName}/${filename.replace('data-', 'data-old-')}`,
    tweets,
  )
}
