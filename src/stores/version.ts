import { useStorage } from '@vueuse/core'
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

export const tweetConfig = useStorage<TweetConfig[]>('tweetConfig', [])
export const newVersions = ref<TweetConfig[]>([])

export function isSameVersion(name: string) {
  const oldVersions = tweetConfig.value
  const newKey: TweetKey = `data-${name}`
  const newVersion = newVersions.value.find(c => c.name === newKey)?.version
  const oldVersion = oldVersions.find(c => c.name === newKey)?.version

  if (newVersion === oldVersion) {
    return true
  }

  const newConfig = newVersions.value.find(c => c.name === newKey)
  if (!newConfig) {
    return false
  }

  const oldConfig = oldVersions.find(c => c.name === newKey)

  if (!oldConfig) {
    oldVersions.push(newConfig)
    return false
  }

  oldConfig.version = newConfig.version
  oldConfig.tweetRange = newConfig.tweetRange

  return false
}

export async function fetchVersion() {
  if (newVersions.value.length) {
    return newVersions.value
  }

  const versions = await fetch(`${staticUrl}/tweet/versions.json`).then(res => res.json())
  newVersions.value = versions
  return versions
}
