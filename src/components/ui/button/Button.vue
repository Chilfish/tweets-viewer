<script setup lang="ts">
import type { PrimitiveProps } from 'radix-vue'
import type { ButtonHTMLAttributes, HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { Primitive } from 'radix-vue'
import { cn } from '~/utils'
import { buttonVariants } from '.'

type Props = PrimitiveProps & /* @vue-ignore */ ButtonHTMLAttributes & {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  onClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(
      'radix-btn',
      buttonVariants({ variant, size }),
      props.class,
    )"
    @click="onClick"
  >
    <slot />
  </Primitive>
</template>

<style scoped>
.radix-btn {
  @apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50;
}
</style>
