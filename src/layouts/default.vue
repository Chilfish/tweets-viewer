<script setup lang="ts">
import { Loader } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
const route = useRoute()

const isLoaded = computed(() => {
  return route.name === 'index'
    ? true
    : tweetStore.isInit
})
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 md:w-50% md:p-4"
  >
    <Header />
    <slot
      v-if="isLoaded"
    />

    <div
      v-else
      class="w-full flex items-center justify-center pt-30"
    >
      <Loader class="animate-spin" />
    </div>

    <n-back-top :right="20" />
  </main>
</template>
