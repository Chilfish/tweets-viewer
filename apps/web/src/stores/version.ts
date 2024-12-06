import { request } from '@tweets-viewer/core'
import { ref } from 'vue'

type TweetKey = `data-${string}`

export interface TweetConfig {
  /**
   * `data-${userId}`
   */
  name: TweetKey
  /**
   * name to be displayed
   */
  username: string
  tweetRange: {
    start: number
    end: number
  }
}

export const tweetConfig = ref<TweetConfig[]>([])

export async function fetchVersion() {
  if (tweetConfig.value.length) {
    return tweetConfig.value
  }

  const { data: config } = await request.get<TweetConfig[]>(`/config`)
    .catch(() => ({ data: [] }))

  tweetConfig.value = config
  return config
}
