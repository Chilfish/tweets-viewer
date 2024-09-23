<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { db } from '~/db'
import { useTweetStore } from '~/stores/tweets'

const data = ref<any[]>([])
const tweetStore = useTweetStore()

onMounted(async () => {
  const curUser = tweetStore.user!.name

  data.value = (await db.tweets
    .filter(f => /😸/.test(f.full_text))
    .toArray()).slice(0, 10)
})
</script>

<template>
  <div>
    <h1>Test</h1>
    <pre>{{ data }}</pre>
  </div>
</template>
