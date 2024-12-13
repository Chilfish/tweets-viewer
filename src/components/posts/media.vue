<script setup lang="tsx">
import type { TweetMedia } from '~/types'
import { useModal } from 'naive-ui'
import { h } from 'vue'
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

const modal = useModal()
</script>

<template>
  <div
    v-if="media.length"
    class="grid gap-2px py-2"
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
          'max-h-80': size > 1,
          'max-w-80': height > width && size === 1,
        })"
        :src="url?.replace('name=orig', 'name=small')"
        :width="width"
        :fit="size === 1 ? 'contain' : 'cover'"
        @click="modal.create({
          style: {
            width: 'auto',
            height: 'auto',
            padding: 0,
          },
          contentStyle: {
            padding: 0,
            borderRadius: '2px',
          },
          size: 'medium',
          bordered: false,
          closable: false,
          preset: 'card',
          content: () => h(Image, {
            src: url?.replace('name=orig', 'name=small'),
          }),
        })"
        @error="() => $emit('error')"
      />
      <Video
        v-else
        :src="url"
        :width="width"
        :height="height"
      />
    </div>
  </div>
</template>
