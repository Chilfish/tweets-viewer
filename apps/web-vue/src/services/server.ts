import { request } from '@tweets-viewer/shared'
import type { Tweet } from '@tweets-viewer/shared/types'
import type { TweetService } from '.'

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

  private queryKey(keys: Record<string, any>, domain: string): string {
    return `${domain}-${this.name}-${JSON.stringify(keys)}-${this.isReverse ? 'reverse' : 'normal'}`
  }

  async getTweets(page: number) {
    if (!this.name) return []

    const res = await request.get<Tweet[]>(`/tweets/get/${this.name}`, {
      params: {
        page,
        reverse: this.isReverse,
      },
      id: this.queryKey({ page }, 'get'),
    })
    return res.data
  }

  async getByDateRange(start: number, end: number, page: number) {
    if (!this.name) return []
    const res = await request.get<Tweet[]>(`/tweets/get/${this.name}/range`, {
      params: {
        start,
        end,
        page,
        reverse: this.isReverse,
      },
      id: this.queryKey({ start, end, page }, 'range'),
    })
    return res.data
  }

  async getLastYearsTodayData() {
    if (!this.name) {
      console.warn('[ServerTweetService] name is not set')
      return []
    }
    const res = await request.get<Tweet[]>(
      `/tweets/get/${this.name}/last-years-today`,
      {
        params: {
          reverse: this.isReverse,
        },
        id: this.queryKey({}, 'last-years-today'),
      },
    )
    return res.data
  }

  async searchTweets(
    keyword: string,
    page: number,
    start?: number,
    end?: number,
  ) {
    if (!this.name) return []
    const res = await request.get<Tweet[]>(`/tweets/search/${this.name}`, {
      params: {
        q: keyword,
        page,
        start: start || undefined,
        end: end || undefined,
        reverse: this.isReverse,
      },
      id: this.queryKey({ keyword, page, start, end }, 'search'),
    })
    return res.data
  }
}
