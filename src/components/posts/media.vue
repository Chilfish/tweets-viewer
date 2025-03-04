<script setup lang="tsx">
import type { TweetMedia } from '~/types'
import { h } from 'vue'
import { useDialog } from '~/components/ui/dialog'
import { cn } from '~/utils'
import Image from '../Image.vue'

const props = defineProps<{
  media: TweetMedia[]
}>()

defineEmits<{
  error: []
}>()

const size = props.media.length

const [openDialog, closeDialog] = useDialog()
const dialogId = 'media-preview'
</script>

<template>
  <div
    v-if="media.length"
    class="tweet-media grid gap-2 pt-2"
    :class="{
      'grid-cols-2': size > 1,
      'grid-cols-1': size === 1,
    }"
  >
    <div
      v-for="({ url, type, width, height }) in media"
      :key="url"
      class="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
    >
      <Image
        v-if="type !== 'video'"
        :class="cn({
          'max-h-[512px]': size === 1,
          'max-h-[320px]': size > 1,
          'max-w-[80%] mx-auto': height > width && size === 1,
        })"
        :src="url.replace('name=orig', 'name=medium')"
        :width="width ? `${width}px` : '100%'"
        :fit="size === 1 ? 'contain' : 'cover'"
        class="transition-transform duration-300 group-hover:scale-105"
        @click="openDialog(dialogId, {
          component: h(Image, {
            src: url.replace('name=orig', 'name=4096x4096'),
            onClick: () => closeDialog(dialogId),
            class: 'max-h-[90vh] max-w-[90vw] object-contain',
          }),
          id: dialogId,
          showClose: false,
        })"
        @error="() => $emit('error')"
      />
      <Video
        v-else
        class="max-h-[512px] w-full"
        :src="url"
        :height="height"
      />
    </div>
  </div>
</template>

<style>
#media-preview {
  background: rgba(0, 0, 0, 0.8);
  box-shadow: none;
  border-color: transparent;
  border-radius: 0;
  padding: 1rem;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.dark #media-preview {
  background: rgba(0, 0, 0, 0.9);
}
</style>
