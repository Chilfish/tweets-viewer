<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { isGoodNetwork } from '~/composables'
import { placeholderSVG, proxyUrl } from '~/constant'

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  width?: stirng
  height?: string
  unsetWidth?: boolean
  lazy?: boolean
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
}>(), {
  lazy: true,
  fit: 'contain',
})

const emits = defineEmits<{
  error: []
}>()

function setSrc(url: string) {
  if (isGoodNetwork.value) {
    return url
  }
  return proxyUrl + url
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement
      const src = setSrc(props.src)
      img.src = src

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
    if (props.lazy)
      observer.observe(imgRef.value)
    else
      imgRef.value.src = setSrc(props.src)
  }
})
onUnmounted(() => {
  observer.disconnect()
})

watch(() => props.src, () => {
  if (imgRef.value) {
    observer.observe(imgRef.value)
  }
})
</script>

<template>
  <img
    ref="imgRef"
    class="rounded-lg object-cover"
    :loading="lazy ? 'lazy' : 'eager'"
    referrerpolicy="no-referrer"
    :alt
    :src="placeholderSVG"
    :style="{
      objectFit: fit,
      height: height ? height : '100%',
      width: width && width !== 'full' ? width : '100%',
    }"
  >
</template>
