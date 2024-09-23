<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { ref, shallowRef } from 'vue'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import type { Tweet } from '~/types/tweets'

const page = ref(0)
const offset = 10

const tweetStore = useTweetStore()
const tweets = shallowRef<Tweet[]>([])

useInfiniteScroll(
  window.document,
  async () => {
    const data = await tweetStore.getTweetsPages(page.value, offset)
    tweets.value = [...tweets.value, ...data]
    page.value++
  },
  { distance: 10 },
)

const name = tweetStore.user?.screen_name || ''

useSeo({
  title: `${name} 推文记录`,
  description: `查看${name} 的历史推文`,
})
</script>

<template>
  <section>
    <Post
      v-for="tweet in tweets"
      :key="tweet.id"
      :tweet="tweet"
    />
  </section>

  <Button
    v-if="tweets.length > tweets.length"
    class="m-4 p-2"
    size="lg"
    variant="ghost"
    @click="() => page++"
  >
    加载更多
  </Button>

  <n-empty
    v-if="!tweets.length"
    class="my-8"
    size="large"
    description="没有任何推文欸"
  />
</template>
