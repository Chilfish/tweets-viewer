import { writeJson } from '@tweets-viewer/shared/utils/files'
import insData from './data/ins-data.json'

interface InsData {
  id: string
  shortcode: string
  url: string
  author: {
    id: string
    username: string
    fullName: string
    avatarUrl: string
  }
  caption: string
  createdAt: string
  likeCount: number
  commentCount: number
  media: {
    type: 'image' | 'video'
    url: string
    width: number
    height: number
  }[]
}

interface TweetData {
  id: string
  tweetId: string
  userId: string
  createdAt: string
  fullText: string
  media: {
    url: string
    type: string
    height: number
    width: number
  }[]
  retweetCount: number
  quoteCount: number
  replyCount: number
  favoriteCount: number
  viewsCount: number
  retweetedStatus: null
  quotedStatus: null
}

function ins2Tweet(data: InsData): TweetData {
  const createdAt = new Date(data.createdAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai',
  })

  return {
    id: data.id,
    tweetId: data.shortcode,
    userId: data.author.username,
    createdAt,
    fullText: data.caption,
    media: data.media.map((media) => {
      const { type, url, width, height } = media
      const name = new URL(url).pathname.split('/').pop()
      const baseUrl = `https://static.localhost/tweet/img/ins/${data.author.username}/`
      return {
        url: baseUrl + name,
        type,
        width,
        height,
      }
    }),
    retweetCount: 0,
    quoteCount: 0,
    replyCount: data.commentCount,
    favoriteCount: data.likeCount,
    viewsCount: 0,
    retweetedStatus: null,
    quotedStatus: null,
  }
}

const data = (insData as any[]).map(ins2Tweet)

writeJson(`${data[0].userId}.json`, data)
