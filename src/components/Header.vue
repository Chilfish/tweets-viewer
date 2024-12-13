<script setup lang="ts">
import {
  CalendarSearch,
  History,
  Moon,
  Search,
  Sun,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { isDark } from '~/composables'
import { fallbackUser } from '~/constant'
import { useTweetStore } from '~/stores/tweets'
import { useUsersStore } from '~/stores/users'
import TwitterIcon from './icon/TwitterIcon'
import UserList from './UserList.vue'

const tweetStore = useTweetStore()
const usersStore = useUsersStore()
const router = useRouter()

const day = 24 * 60 * 60 * 1000

const tweetRange = computed(() => ({
  start: usersStore.curUser.tweetStart.getTime(),
  end: usersStore.curUser.tweetEnd.getTime(),
}))

function disableDate(ts: number) {
  return ts < tweetRange.value.start - day || ts > tweetRange.value.end
}

const dateRange = ref<[number, number]>([Date.now(), Date.now()])
watch(dateRange, async () => {
  const [start, end] = dateRange.value || []
  tweetStore.getTweetsByDateRange(start, end + day)
})

const searchText = ref(new URLSearchParams(location.search).get('q') || '')
function search() {
  router.push({
    query: {
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
        :to="`/@${tweetStore.screenName || fallbackUser}/memo`"
        title="那年今日"
      >
        <History class="h-6 w-6" />
      </RouterLink>
    </div>

    <div
      class="w-60 flex items-center gap-4 md:w-100"
    >
      <n-input
        v-model:value="searchText"
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
            search()
          }
        }"
      >
        <template #prefix>
          <Search
            class="h-4 w-4 cursor-pointer"
            @click="search"
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
