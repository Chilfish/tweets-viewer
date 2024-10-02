<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { isGoodNetwork } from '~/composables'
import { placeholderSVG, proxyUrl } from '~/constant'

const props = defineProps<{
  src: string
  alt?: string
  width?: number
  height?: number
  unsetWidth?: boolean
} >()

const emits = defineEmits<{
  error: []
}>()

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement
      img.src = isGoodNetwork.value ? props.src : proxyUrl + props.src
      img.onerror = () => {
        console.warn('Image load failed:', img.src)

        emits('error')

        img.src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgMzUwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjM1MCI+CiAgPHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNjY2NjY2MiPjwvcmVjdD4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxOHB4IiBmaWxsPSIjMzMzMzMzIj7wn5iF5Yqg6L295aSx6LSlIOWPr+iDveaYr+iiq+WIoOmZpOS6hjwvdGV4dD4gICAKPC9zdmc+`
      }
      observer.unobserve(entry.target)
    }
  })
})

const imgRef = useTemplateRef<HTMLImageElement>('imgRef')
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
