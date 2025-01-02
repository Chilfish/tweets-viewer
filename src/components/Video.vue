<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { isGoodNetwork } from '~/composables'
import { proxyUrl } from '~/constant'

const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const video = entry.target as HTMLVideoElement

      video.src = isGoodNetwork.value ? props.src : proxyUrl + props.src
      video.onerror = (e) => {
        console.error(e)
        video.remove()
      }
      observer.unobserve(entry.target)
    }
  })
})

const videoRef = useTemplateRef<HTMLVideoElement>('videoRef')
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
    :height="height ? `${height}px` : 'auto'"
    :width="width ? `${width}px` : 'auto'"
  />
</template>
