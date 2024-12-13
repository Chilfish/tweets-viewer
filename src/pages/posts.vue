<script setup lang="ts">
import type { TweetsReturn } from '~/stores/tweets'
import type { Tweet } from '~/types'
import { useQuery } from '@tanstack/vue-query'
import { useEventListener, useThrottleFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Loading from '~/components/icon/Loading'
import { Post } from '~/components/posts/post'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const usersStore = useUsersStore()
const tweetStore = useTweetStore()
const tweets = ref<Tweet[]>([])
const noMore = ref(false)
const route = useRoute()
const queryType = ref<'search' | 'dateRange' | 'all'>('all')

const queryInfo = ref<TweetsReturn>({
  queryKey: [],
  queryFn: () => Promise.resolve([]),
})
watch(() => route.query, (query, oldQuery) => {
  const hasOtherQueryChanged = Object.keys(query).some(key =>
    key !== 'page' && query[key] !== oldQuery?.[key],
  )

  if (hasOtherQueryChanged) {
    reset()
  }

  if (route.query.q) {
    queryType.value = 'search'
    queryInfo.value = tweetStore.search()
  }
  else if (route.query.from && route.query.to) {
    queryType.value = 'dateRange'
    queryInfo.value = tweetStore.getTweetsByDateRange()
  }
  else {
    queryType.value = 'all'
    queryInfo.value = tweetStore.getTweets()
  }
}, { immediate: true })

const { data: queryData, isFetching } = useQuery({
  queryKey: computed(() => queryInfo.value.queryKey),
  queryFn: computed(() => queryInfo.value.queryFn),
  initialData: [],
  refetchOnWindowFocus: false,
})

watch(queryData, () => {
  if (queryData.value.length < 10)
    noMore.value = true
  else
    noMore.value = false

  tweets.value = [...tweets.value, ...queryData.value]
}, { immediate: true })

function refresh() {
  location.reload()
}

const loadMore = useThrottleFn(() => {
  if (noMore.value)
    return
  tweetStore.nextPage()
}, 1000)

useEventListener(window, 'scroll', () => {
  const offset = 100
  const scrollHeight = document.documentElement.scrollHeight
  const isDown = window.scrollY + window.innerHeight >= scrollHeight - offset

  if (isDown)
    loadMore()
})

// 更换用户、查看顺序时重置
watch([
  () => route.params.name,
  () => tweetStore.isReverse,
], reset)

function reset() {
  tweets.value = []
  tweetStore.resetPages()
}

useSeo({
  title: `@${usersStore.curUser.name} 推文记录`,
  description: `查看@${usersStore.curUser.name} 的历史推文`,
})
</script>

<template>
  <section
    class="flex flex-col gap-3"
  >
    <Post
      v-for="tweet in tweets"
      :key="tweet.id"
      :tweet="tweet"
      :user="usersStore.curUser"
    />
  </section>

  <Button
    v-if="!isFetching && tweets.length && !noMore"
    class="m-4 p-2"
    size="lg"
    variant="ghost"
    @click="loadMore"
  >
    加载更多
  </Button>

  <Loading
    v-if="isFetching"
  />

  <n-empty
    v-if="!tweets.length && !isFetching"
    class="my-8"
    size="large"
    description="没有任何推文欸"
  >
    <template #extra>
      <n-button
        size="small"
        @click="refresh"
      >
        刷新试试？
      </n-button>
    </template>
  </n-empty>
</template>
