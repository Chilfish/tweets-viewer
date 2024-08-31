<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()

onBeforeMount(async () => {
  const tweetJson = await fetch('/data-lsl.json').then(res => res.json())

  tweetStore.setTweets(tweetJson.tweets.sort((a: any, b: any) => +b.id - +a.id))
  tweetStore.user = tweetJson.user
})
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 md:w-50% md:p-4"
  >
    <template
      v-if="tweetStore.tweets.length"
    >
      <Header />
      <slot />
    </template>

    <div
      v-else
      class="w-full flex items-center justify-center pt-30"
    >
      <Loader class="animate-spin" />
    </div>

    <n-back-top :right="20" />
  </main>
</template>
