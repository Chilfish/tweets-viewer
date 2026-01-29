import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'

export interface FlatMediaItem {
  id: string // 组合ID: tweetId + mediaIndex
  tweetId: string
  mediaIndex: number // 当前媒体在推文中的索引
  url: string
  type: 'photo' | 'video' | 'animated_gif'
  width: number
  height: number
  aspectRatio: number
  videoInfo?: any
  createdAt: string
  tweet: EnrichedTweet // 保留原始推文引用，用于点击查看详情
}

export function extractMediaFromTweets(tweets: EnrichedTweet[]): FlatMediaItem[] {
  const flatMedia: FlatMediaItem[] = []
  const seenUrls = new Set<string>()

  tweets.forEach((tweet) => {
    // 排除转推的内容
    if (tweet.retweeted_original_id) {
      return
    }

    if (tweet.media_details && tweet.media_details.length > 0) {
      tweet.media_details.forEach((media, index) => {
        const url = media.media_url_https

        if (seenUrls.has(url)) {
          return
        }
        seenUrls.add(url)

        const w = media.original_info?.width || 1000
        const h = media.original_info?.height || 1000
        const aspectRatio = h / w

        flatMedia.push({
          id: `${tweet.id}-${index}`,
          tweetId: tweet.id,
          mediaIndex: index,
          url,
          type: media.type,
          width: w,
          height: h,
          aspectRatio,
          videoInfo: (media as any).video_info,
          createdAt: tweet.created_at,
          tweet,
        })
      })
    }
  })

  return flatMedia
}
