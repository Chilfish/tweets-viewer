<script setup lang="ts">
import type { Tweet } from '~/types'
import { onMounted, ref } from 'vue'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()

const tweets = ref<Tweet[]>([])

useSeo({
  title: `@${usersStore.curUser.name} 推文的那年今日`,
  description: `@${usersStore.curUser.name} 在这一天的推文`,
})

onMounted(async () => {
  tweetStore.isLoading = true
  tweets.value = await tweetStore.tweetService.getLastYearsTodayData()
  tweetStore.isLoading = false
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
      v-if="!tweets.length && !tweetStore.isLoading"
      class="my-8"
      size="large"
      description="没有任何推文欸"
    />
  </section>
</template>
