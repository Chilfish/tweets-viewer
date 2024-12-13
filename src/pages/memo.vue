<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, onMounted, watch } from 'vue'
import Loading from '~/components/icon/Loading'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()
const { data: tweets, isFetching, refetch } = useQuery({
  queryKey: ['memo', computed(() => tweetStore.isReverse)],
  queryFn: () => tweetStore.tweetService.getLastYearsTodayData(),
  initialData: [],
  refetchOnWindowFocus: false,
  gcTime: 0,
})

watch(tweets, () => {
  tweetStore.isLoading = isFetching.value
})

useSeo({
  title: `@${usersStore.curUser.name} 推文的那年今日`,
  description: `@${usersStore.curUser.name} 在这一天的推文`,
})

onMounted(() => {
  refetch()
})
</script>

<template>
  <section>
    <Post
      v-for="tweet in tweets"
      :key="tweet.id"
      :tweet="tweet"
      :user="usersStore.curUser"
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
