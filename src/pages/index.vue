<script setup lang="tsx">
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { DateRange } from 'radix-vue'
import { getLocalTimeZone, today } from '@internationalized/date'

const start = today(getLocalTimeZone())

const minDate = start.set({
  year: 2021,
  month: 1,
  day: 1,
})

const maxDate = start.set({
  year: 2024,
  month: 12,
  day: 31,
})

const date = ref({
  start,
  end: start.add({ days: 7 }),
}) as Ref<DateRange>
</script>

<template>
  <div class="w-fit">
    <RangeCalendar
      v-model="date"
      :max-value="maxDate"
      :min-value="minDate"
      class="border border-gray-300 rounded-lg"
    />
  </div>

  <pre class="mt-4">{{ date }}</pre>
</template>
