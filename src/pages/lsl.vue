<script setup lang="ts">
import { computed } from 'vue'
import { Post } from '~/components/posts/post'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()

const tweets = computed(() => tweetStore.getTweets())
</script>

<template>
  <Post
    v-for="tweet in tweets"
    :key="tweet.id"
    :tweet="tweet"
  />

  <n-empty
    v-if="!tweets.length"
    class="mt-8"
    size="large"
    description="没有任何推文欸"
  />
</template>
