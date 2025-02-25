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
    <div
      v-if="!tweets.length && !tweetStore.isLoading"
      class="my-8 flex flex-col items-center justify-center text-center"
    >
      <div class="text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mx-auto mb-4"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <p class="text-lg font-medium">
          没有任何推文欸
        </p>
      </div>
    </div>
  </section>
</template>
