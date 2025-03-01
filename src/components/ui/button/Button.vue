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
    :class="cn(buttonVariants({ variant, size }), props.class)"
    @click="onClick"
  >
    <slot />
  </Primitive>
</template>
