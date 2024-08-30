<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { Post } from '~/components/posts/post'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()

onBeforeMount(async () => {
  const tweetJson = await fetch('/data-lsl.json').then(res => res.json())

  tweetStore.setTweets(tweetJson.tweets.slice(0, 10))
  tweetStore.user = tweetJson.user
})
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 sm:w-50% sm:p-4"
  >
    <Post
      v-for="tweet in tweetStore.tweets"
      :key="tweet.id"
      :tweet="tweet"
    />
  </main>
</template>
