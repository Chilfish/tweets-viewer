<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { ArrowUp } from 'lucide-vue-next'
import { ref } from 'vue'
import { Button } from './ui/button'

const show = ref(false)

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const lastScrollY = ref(0)

function handleScroll() {
  const currentScrollY = window.scrollY

  const isScrollDown = currentScrollY > lastScrollY.value

  show.value = !isScrollDown

  lastScrollY.value = currentScrollY
}

useEventListener(window, 'scroll', handleScroll)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <Button
      v-show="show"
      variant="default"
      size="icon"
      class="fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-200"
      @click="scrollToTop"
    >
      <ArrowUp class="h-5 w-5" />
    </Button>
  </Transition>
</template>
