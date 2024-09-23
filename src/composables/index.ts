import { useDark, useNetwork, watchImmediate } from '@vueuse/core'
import { ref } from 'vue'
import { canGoogle } from '~/utils'

export * from './seo'

export const isDark = useDark({
  valueLight: 'light',
  valueDark: 'dark',
  storageKey: 'theme',
  disableTransition: false,
})

const { isOnline } = useNetwork()
export const isGoodNetwork = ref(false)
export function checkNetwork() {
  watchImmediate(isOnline, async () => {
    if (isOnline.value) {
      isGoodNetwork.value = await canGoogle()
    }
    else {
      isGoodNetwork.value = false
    }
    console.log('isGoodNetwork', isGoodNetwork.value)
  })

  return isGoodNetwork
}

export function useRetryFetch(
  onError: (error: Error) => void = console.error,
) {
  return async function retryFetch<T = any>(
    url: string,
    retry = 0,
  ): Promise<T | null> {
    return fetch(url)
      .then(res => res.json())
      .catch(async () => {
        if (retry < 3) {
          return retryFetch(url, retry + 1)
        }
        else {
          onError(new Error(`Failed to fetch ${url}`))
          return null
        }
      })
  }
}
