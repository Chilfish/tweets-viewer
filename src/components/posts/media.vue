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
const cols = size > 1 ? 2 : 1

const [openDialog, closeDialog] = useDialog()
const dialogId = 'media-preview'
</script>

<template>
  <div
    v-if="media.length"
    class="tweet-media grid gap-2px pt-2"
    :style="{
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
    }"
  >
    <div
      v-for="({ url, type, width, height }) in media"
      :key="url"
      class="relative"
    >
      <Image
        v-if="type !== 'video'"
        :class="cn({
          'max-h-100': size > 1,
          'max-w-80': height > width && size === 1,
        })"
        :src="url?.replace('name=orig', 'name=small')"
        :width="width ? `${width}px` : '100%'"
        :fit="size === 1 ? 'contain' : 'cover'"
        @click="openDialog(dialogId, {
          component: h(Image, {
            src: url,
            onClick: () => closeDialog(dialogId),
          }),
          id: dialogId,
          showClose: false,
        })"
        @error="() => $emit('error')"
      />
      <Video
        v-else
        class="max-h-100"
        :src="url"
        :height="height"
      />
    </div>
  </div>
</template>

<style>
#media-preview {
  background: none;
  box-shadow: none;
  border-color: transparent;
  border-radius: 1rem;
  padding: 0.6rem;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
