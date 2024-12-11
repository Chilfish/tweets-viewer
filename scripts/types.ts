export interface UserInfo {

  /**
   * display User name.
   */
  name: string
  /**
   * ID of the user.
   */
  screen_name: string
  avatar_url: string
}

export interface User extends UserInfo {
  profile_banner_url: string
  followers_count: number
  following_count: number
  bio: string
  location: string
  website: string
  birthday: Date
  created_at: Date
}

export interface Tweet {
  /**
   *  Tweet ID
   */
  id: string
  /**
   *  Tweet creation date.
   */
  created_at: Date
  /**
   *  Tweet text content.
   */
  full_text: string
  /**
   *  URLs of the media attached to the tweet.
   */
  media: {
    /**
     * media_url_https, ?name=large
     */
    url: string
    type: string
    height: number
    width: number
  }[]

  // Tweet metrics
  retweet_count: number
  quote_count: number
  reply_count: number
  favorite_count: number
  views_count: number

  /**
   * retweeted_status_result.result
   */
  retweeted_status: ReTweet | null

  /**
   * quoted_status_result.result
   */
  quoted_status: QuotedTweet | null
}

export interface ReTweet {
  user: UserInfo
  tweet: Tweet
}

export interface QuotedTweet {
  user: UserInfo
  /**
   * full_text: note_tweet.note_tweet_results.result.text
   */
  tweet: Tweet
}
