import type { LinkPreviewCard } from './card'
import type { Entity } from './entities'
import type { TweetPoll } from './poll'
import type { SpaceDetails } from './space'
import type { Tweet } from './tweet'

export type * from './card'
export type * from './entities'
export type * from './media'
export type * from './poll'
export type * from './space'
export type * from './tweet'
export type * from './user'

/**
 * 归档 `users.jsonData` 的契约。
 *
 * 只保留阅读端实际使用的 camelCase 字段；旧行里的原始字段会被忽略。
 */
export interface EnrichedUser {
  id: string
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
  likeCount?: number
  pinnedTweets?: string[]
  location?: { location?: string }
}

type OmitTypes = '__typename' | 'id_str' | 'entities' | 'quoted_tweet' | 'edit_control' | 'isEdited' | 'isStaleEdit' | 'possibly_sensitive' | 'news_action_type' | 'card'

/** 归档 `tweets.jsonData` 的契约（抓取脚本写入前会把 SDK 字段映射到这里）。 */
export type EnrichedTweet = Omit<Tweet, OmitTypes> & {
  id: string
  url: string
  entities: Entity[]
  parent_id?: string
  in_reply_to_screen_name?: string
  quoted_tweet_id?: string
  quoted_tweet?: EnrichedTweet
  card?: LinkPreviewCard
  /** 投票推文（X 把 poll 存在 card.binding_values 里） */
  poll?: TweetPoll
  /** X Space（语音直播/录音回放）卡片数据；仅带 Space 卡或正文含 Space 链接的推文有 */
  space?: SpaceDetails
  /**
   * 转推动作自身的推文 id（被转原推的 id 在 `id`），同时作为推文流的排序键。
   * 字段名沿用上游客服端契约，含义是「事件 id」而非「原推 id」。
   */
  retweeted_original_id?: string
  is_inline_media?: boolean
  reply_count?: number
  like_count?: number
  retweet_count?: number
  view_count?: number
  comments?: EnrichedTweet[]
}
