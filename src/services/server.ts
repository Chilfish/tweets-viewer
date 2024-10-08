import type { TweetService } from '.'
import type { Tweet } from '~/types/tweets'
import { request } from '~/utils/fetch'

export class ServerTweetService implements TweetService {
  name: string
  pageSize = 10
  isReverse = true

  constructor(name: string) {
    this.name = name
  }

  changeName(name: string): void {
    this.name = name
  }

  async getTweets(page: number) {
    const res = await request.get<Tweet[]>(`/tweets/get/${this.name}`, {
      params: {
        page,
        reverse: this.isReverse,
      },
    })
    return res.data
  }

  async getByDateRange(
    start: number,
    end: number,
    page: number,
  ) {
    const res = await request.get<Tweet[]>(`/tweets/get/${this.name}/range`, {
      params: {
        start,
        end,
        page,
        reverse: this.isReverse,
      },
    })
    return res.data
  }

  async getLastYearsTodayData() {
    const res = await request.get<Tweet[]>(`/tweets/get/${this.name}/last-years-today`, {
      params: {
        reverse: this.isReverse,
      },
    })
    return res.data
  }

  async searchTweets(
    keyword: string,
    page: number,
    start?: number,
    end?: number,
  ) {
    const res = await request.get<Tweet[]>(`/tweets/search/${this.name}`, {
      params: {
        q: keyword,
        page,
        start: start || undefined,
        end: end || undefined,
        reverse: this.isReverse,
      },
    })
    return res.data
  }
}
