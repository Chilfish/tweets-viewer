<script setup lang="ts">
import type { Tweet } from '~/types'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()
const route = useRoute()

const tweets = ref<Tweet[]>([])

watchEffect(() => {
  useSeo({
    title: `@${usersStore.curUser.name} 推文的那年今日`,
    description: `@${usersStore.curUser.name} 在这一天的推文`,
  })
})

onMounted(async () => {
  const name = route.params.name as string
  tweetStore.tweetService.changeName(name)

  tweetStore.isLoading = true
  tweets.value = await tweetStore.tweetService.getLastYearsTodayData()
  tweetStore.isLoading = false
})
</script>

<template>
  <section class="flex flex-col gap-2">
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
