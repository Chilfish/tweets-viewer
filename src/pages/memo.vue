<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import Loading from '~/components/icon/Loading'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
const { data: tweets, isFetching } = useQuery({
  queryKey: ['memo', computed(() => tweetStore.isReverse)],
  queryFn: () => tweetStore.tweetService.getLastYearsTodayData(),
  refetchOnWindowFocus: false,
  initialData: [],
})

const name = tweetStore.curConfig.username

useSeo({
  title: `@${name} 推文的那年今日`,
  description: `@${name} 在这一天的推文`,
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
      v-if="!tweets.length && !isFetching"
      class="my-8"
      size="large"
      description="没有任何推文欸"
    />

    <Loading v-if="isFetching" />
  </section>
</template>
