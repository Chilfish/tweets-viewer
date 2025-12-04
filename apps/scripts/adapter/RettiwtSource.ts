import type { IRawUserDetailsResponse, IRawUserTweetsAndRepliesResponse } from '@tweets-viewer/rettiwt-api'
import type { Tweet } from '@tweets-viewer/shared'
import type { FetchResult, ITweetSource } from '../types'
import {
  CursoredData,
  FetcherService,

  ResourceType,
} from '@tweets-viewer/rettiwt-api'
import { TweetMapper } from '../services/mapper'

export class RettiwtSource implements ITweetSource {
  private api: FetcherService

  constructor(apiKey?: string) {
    // @ts-expect-error: Library type definition might be loose
    this.api = new FetcherService({ apiKey })
  }

  async fetchUser(username: string) {
    const { data } = await this.api.request<IRawUserDetailsResponse>(
      ResourceType.USER_DETAILS_BY_USERNAME,
      { id: username },
    )
    return TweetMapper.toUser(data.user.result)
  }

  /**
   * 使用生成器模式处理分页，符合迭代器模式
   */
  async* fetchTweetsIterator(
    username: string,
    startCursor?: string,
  ): AsyncGenerator<FetchResult, void, unknown> {
    let cursor = startCursor || ''

    while (true) {
      try {
        const res = await this.api.request<IRawUserTweetsAndRepliesResponse>(
          ResourceType.USER_TIMELINE,
          { id: username, cursor: cursor || undefined },
        )

        const rawData = res.data.user.result as any
        const instructions = rawData.timeline?.timeline?.instructions || []

        // 提取 Cursor
        const nextCursor = new CursoredData(res, 'Tweet' as any).next

        // 提取 Raw Tweets
        const rawEntries = instructions
          .filter((i: any) => i.type === 'TimelineAddEntries')
          .flatMap((i: any) => i.entries)
          .flatMap(({ content }: any) => {
            if (content.items)
              return content.items.map((i: any) => i.item?.itemContent)
            return content.itemContent
          })
          .filter((item: any) => item && item.itemType === 'TimelineTweet')

        if (rawEntries.length === 0) {
          yield { tweets: [], user: {} as any, hasMore: false }
          return
        }

        // 转换数据
        const tweets: Tweet[] = []
        let userMetadata: any = null

        for (const raw of rawEntries) {
          const tweet = TweetMapper.toTweet(raw.tweet_results.result)
          if (tweet) {
            tweets.push(tweet)
            // 捕获第一个有效的用户信息作为本批次的 User 数据源
            if (!userMetadata) {
              userMetadata = raw.tweet_results.result
            }
          }
        }

        const user = userMetadata
          ? TweetMapper.toUser(userMetadata)
          : ({} as any)

        yield {
          tweets,
          user,
          nextCursor,
          hasMore: !!nextCursor && tweets.length > 0,
        }

        if (!nextCursor)
          break
        cursor = nextCursor
      }
      catch (error) {
        console.error(`Error fetching tweets for ${username}:`, error)
        // 遇到错误停止迭代，而不是崩溃整个程序
        break
      }
    }
  }
}
