<script setup lang="ts">
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 md:w-50% md:p-4"
  >
    <template
      v-if="tweetStore.tweets.length"
    >
      <Header />
      <slot />
    </template>

    <div
      v-else
      class="w-full flex items-center justify-center pt-30"
    >
      <Loader class="animate-spin" />
    </div>

    <n-back-top :right="20" />
  </main>
</template>
