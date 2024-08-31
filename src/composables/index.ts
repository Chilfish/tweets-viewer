import { useDark, useNetwork, watchImmediate } from '@vueuse/core'
import { ref } from 'vue'
import { canGoogle } from '~/utils'

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
