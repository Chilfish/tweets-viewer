<script setup lang="tsx">
import { ref } from 'vue'
import { getLocalTimeZone, today } from '@internationalized/date'

const tz = getLocalTimeZone()
const start = today(tz).toDate(tz).getTime()

const dateRange = ref<[number, number]>([start, start])
</script>

<template>
  <div class="w-fit">
    <n-date-picker
      v-model:value="dateRange"
      type="daterange"
      clearable
    />
  </div>

  <pre class="mt-4">{{ dateRange }}</pre>
</template>
