<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const video = entry.target as HTMLVideoElement

      video.src = props.src
      video.onerror = (e) => {
        console.error(e)
        video.src = ''
      }
      observer.unobserve(entry.target)
    }
  })
})

const videoRef = ref<HTMLVideoElement | null>(null)

onMounted(() => {
  if (videoRef.value) {
    observer.observe(videoRef.value)
  }
})
</script>

<template>
  <video
    ref="videoRef"
    src=""
    controls
    class="rounded-lg object-contain"
    :height="height"
    :width="width"
    :style="{
      maxHeight: `${height}px`,
    }"
  />
</template>
