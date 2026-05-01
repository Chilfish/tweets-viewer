import type { LinkPreviewCard } from './card'
import type { Entity } from './entities'
import type { Tweet } from './tweet'
import type { IUser } from '@tweets-viewer/rettiwt-api'
import type { ITweetDetailsResponse } from '@tweets-viewer/rettiwt-api'

export type * from './card'
export type * from './entities'
export type * from './media'
export type * from './photo'
export type * from './user'
export type * from './video'

export type RawTweet = ITweetDetailsResponse['data']['tweetResult']['result']

export type RawUser = IUser

type OmitTypes = 'entities' | 'quoted_tweet' | 'edit_control' | 'isEdited' | 'isStaleEdit' | 'possibly_sensitive' | 'news_action_type' | 'card'

export type EnrichedTweet = Omit<Tweet, OmitTypes> & {
  url: string
  entities: Entity[]
  quoted_tweet_id?: string
  quoted_tweet?: EnrichedTweet
  card?: LinkPreviewCard
  retweeted_original_id?: string
  is_inline_meida?: boolean
  comments?: EnrichedTweet[]
}

export type TweetData = EnrichedTweet[]
