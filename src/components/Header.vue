<script setup lang="ts">
import type { DateRange } from 'reka-ui'
import type { Ref } from 'vue'
import { getLocalTimeZone, today } from '@internationalized/date'
import {
  CalendarSearch,
  History,
  Moon,
  Search,
  Sun,
} from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { RangeCalendar } from '~/components/ui/range-calendar'
import { Switch } from '~/components/ui/switch'
import { isDark } from '~/composables'
import { fallbackUser } from '~/constant'
import { useTweetStore } from '~/stores/tweets'
import TwitterIcon from './icon/TwitterIcon'
import UserList from './UserList.vue'

const tweetStore = useTweetStore()
const router = useRouter()

const dateRange = ref({
  start: today(getLocalTimeZone()),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>

watch(dateRange, async () => {
  const { start, end } = dateRange.value || {}

  if (start && end) {
    const tz = getLocalTimeZone()
    const startTs = start.toDate(tz).getTime()
    const endTs = end.toDate(tz).getTime()
    tweetStore.getTweetsByDateRange(startTs, endTs)
  }
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
            <Label
              for="reverse-tweets"
            >
              新帖子在前
            </Label>
            <Switch
              id="reverse-tweets"
              v-model="tweetStore.isReverse"
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
      <Search
        class="h-4 w-4 cursor-pointer"
        @click="search"
      />
      <Input
        id="tweets-search"
        v-model="searchText"
        placeholder="Search"
        class="p-1"
        @keydown="(e: any) => {
          if (e.key === 'Enter') {
            search()
          }
        }"
      />

      <Popover>
        <PopoverTrigger>
          <CalendarSearch class="h-6 w-6" />
        </PopoverTrigger>
        <PopoverContent class="w-auto p-4">
          <p class="mb-4 text-sm">
            选择搜索的日期范围
          </p>

          <RangeCalendar
            v-model="dateRange"
          />
        </PopoverContent>
      </Popover>
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
