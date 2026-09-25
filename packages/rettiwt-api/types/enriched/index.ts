import type { IRawTweetDetailsResponse, IRawUser } from '@tweets-viewer/rettiwt-api'
import type { LinkPreviewCard } from './card'
import type { Entity } from './entities'
import type { SpaceDetails } from './space'
import type { Tweet } from './tweet'

export type * from './card'
export type * from './entities'
export type * from './media'
export type * from './photo'
export type * from './space'
export type * from './user'
export type * from './video'

export type RawTweet = IRawTweetDetailsResponse['data']['tweetResult']['result']

export type RawUser = IRawUser

export type EnrichedUser = IRawUser & {
  userName?: string
  fullName?: string
  profileImage?: string
  profileBanner?: string
  description?: string
  createdAt?: string
  isVerified?: boolean
  url?: string
  birthdayString?: string
  followingsCount?: number
  followersCount?: number
  statusesCount?: number
  location?: { location?: string }
}

type OmitTypes = '__typename' | 'id_str' | 'entities' | 'quoted_tweet' | 'edit_control' | 'isEdited' | 'isStaleEdit' | 'possibly_sensitive' | 'news_action_type' | 'card'

export type EnrichedTweet = Omit<Tweet, OmitTypes> & {
  id: string
  url: string
  entities: Entity[]
  parent_id?: string
  in_reply_to_screen_name?: string
  quoted_tweet_id?: string
  quoted_tweet?: EnrichedTweet
  card?: LinkPreviewCard
  /** X Space（语音直播/录音回放）卡片数据；仅带 Space 卡或正文含 Space 链接的推文有 */
  space?: SpaceDetails
  retweeted_original_id?: string
  is_inline_media?: boolean
  reply_count?: number
  like_count?: number
  retweet_count?: number
  view_count?: number
  comments?: EnrichedTweet[]
}

export type TweetData = EnrichedTweet[]
