<script setup lang="ts">
import type { Tweet } from '~/types'
import { CircleMinus } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()
const route = useRoute()

const tweets = ref<Tweet[]>([])

watch(() => route.params.name as string, async (name) => {
  tweetStore.tweetService.changeName(name)
  const curName = usersStore.curUser.name

  useSeo({
    title: `@${curName} 推文的那年今日`,
    description: `@${curName} 在这一天的推文`,
  })

  tweetStore.isLoading = true
  tweets.value = await tweetStore.tweetService.getLastYearsTodayData()
  tweetStore.isLoading = false
}, { immediate: true })
</script>

<template>
  <section class="flex flex-col gap-2 p-2">
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
      <CircleMinus class="h-10 w-10" />
      <p class="text-lg font-medium">
        没有任何推文欸
      </p>
    </div>
  </section>
</template>
