<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col gap-1 rounded-md border py-6 shadow',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
