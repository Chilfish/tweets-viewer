import type { EnrichedTweet, RawTweet } from '../../types/enriched'
import { enrichTweet } from '../../helper/parseTweet'

/**
 * 推文数据增强服务
 * 职责：将原始推文数据转换为富文本推文，处理引用推文等业务逻辑
 */
export class TweetEnrichmentService {
  /**
   * 增强单条推文数据
   * @returns 增强后的推文，失败时返回 null
   */
  enrichSingleTweet(rawTweet: RawTweet): EnrichedTweet | null {
    const enrichedTweet = enrichTweet(rawTweet)
    if (!enrichedTweet) {
      return null
    }

    // 处理引用推文
    if (rawTweet.quoted_status_result?.result) {
      const quotedTweet = enrichTweet(rawTweet.quoted_status_result.result)
      if (quotedTweet) {
        enrichedTweet.quoted_tweet = quotedTweet
      }
    }

    return enrichedTweet
  }

  /**
   * 批量增强推文数据
   */
  enrichTweets(rawTweets: RawTweet[]): EnrichedTweet[] {
    return rawTweets
      .map(tweet => this.enrichSingleTweet(tweet))
      .filter((tweet): tweet is EnrichedTweet => tweet !== null)
  }

  /**
   * 增强用户时间线推文，过滤广告内容
   * @param rawTweets - 原始推文列表
   * @param userId - 用户ID，用于过滤非用户发布的广告内容
   */
  enrichUserTimelineTweets(rawTweets: RawTweet[], userId: string): EnrichedTweet[] {
    return this.enrichTweets(rawTweets)
      .filter(tweet => !this.isAdvertisement(tweet, userId))
  }

  /**
   * 判断推文是否为广告
   * @private
   */
  private isAdvertisement(tweet: EnrichedTweet, userId: string): boolean {
    return tweet.user.id_str !== userId && !tweet.retweeted_original_id
  }
}
