import type { MediaDetails } from './media'
import type { TweetUser } from './user'

export interface TweetEditControl {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

/**
 * Base tweet information shared by a tweet, a parent tweet and a quoted tweet.
 */
export interface TweetBase {
  /** Language code of the tweet. E.g "en", "es". */
  lang: string
  /** Creation date of the tweet in the format ISO 8601. */
  created_at: string
  /** All the entities that are part of the tweet. */
  entities: unknown[]
  /** The unique identifier of the tweet. */
  id_str: string
  /** The tweet text, including the raw text from the entities. */
  text: string
  /** Information about the user who posted the tweet. */
  user: TweetUser
  /** Edit information about the tweet. */
  edit_control: TweetEditControl
  isEdited: boolean
  isStaleEdit: boolean
}

/**
 * A tweet as returned by the Twitter syndication API.
 */
export interface Tweet extends TweetBase {
  __typename: 'Tweet'
  media_details?: MediaDetails[]
  news_action_type: 'conversation'
  quoted_tweet?: QuotedTweet
  possibly_sensitive?: boolean
  card?: unknown
  in_reply_to_status_id_str?: string
}

/**
 * A tweet quoted by another tweet.
 */
export interface QuotedTweet extends TweetBase {
  reply_count: number
  retweet_count: number
  favorite_count: number
  media_details?: MediaDetails[]
  self_thread: {
    id_str: string
  }
}
