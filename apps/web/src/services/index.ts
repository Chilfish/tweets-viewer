import type { Tweet } from '@tweets-viewer/core'

export abstract class TweetService {
  pageSize = 10
  /**
   * 是否倒序，以最新的在前，默认为 true
   */
  isReverse = true
  name: string

  constructor(name: string) {
    this.name = name
  }

  abstract changeName(name: string): void

  abstract getTweets(page: number): Promise<Tweet[]>

  abstract getByDateRange(start: number, end: number, page: number): Promise<Tweet[]>

  abstract getLastYearsTodayData(): Promise<Tweet[]>

  abstract searchTweets(keyword: string, page: number, start?: number, end?: number): Promise<Tweet[]>
}
