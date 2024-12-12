<script setup lang="ts">
import Loading from '~/components/icon/Loading'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 md:w-50% md:p-4"
  >
    <Header />

    <Loading v-if="tweetStore.isLoading" />

    <slot />
    <n-back-top :right="20" />
  </main>
</template>
