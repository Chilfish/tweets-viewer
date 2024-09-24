<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import type { Tweet } from '~/types/tweets'

const tweetStore = useTweetStore()
const { state: tweets, isLoading } = useAsyncState<Tweet[]>(
  tweetStore.tweetService.getLastYearsTodayData,
  [],
)

const name = tweetStore.user?.screen_name || '用户'

useSeo({
  title: `${name} 推文的那年今日`,
  description: `${name} 在这一天的推文`,
})
</script>

<template>
  <section>
    <Post
      v-for="tweet in tweets"
      :key="tweet.id"
      :tweet="tweet"
    />

    <n-empty
      v-if="!tweets.length && !isLoading"
      class="my-8"
      size="large"
      description="没有任何推文欸"
    />

    <div
      v-else-if="isLoading"
      class="w-full flex items-center justify-center pt-30"
    >
      <Loader class="animate-spin" />
    </div>
  </section>
</template>
