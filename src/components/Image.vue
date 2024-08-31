<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { placeholderSVG, proxyUrl } from '~/constant'
import { isGoodNetwork } from '~/composables'

const props = defineProps<{
  src: string
  alt?: string
  width?: number
  height?: number
  unsetWidth?: boolean
} >()

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement
      img.src = isGoodNetwork.value ? proxyUrl + props.src : props.src
      img.onerror = () => {
        img.src = placeholderSVG
      }
      observer.unobserve(entry.target)
    }
  })
})

const imgRef = ref<HTMLImageElement | null>(null)
onMounted(() => {
  if (imgRef.value) {
    observer.observe(imgRef.value)
  }
})
</script>

<template>
  <img
    ref="imgRef"
    class="rounded-lg object-cover"
    :alt
    loading="lazy"
    referrerpolicy="no-referrer"
    :src="placeholderSVG"
    :style="{
      objectFit: 'cover',
      height: `${height}px`,
      width: unsetWidth ? undefined : `${width}px`,
    }"
  >
</template>
