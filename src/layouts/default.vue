<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import Loading from '~/components/icon/Loading'

import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()
const route = useRoute()

onBeforeMount(async () => {
  tweetStore.isLoading = route.name !== 'index'

  await usersStore.fetchUsers()
  tweetStore.isLoading = false
})
</script>

<template>
  <main
    class="mx-auto flex flex-col gap-0 transition-all duration-300 lg:w-60vw xl:w-50vw md:p-4"
  >
    <Header />

    <slot />

    <Loading v-if="tweetStore.isLoading" />

    <n-back-top :right="20" />
  </main>
</template>
