<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { isDark } from '~/composables'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()

onBeforeMount(async () => {
  const tweetJson = await fetch('/data-lsl.json').then(res => res.json())

  tweetStore.setTweets(tweetJson.tweets.slice(0, 100).sort((a: any, b: any) => +b.id - +a.id))
  tweetStore.user = tweetJson.user
})
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 md:w-50% md:p-4"
  >
    <div
      v-if="!isDark"
      class="fixed top-0 z-[-2] h-screen w-screen bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.13)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)] bg-white"
    />
    <div
      v-else
      class="fixed top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] bg-neutral-950"
    />

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
