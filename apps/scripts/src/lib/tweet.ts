import type {
  EnrichedTweet as SdkEnrichedTweet,
  SpaceDetails as SdkSpaceDetails,
  TweetUser as SdkTweetUser,
} from '@chilfish/tweet'
import type {
  EnrichedTweet,
  SpaceDetails,
  TweetUser,
} from '@tweets-viewer/rettiwt-api'

/**
 * Twitter 抓取运行时使用上游 `@chilfish/tweet`（camelCase）；归档 JSON 仍是本仓库的
 * snake_case 契约。所有字段映射集中在这里，DB / server / web-react 不感知上游命名。
 */

/** 读取并校验 `TWEET_KEYS`：空列表会让 SDK 静默退化为 guest，必须在入口失败。 */
export function readTweetKeys(raw = process.env.TWEET_KEYS): string[] {
  const keys = (raw ?? '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)

  if (keys.length === 0)
    throw new Error('TWEET_KEYS is empty: at least one Twitter API key is required')

  return keys
}

function toArchivedUser(user: SdkTweetUser): TweetUser {
  const { id, ...rest } = user
  return { ...rest, id_str: id }
}

/** 归档 `TweetUser` → SDK `TweetUser`（回填脚本调用上游 Space mapper 时需要）。 */
export function toSdkUser(user: TweetUser): SdkTweetUser {
  const { id_str, ...rest } = user
  return { ...rest, id: id_str }
}

export function toArchivedSpace(space: SdkSpaceDetails): SpaceDetails {
  const { host, ...rest } = space
  const { id, ...hostRest } = host
  return {
    ...rest,
    host: { ...hostRest, id_str: id },
  }
}

/** SDK `EnrichedTweet` → 归档 `EnrichedTweet`（递归引用推文 / comments）。 */
export function toArchivedTweet(tweet: SdkEnrichedTweet): EnrichedTweet {
  return {
    id: tweet.id,
    url: tweet.url,
    lang: tweet.lang,
    created_at: tweet.created_at,
    text: tweet.text,
    user: toArchivedUser(tweet.user),
    entities: tweet.entities,
    media_details: tweet.mediaDetails,
    parent_id: tweet.parent_id,
    in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
    in_reply_to_screen_name: tweet.in_reply_to_screen_name,
    quoted_tweet_id: tweet.quotedTweetId,
    quoted_tweet: tweet.quotedTweet
      ? toArchivedTweet(tweet.quotedTweet)
      : undefined,
    card: tweet.card,
    poll: tweet.poll,
    space: tweet.space
      ? toArchivedSpace(tweet.space)
      : undefined,
    retweeted_original_id: tweet.retweetedOriginalId,
    is_inline_media: tweet.isInlineMedia,
    reply_count: tweet.replyCount,
    like_count: tweet.likeCount,
    retweet_count: tweet.retweetCount,
    view_count: tweet.viewCount,
    comments: tweet.comments?.map(toArchivedTweet),
  }
}

export function toArchivedTweets(tweets: SdkEnrichedTweet[]): EnrichedTweet[] {
  return tweets.map(toArchivedTweet)
}
