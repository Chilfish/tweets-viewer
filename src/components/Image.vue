<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { placeholderSVG } from '~/constant'

const props = defineProps<{
  src: string
  alt?: string
  width?: number
  height?: number
} >()

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement
      img.src = props.src
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
    :height
    :width
    loading="lazy"
    referrerpolicy="no-referrer"
    :src="placeholderSVG"
    :style="{
      aspectRatio: `${props.width}/${props.height}`,
      objectFit: 'cover',
      height: `${props.height}px`,
      width: `${props.width}px`,
    }"
  >
</template>
