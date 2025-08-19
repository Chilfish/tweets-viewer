<script setup lang="ts">
import { Moon, Search, Sun } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input } from '~/components/ui/input'
import { isDark } from '~/composables'
import TwitterIcon from './icon/TwitterIcon'

const router = useRouter()
const route = useRoute()

const searchText = ref(new URLSearchParams(location.search).get('q') || '')
function search() {
  router.push({
    query: {
      ...route.query,
      q: searchText.value,
    },
  })
}
</script>

<template>
  <header
    class="flex items-center justify-between px-4 py-2"
  >
    <div class="center gap-4">
      <RouterLink
        to="/"
      >
  <TwitterIcon class="h-6 w-6" />
      </RouterLink>
 
      <button
        class="h-6 w-6"
        @click="() => isDark = !isDark"
      >
        <Sun v-if="!isDark" />
        <Moon v-else />
      </button>
    </div>

    <div
      class="w-60 flex items-center gap-4 md:w-100"
    >
      <div class="relative max-w-sm w-full items-center rounded-lg bg-background">
        <Input
          id="tweets-search"
          v-model="searchText"
          type="text"
          placeholder="Search..."
          class="pl-10"
          @keydown="(e: any) => {
            if (e.key === 'Enter') {
              search()
            }
          }"
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
          <Search
            class="cursor- pointer size-6 text-muted-foreground" @click="search"
          />
        </span>
      </div>
    </div>
  </header>
</template>

<style>
.n-date-panel.n-date-panel--daterange.n-date-panel--shadow {
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
}
@media (min-width: 768px) {
  .n-date-panel.n-date-panel--daterange.n-date-panel--shadow {
    display: grid;
  }
}
</style>
