import type { RettiwtPool } from '../../helper/RettiwtPool'
import type { EnrichedUser, RawTweet } from '../../types/enriched'
import type { IListTweetsResponse } from '../../types/raw/list/Tweets'
import type { ITweetDetailsResponse } from '../../types/raw/tweet/Details'
import type { ITweetRepliesResponse } from '../../types/raw/tweet/Replies'
import type { IUserDetailsResponse } from '../../types/raw/user/Details'
import type { IUserTweetsResponse } from '../../types/raw/user/Tweets'
import { Extractors } from '../../collections/Extractors'
import { BaseType } from '../../enums/Data'
import { ResourceType } from '../../enums/Resource'
import { TweetRepliesSortType } from '../../enums/Tweet'
import { CursoredData } from '../../models/data/CursoredData'

interface CursoredTweets {
  tweets: RawTweet[]
  cursor: string
}

/**
 * Twitter API 底层交互客户端
 * 职责：封装所有与 Twitter API 的原始请求，返回未处理的原始数据
 */
export class TwitterAPIClient {
  public onFetchedresponse: (key: string, data: any) => Promise<void> = async () => {}

  constructor(private readonly pool: RettiwtPool) {}

  /**
   * 获取单条推文的原始数据
   * @throws {Error} 当 API 请求失败时抛出异常
   */
  async fetchTweetRaw(id: string): Promise<RawTweet> {
    return this.pool.run(async (fetcher) => {
      const response = await fetcher.request<ITweetDetailsResponse>(
        ResourceType.TWEET_DETAILS,
        { id },
      )
      return response.data.tweetResult.result
    })
  }

  /**
   * 获取列表推文的原始数据
   */
  async fetchListTweetsRaw(id: string): Promise<RawTweet[]> {
    return this.pool.run(async (fetcher) => {
      const response = await fetcher.request<IListTweetsResponse>(
        ResourceType.LIST_TWEETS,
        { id },
      )

      const instructions = response.data.list?.tweets_timeline?.timeline?.instructions || []
      return instructions
        .flatMap(instruction =>
          instruction.entries.map(entry =>
            entry.content.itemContent?.tweet_results?.result as unknown as RawTweet,
          ),
        )
        .filter((tweet): tweet is RawTweet => tweet !== null && tweet !== undefined)
    })
  }

  /**
   * 获取用户详情
   * @param id - 用户 ID 或用户名
   */
  async fetchUserDetailsRaw(id: string): Promise<EnrichedUser | null> {
    if (!id) {
      return null
    }

    return this.pool.run(async (fetcher) => {
      const resource = Number.isNaN(Number(id))
        ? ResourceType.USER_DETAILS_BY_USERNAME
        : ResourceType.USER_DETAILS_BY_ID

      const response = await fetcher.request<IUserDetailsResponse>(resource, { id })

      await this.onFetchedresponse(`${ResourceType.USER_DETAILS_BY_ID}-${id}`, response)
      const data = Extractors[resource](response)
      return data || null
    })
  }

  /**
   * 获取用户时间线原始数据
   */
  async fetchUserTimelineRaw(userId: string): Promise<RawTweet[]> {
    return this.pool.run(async (fetcher) => {
      const response = await fetcher.request<IUserTweetsResponse>(
        ResourceType.USER_TIMELINE,
        { id: userId },
      )
      return this.extractTimelineTweets(response)
    })
  }

  /**
   * 获取用户时间线（含回复）原始数据
   */
  async fetchUserTimelineWithRepliesRaw(userId: string, cursor?: string): Promise<CursoredTweets> {
    return this.pool.run(async (fetcher) => {
      const response = await fetcher.request<IUserTweetsResponse>(
        ResourceType.USER_TIMELINE_AND_REPLIES,
        {
          id: userId,
          cursor,
        },
      )
      const cursoredData = new CursoredData(response, BaseType.TWEET)
      await this.onFetchedresponse(`${ResourceType.USER_TIMELINE_AND_REPLIES}-${userId}`, {
        response,
        cursor: cursoredData.next,
      })
      const tweets = this.extractTimelineTweets(response)

      return {
        tweets,
        cursor: cursoredData.next,
      }
    })
  }

  /**
   * 获取推文回复的原始数据
   */
  async fetchRepliesRaw(tweetId: string): Promise<RawTweet[]> {
    return this.pool.run(async (fetcher) => {
      const response = await fetcher.request<ITweetRepliesResponse>(
        ResourceType.TWEET_REPLIES,
        {
          id: tweetId,
          sortBy: TweetRepliesSortType.LIKES,
        },
      )

      const instructions = response.data
        .threaded_conversation_with_injections_v2
        .instructions
        .filter(t => t.type === 'TimelineAddEntries')

      const mainTweet = this.extractMainTweet(instructions)
      const comments = this.extractComments(instructions)

      return [...comments, mainTweet]
    })
  }

  /**
   * 从时间线响应中提取推文列表
   * @private
   */
  private extractTimelineTweets(response: IUserTweetsResponse): RawTweet[] {
    const rawTweets = response.data.user.result.timeline.timeline
      .instructions
      .filter(d => d.type === 'TimelineAddEntries')
      .flatMap(d => d.entries)
      .filter(entry =>
        ['tweet-', 'profile-conversation-'].some(prefix =>
          entry.entryId.startsWith(prefix),
        ),
      )

    const directTweets = rawTweets
      .filter(e => e.content.itemContent?.itemType === 'TimelineTweet')
      .map(e => e.content.itemContent?.tweet_results.result as unknown as RawTweet)
      .filter((tweet): tweet is RawTweet => tweet !== null && tweet !== undefined)

    const moduleTweets = rawTweets
      .filter(d => d.content.entryType === 'TimelineTimelineModule')
      .flatMap(d =>
        d.content.items.map(({ item }) =>
          item.itemContent.tweet_results.result as unknown as RawTweet,
        ),
      )
      .filter((tweet): tweet is RawTweet => tweet !== null && tweet !== undefined)

    return [...directTweets, ...moduleTweets]
      .filter(Boolean)
      .sort((a, b) => b.rest_id?.localeCompare(a.rest_id))
  }

  /**
   * 提取主推文
   * @private
   */
  private extractMainTweet(instructions: any[]): RawTweet {
    const mainTweet = instructions
      .flatMap(d => d.entries?.filter((e: any) => e.content.entryType === 'TimelineTimelineItem') || [])
      .flatMap((entry: any) => entry.content.itemContent?.tweet_results.result)
      .filter((result: any) => result !== null && result !== undefined)
      .at(0)

    return (mainTweet || {}) as RawTweet
  }

  /**
   * 提取评论列表
   * @private
   */
  private extractComments(instructions: any[]): RawTweet[] {
    return instructions
      .flatMap(t => t.entries?.filter((d: any) => d.content.entryType === 'TimelineTimelineModule') || [])
      .flatMap((entry: any) =>
        (entry.content.items || []).map((d: any) => d.item.itemContent.tweet_results.result),
      )
      .filter((result: any): result is RawTweet => result !== null && result !== undefined)
  }
}
