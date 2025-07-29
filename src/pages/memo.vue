<script setup lang="ts">
import type { Tweet } from '~/types'
import { CircleMinus } from 'lucide-vue-next'
import { onBeforeMount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()
const route = useRoute()

const tweets = ref<Tweet[]>([])
const isLoading = ref(false)

onBeforeMount(async () => {
  isLoading.value = true
  const name = route.params.name as string
  tweetStore.tweetService.changeName(name)
  const curName = usersStore.curUser.name

  useSeo({
    title: `@${curName} 推文的那年今日`,
    description: `@${curName} 在这一天的推文`,
  })

  tweets.value = await tweetStore.tweetService.getLastYearsTodayData()
  console.log(`@${curName} 推文的那年今日`, tweets.value.length)
  isLoading.value = false
})

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
      v-if="!tweets.length && !isLoading"
      class="my-8 flex flex-col items-center justify-center text-center"
    >
      <CircleMinus class="h-10 w-10" />
      <p class="text-lg font-medium">
        没有任何推文欸
      </p>
    </div>
  </section>
</template>
