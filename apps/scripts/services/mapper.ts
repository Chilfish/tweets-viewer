import type {
  IRawUserTweetsAndRepliesResponse,
} from '@tweets-viewer/rettiwt-api'
import type {
  QuotedTweet,
  ReTweet,
  Tweet,
  User,
  UserInfo,
} from '@tweets-viewer/shared'

// 定义内部使用的类型，避免在主逻辑中到处写 Exclude<...>
type TimelineEntry
  = IRawUserTweetsAndRepliesResponse['data']['user']['result']['timeline_v2']['timeline']['instructions'][number]['entries'][number]
type ItemContent = Exclude<TimelineEntry['content']['itemContent'], undefined>

export class TweetMapper {
  /**
   * 提取嵌套的 User 对象
   */
  private static extractUserResult(data: any): any {
    const metadata = data.metadata || data
    const result = metadata?.core?.user_results?.result
    if (!result || result.__typename !== 'User') {
      throw new Error('User data not found or invalid type')
    }
    return result
  }

  static toUserInfo(data: any): UserInfo {
    const user = TweetMapper.extractUserResult(data)
    const { legacy } = user
    return {
      name: legacy.name,
      screenName: legacy.screen_name,
      avatarUrl: legacy.profile_image_url_https,
    }
  }

  static toUser(data: any, birthday = new Date()): User {
    const userResult = TweetMapper.extractUserResult(data)
    const { legacy, rest_id } = userResult

    const website = legacy.entities?.url?.urls?.[0]?.expanded_url || ''

    // 安全处理 bio 中的 URL 替换
    let bio = legacy.description || ''
    if (legacy.entities?.description?.urls) {
      bio = legacy.entities.description.urls.reduce(
        (acc: string, url: any) => acc.replace(url.url, url.expanded_url),
        bio,
      )
    }

    return {
      ...TweetMapper.toUserInfo(data),
      restId: rest_id,
      profileBannerUrl: legacy.profile_banner_url || '',
      followersCount: legacy.followers_count,
      followingCount: legacy.friends_count,
      location: legacy.location || '',
      bio,
      website,
      createdAt: new Date(legacy.created_at),
      birthday,
      tweetStart: new Date(), // 这些字段通常在业务层计算后填充
      tweetEnd: new Date(),
    }
  }

  static toTweet(data: any): Tweet | null {
    // 归一化数据结构
    let rawData = data
    if ('legacy' in data) {
      rawData = { ...data, metadata: data }
    }
    else if (!('metadata' in data && 'legacy' in data.metadata)) {
      rawData = { ...data, metadata: { legacy: data } }
    }

    const legacy = rawData.metadata?.legacy
    if (!legacy?.id_str)
      return null

    // 处理媒体
    const mediaLinks = legacy.extended_entities?.media || []
    const media = mediaLinks.map((m: any) => {
      let url = m.media_url_https
      if (m.type === 'video') {
        const variants = m.video_info?.variants || []
        const bestVariant = variants
          .filter((v: any) => v.content_type === 'video/mp4')
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
        if (bestVariant)
          url = bestVariant.url
      }
      return {
        url,
        type: m.type,
        height: m.original_info?.height,
        width: m.original_info?.width,
      }
    })

    // 处理文本
    let text = legacy.full_text || ''
    mediaLinks.forEach((m: any) => {
      text = text.replace(` ${m.url}`, '')
    })
    legacy.entities?.urls?.forEach((url: any) => {
      text = text.replace(url.url, url.expanded_url)
    })

    const isRetweet = !!legacy.retweeted_status_result
    const isQuote = !!rawData.metadata?.quoted_status_result

    try {
      return {
        id: legacy.id_str,
        tweetId: legacy.id_str,
        userId: TweetMapper.toUserInfo(rawData).screenName,
        createdAt: new Date(legacy.created_at),
        fullText: isRetweet ? 'RT' : text,
        media,
        retweetCount: legacy.retweet_count,
        quoteCount: legacy.quote_count,
        replyCount: legacy.reply_count,
        favoriteCount: legacy.favorite_count,
        viewsCount: rawData.views_count ? Number(rawData.views_count) : 0,
        retweetedStatus: isRetweet ? TweetMapper.toRetweet(rawData) : null,
        quotedStatus: isQuote ? TweetMapper.toQuotedTweet(rawData) : null,
      }
    }
    catch (e) {
      console.warn(`Failed to parse tweet ${legacy.id_str}`, e)
      return null
    }
  }

  private static toRetweet(data: any): ReTweet | null {
    const result = data.metadata?.legacy?.retweeted_status_result?.result
    if (!result || result.__typename !== 'Tweet')
      return null

    const tweet = TweetMapper.toTweet(result)
    if (!tweet)
      return null

    return {
      user: TweetMapper.toUserInfo({ metadata: result }),
      tweet,
    }
  }

  private static toQuotedTweet(data: any): QuotedTweet | null {
    const result = data.metadata?.quoted_status_result?.result
    if (!result || result.__typename !== 'Tweet')
      return null

    const tweet = TweetMapper.toTweet(result)
    if (!tweet)
      return null

    return {
      user: TweetMapper.toUserInfo({ metadata: result }),
      tweet,
    }
  }
}
