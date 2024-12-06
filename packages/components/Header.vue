<script setup lang="ts">
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tweets-viewer/components/ui/popover'
import { isDark, useTweetStore } from '@tweets-viewer/core'
import {
  CalendarSearch,
  History,
  Moon,
  Search,
  Sun,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import TwitterIcon from './icon/TwitterIcon'
import UserList from './UserList.vue'

const tweetStore = useTweetStore()
const range = computed(() => tweetStore.curConfig.tweetRange)
const day = 24 * 60 * 60 * 1000

function disableDate(ts: number) {
  return ts < range.value.start - day || ts > range.value.end
}

const dateRange = ref<[number, number]>([range.value.end, range.value.end])
watch(dateRange, async () => {
  const [start, end] = dateRange.value || []
  tweetStore.getTweetsByDateRange(start, end + day)
})
</script>

<template>
  <header
    class="flex items-center justify-between px-4 py-2"
  >
    <div class="center gap-4">
      <Popover>
        <PopoverTrigger>
          <TwitterIcon class="h-6 w-6" />
        </PopoverTrigger>

        <PopoverContent
          class="w-52 p-3 text-3.5"
        >
          <div class="flex items-center gap-3 pb-2 pl-1">
            <span>
              新帖子在前
            </span>
            <n-switch
              v-model:value="tweetStore.isReverse"
              size="small"
            />
          </div>
          <UserList />
        </PopoverContent>
      </Popover>

      <button
        class="h-6 w-6"
        @click="() => isDark = !isDark"
      >
        <Sun v-if="!isDark" />
        <Moon v-else />
      </button>

      <RouterLink
        :to="`/@${tweetStore.curUser()}/memo`"
        title="那年今日"
      >
        <History class="h-6 w-6" />
      </RouterLink>
    </div>

    <div
      class="w-60 flex items-center gap-4 md:w-100"
    >
      <n-input
        v-model:value="tweetStore.searchText"
        placeholder="Search"
        :input-props="{
          'aria-label': 'Search',
          'aria-describedby': 'tweets search',
          'type': 'search',
          'id': 'tweets-search',
        }"
        class="p-1"
        @keydown="(e: any) => {
          if (e.key === 'Enter') {
            $router.push({
              query: {
                q: tweetStore.searchText,
              },
            })
          }
        }"
      >
        <template #prefix>
          <Search
            class="h-4 w-4 cursor-pointer"
            @click="() => tweetStore.search()"
          />
        </template>
      </n-input>

      <n-popover
        trigger="click"
        placement="bottom"
        :show-arrow="false"
      >
        <template #trigger>
          <button>
            <CalendarSearch class="h-6 w-6" />
          </button>
        </template>

        <div class="w-fit p-2">
          <p class="mb-4 text-4">
            选择搜索的日期范围
          </p>

          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            clearable
            bind-calendar-months
            :is-date-disabled="disableDate"
          />
        </div>
      </n-popover>
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
