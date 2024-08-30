<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { Loader } from 'lucide-vue-next'
import { Post } from '~/components/posts/post'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()

onBeforeMount(async () => {
  const tweetJson = await fetch('/data-test.json').then(res => res.json())

  tweetStore.setTweets(tweetJson.tweets.slice(0, 10))
  tweetStore.user = tweetJson.user
})
</script>

<template>
  <template v-if="tweetStore.tweets.length">
    <Post
      v-for="tweet in tweetStore.tweets"
      :key="tweet.id"
      :tweet="tweet"
    />
  </template>
  <div
    v-else
    class="w-full flex items-center justify-center pt-30"
  >
    <Loader class="animate-spin" />
  </div>
</template>
