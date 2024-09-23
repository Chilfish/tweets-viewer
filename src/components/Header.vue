<script setup lang="ts">
import { CalendarSearch, History, Moon, Search, Sun } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { isDark } from '~/composables'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()
const { start, end } = tweetStore.getTweetsRange()
const day = 24 * 60 * 60 * 1000

function disableDate(ts: number) {
  return ts < start - day || ts > end
}

const dateRange = ref<[number, number]>([end, end])
watch(dateRange, () => {
  const [start, end] = dateRange.value
  tweetStore.getTweetsByDateRange(start, end + day)
})
</script>

<template>
  <header
    class="flex items-center justify-between p-4"
  >
    <div class="flex items-center gap-4">
      <button
        title="Reset search"
        class="text-blue"
        @click="tweetStore.resetSearch"
      >
        <svg
          id="icon-twitter"
          xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
        ><path fill="currentColor" d="M14.058 3.41c-1.807.767-2.995 2.453-3.056 4.38L11 7.972l-.243-.023C8.365 7.68 6.259 6.437 4.813 4.418a1 1 0 0 0-1.685.092l-.097.186l-.049.099c-.719 1.485-1.19 3.29-1.017 5.203l.03.273c.283 2.263 1.5 4.215 3.779 5.679l.173.107l-.081.043c-1.315.663-2.518.952-3.827.9c-1.056-.04-1.446 1.372-.518 1.878c3.598 1.961 7.461 2.566 10.792 1.6c4.06-1.18 7.152-4.223 8.335-8.433l.127-.495c.238-.993.372-2.006.401-3.024l.003-.332l.393-.779l.44-.862l.214-.434l.118-.247c.265-.565.456-1.033.574-1.43l.014-.056l.008-.018c.22-.593-.166-1.358-.941-1.358l-.122.007a1 1 0 0 0-.231.057l-.086.038a8 8 0 0 1-.88.36l-.356.115l-.271.08l-.772.214c-1.336-1.118-3.144-1.254-5.012-.554l-.211.084z" /></svg>
      </button>

      <button
        class="h-6 w-6"
        @click="() => isDark = !isDark"
      >
        <Sun v-if="!isDark" />
        <Moon v-else />
      </button>

      <RouterLink
        :to="`@${tweetStore.user?.name}/memo`"
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
            tweetStore.search()
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
