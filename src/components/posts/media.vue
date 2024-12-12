<script setup lang="tsx">
import type { TweetMedia } from '~/types'
import { useModal } from 'naive-ui'
import { h } from 'vue'
import Image from '../Image.vue'

const props = defineProps<{
  media: TweetMedia[]
}>()

defineEmits<{
  error: []
}>()

const size = props.media.length
const maxWidth = 900 // px
const maxHeight = 500 // px
const cols = size > 1 ? 2 : 1
const height = size > 1 ? maxHeight / 2 : maxHeight
const width = size > 1 ? maxWidth / 2 : maxWidth

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
      v-for="({ url, type }) in media"
      :key="url"
      class="relative"
    >
      <Image
        v-if="type !== 'video'"
        :src="url?.replace('name=orig', 'name=small')"
        :width="width"
        :height="height"
        :unset-width="size === 1"
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
