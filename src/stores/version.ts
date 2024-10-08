import { ref } from 'vue'
import { staticUrl } from '~/constant'

type TweetKey = `data-${string}`

export interface TweetConfig {
  /**
   * `data-${userId}`
   */
  name: TweetKey
  version: string
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

  const versions = await fetch(`${staticUrl}/tweet/versions.json`)
    .then(res => res.json())
    .catch(() => [])

  tweetConfig.value = versions
  return versions
}
