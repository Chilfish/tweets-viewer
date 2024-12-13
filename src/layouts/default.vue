<script setup lang="ts">
import { onBeforeMount } from 'vue'
import Loading from '~/components/icon/Loading'

import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()

onBeforeMount(async () => {
  tweetStore.isLoading = true
  await usersStore.fetchUsers()
  tweetStore.isLoading = false
})
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
