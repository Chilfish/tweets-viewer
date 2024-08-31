<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { ref } from 'vue'
import { Post } from '~/components/posts/post'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
const tweets = tweetStore.getTweets()

const tweetsToDisplay = ref(tweets.slice(0, 10))

function loadmore() {
  const size = tweetsToDisplay.value.length
  tweetsToDisplay.value = [
    ...tweetsToDisplay.value,
    ...tweets.slice(size, size + 10),
  ]
}

useInfiniteScroll(
  window.document,
  loadmore,
  { distance: 10 },
)
</script>

<template>
  <section>
    <Post
      v-for="tweet in tweetsToDisplay"
      :key="tweet.id"
      :tweet="tweet"
    />
  </section>

  <Button
    v-if="tweets.length > tweetsToDisplay.length"
    class="m-4 p-2"
    size="large"
    variant="ghost"
    @click="loadmore"
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
