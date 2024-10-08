<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Loading from '~/components/icon/Loading'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
const route = useRoute()

const skipRoutes = ['remote', 'index']

const isLoaded = computed(() => {
  return skipRoutes.includes(route.name as string)
    ? true
    : tweetStore.isInit
})

onMounted(async () => {
  await tweetStore.initTweets()
})
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 md:w-50% md:p-4"
  >
    <Header />
    <slot />

    <Loading v-if="!isLoaded" />

    <n-back-top :right="20" />
  </main>
</template>
