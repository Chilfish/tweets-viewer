<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import type { Tweet } from '~/types/tweets'

const tweetStore = useTweetStore()
const tweets = shallowRef<Tweet[]>([])
const hasMore = ref(true)
const isLoading = ref(true)
const route = useRoute()

watch(() => route.params, async ({ name: newName }) => {
  if (!newName || newName === tweetStore.user?.name)
    return

  tweets.value = []
  hasMore.value = true
  tweetStore.resetPages()
  await loadTweets()
})

watch(() => route.query, async () => {
  tweets.value = []
  hasMore.value = true
  tweetStore.resetPages()
  await loadTweets()
})

async function loadTweets() {
  if (!hasMore.value)
    return

  isLoading.value = true
  const data = await tweetStore.getTweets()
  isLoading.value = false

  if (
    data[0]?.id === tweets.value[0]?.id
    || data.length === 0
  ) {
    hasMore.value = false
    return
  }

  tweets.value = [...tweets.value, ...data]
}

const postRef = useTemplateRef('postRef')

useInfiniteScroll(
  document,
  loadTweets,
  {
    throttle: 500,
    distance: 0,
  },
)

const name = tweetStore.user?.screen_name || ''
useSeo({
  title: `${name} 推文记录`,
  description: `查看${name} 的历史推文`,
})
</script>

<template>
  <section
    ref="postRef"
    class="flex flex-col gap-3"
  >
    <Post
      v-for="tweet in tweets"
      :key="tweet.id"
      :tweet="tweet"
    />
  </section>

  <Button
    v-if="hasMore && !isLoading"
    class="m-4 p-2"
    size="lg"
    variant="ghost"
    @click="loadTweets"
  >
    加载更多
  </Button>

  <n-empty
    v-if="!tweets.length && !isLoading"
    class="my-8"
    size="large"
    description="没有任何推文欸"
  />
</template>
