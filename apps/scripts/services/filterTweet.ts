import type {
  QuotedTweet,
  ReTweet,
  Tweet,
  User,
  UserInfo,
} from '@tweets-viewer/shared'
import type { IRawTweet, IRawUserTweetsAndRepliesResponse } from 'rettiwt-api'

type IRawTweetsAndReplies = Exclude<
  IRawUserTweetsAndRepliesResponse['data']['user']['result']['timeline_v2']['timeline']['instructions'][number]['entries'][number]['content'],
  undefined
>

export type TweetData = { metadata: IRawTweetsAndReplies } & IRawTweet

function _getUser(data: TweetData) {
  const _data = {
    ...data,
    metadata: 'metadata' in data ? data.metadata : data,
  }
  const user = _data.metadata?.core.user_results.result

  if (!user || user.__typename !== 'User') {
    throw new Error('User not found')
  }
  return user
}

function filterUserInfo(data: TweetData): UserInfo {
  const user = _getUser(data)
  const { legacy } = user

  return {
    name: legacy.name,
    screenName: legacy.screen_name,
    avatarUrl: legacy.profile_image_url_https,
  }
}

function filterUser(data: TweetData, birthday = new Date()): User {
  const user = _getUser(data)
  const { legacy } = user

  const website = legacy.entities.url?.urls[0].expanded_url || ''

  const bio = legacy.entities.description.urls.reduce(
    (acc, url) => acc.replace(url.url, url.expanded_url),
    legacy.description,
  )

  const profileBannerUrl =
    'profile_banner_url' in legacy ? legacy.profile_banner_url : ''

  return {
    ...filterUserInfo(data),
    restId: user.rest_id,
    profileBannerUrl,
    followersCount: legacy.followers_count,
    followingCount: legacy.friends_count,
    location: legacy.location,
    bio,
    website,
    createdAt: new Date(legacy.created_at),
    birthday,
    tweetStart: new Date(),
    tweetEnd: new Date(),
  }
}

function _filterTweet(data: TweetData): Tweet | null {
  const tweet = data.metadata.legacy

  if (!tweet?.id_str) {
    return null
  }

  const mediaLinks = tweet.extended_entities?.media || []

  const media = mediaLinks.map((m) => {
    const isVideo = m.type === 'video'
    let url = m.media_url_https
    if (isVideo) {
      // @ts-expect-error it's a video
      url = m.video_info.variants
        .filter((v: any) => v.content_type === 'video/mp4')
        .sort((a: any, b: any) => b.bitrate - a.bitrate)[0].url
    }

    return {
      url,
      type: m.type,
      height: m.original_info.height,
      width: m.original_info.width,
    }
  })

  let text = mediaLinks.reduce(
    (acc, m) => acc.toString().replace(` ${m.url}`, ''),
    tweet.full_text,
  )

  text = tweet.entities.urls.reduce(
    (acc, url) => acc.replace(url.url, url.expanded_url),
    text,
  )

  const isRetweet = 'retweeted_status_result' in (data.metadata?.legacy || {})
  const isQuote = 'quoted_status_result' in (data.metadata || {})

  return {
    id: tweet.id_str,
    tweetId: tweet.id_str,
    userId: filterUserInfo(data).screenName,

    createdAt: new Date(tweet.created_at),
    fullText: isRetweet ? 'RT' : text,
    media,

    retweetCount: tweet.retweet_count,
    quoteCount: tweet.quote_count,
    replyCount: tweet.reply_count,
    favoriteCount: tweet.favorite_count,
    viewsCount: data.views_count || 0,

    retweetedStatus: isRetweet ? filterRetweet(data as any) : null,
    quotedStatus: isQuote ? filterQuotedTweet(data as any) : null,
  }
}

function filterTweet(data: TweetData): Tweet | null {
  let _data = data as any
  if ('legacy' in data) {
    _data = {
      ...data,
      metadata: data,
    }
  } else if (!('metadata' in data && 'legacy' in data.metadata)) {
    _data = {
      ...data,
      metadata: { legacy: data },
    }
  }
  return _filterTweet(_data)
}

function filterRetweet(data: TweetData): ReTweet | null {
  const retweet = data.metadata?.legacy.retweeted_status_result?.result

  if (!retweet || retweet.__typename !== 'Tweet') {
    return null
  }

  const retweetedUser = filterUserInfo({ metadata: retweet })
  const tweet = filterTweet(retweet as any)
  if (!tweet) {
    return null
  }

  return {
    user: retweetedUser,
    tweet,
  }
}

function filterQuotedTweet(data: TweetData): QuotedTweet | null {
  const quotedTweet = data.metadata?.quoted_status_result?.result

  if (!quotedTweet || quotedTweet.__typename !== 'Tweet') {
    return null
  }

  const quoteUser = filterUserInfo({ metadata: quotedTweet })
  const tweet = filterTweet(quotedTweet as any)

  if (!tweet) {
    return null
  }

  return {
    user: quoteUser,
    tweet,
  }
}

export { filterTweet, filterUser, filterUserInfo }
