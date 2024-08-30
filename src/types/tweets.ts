export interface TweetAction {
  retweet_count: number
  quote_count: number
  reply_count: number
  favorite_count: number
  views_count: number
}

export interface Tweet extends TweetAction {
  id: string
  created_at: string
  full_text: string
  media: string[]
  in_reply_to: string | null
  retweeted_status: string | null
  quoted_status: string | null
}

export interface User {
  name: string
  screen_name: string
  avatar_url: string
  profile_banner_url: string
  followers_count: number
  following_count: number
  bio: string
  location: string
  website: string
  birthday: string
  created_at: string
}
